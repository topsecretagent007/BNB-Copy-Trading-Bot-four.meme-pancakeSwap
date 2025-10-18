import { ethers } from 'ethers';
import { BlockchainService } from './blockchain';
import { logger } from '../utils/logger';
import { config } from '../config';
import { WBNB_ADDRESS } from '../contracts/pancakeswap';

export interface TradeEvent {
  type: 'BUY' | 'SELL';
  walletAddress: string;
  tokenAddress: string;
  amountBNB: string;
  txHash: string;
  timestamp: number;
  dex: string;
  routerAddress: string;
}

export class WalletMonitor {
  private isMonitoring = false;
  private processedTxs = new Set<string>();

  constructor(
    private blockchain: BlockchainService,
    private onTradeDetected: (trade: TradeEvent) => Promise<void>
  ) {}

  async start(): Promise<void> {
    if (this.isMonitoring) {
      logger.warn('Monitor is already running');
      return;
    }

    this.isMonitoring = true;
    logger.info('🔍 Starting wallet monitor...');
    logger.info(`Monitoring ${config.targetWallets.length} wallet(s):`);
    config.targetWallets.forEach(wallet => {
      logger.info(`  - ${wallet}`);
    });
    logger.info(`Monitored DEXes: ${config.monitoredDexes.join(', ')}`);

    // Subscribe to pending transactions
    this.blockchain.provider.on('pending', async (txHash: string) => {
      if (!this.isMonitoring) return;
      await this.processPendingTransaction(txHash);
    });

    // Also monitor confirmed blocks as backup
    this.blockchain.provider.on('block', async (blockNumber: number) => {
      if (!this.isMonitoring) return;
      await this.processBlock(blockNumber);
    });

    logger.info('✅ Monitor started successfully');
  }

  stop(): void {
    if (!this.isMonitoring) {
      logger.warn('Monitor is not running');
      return;
    }

    this.isMonitoring = false;
    this.blockchain.provider.removeAllListeners('pending');
    this.blockchain.provider.removeAllListeners('block');
    logger.info('Monitor stopped');
  }

  private async processPendingTransaction(txHash: string): Promise<void> {
    try {
      // Skip if already processed
      if (this.processedTxs.has(txHash)) {
        return;
      }

      const tx = await this.blockchain.getTransaction(txHash);
      if (!tx) return;

      await this.analyzeTransaction(tx);
    } catch (error) {
      // Silently ignore errors for pending transactions (they're common)
    }
  }

  private async processBlock(blockNumber: number): Promise<void> {
    try {
      const block = await this.blockchain.provider.getBlock(blockNumber, true);
      if (!block || !block.transactions) return;

      for (const tx of block.transactions) {
        if (typeof tx === 'string') continue;
        await this.analyzeTransaction(tx);
      }
    } catch (error) {
      logger.error(`Error processing block ${blockNumber}:`, error);
    }
  }

  private async analyzeTransaction(tx: ethers.TransactionResponse): Promise<void> {
    try {
      // Skip if already processed
      if (this.processedTxs.has(tx.hash)) {
        return;
      }

      // Check if transaction is from a target wallet
      const fromAddress = tx.from.toLowerCase();
      if (!config.targetWallets.some(wallet => wallet.toLowerCase() === fromAddress)) {
        return;
      }

      // Check if it's interacting with monitored DEX routers
      const toAddress = tx.to?.toLowerCase();
      const monitoredRouters = [];
      
      if (config.monitoredDexes.includes('pancakeswap')) {
        monitoredRouters.push(config.pancakeswapRouterV2.toLowerCase());
      }
      if (config.monitoredDexes.includes('fourmeme')) {
        monitoredRouters.push(config.fourMemeRouter.toLowerCase());
      }
      
      if (!toAddress || !monitoredRouters.includes(toAddress)) {
        return;
      }

      // Mark as processed
      this.processedTxs.add(tx.hash);

      // Clean up old processed transactions (keep last 1000)
      if (this.processedTxs.size > 1000) {
        const txArray = Array.from(this.processedTxs);
        this.processedTxs = new Set(txArray.slice(-1000));
      }

      // Determine which DEX
      const dexName = this.getDexName(tx.to?.toLowerCase() || '');
      logger.info(`🎯 Target wallet transaction detected on ${dexName}: ${tx.hash}`);

      // Decode the transaction data
      const tradeEvent = await this.decodeSwapTransaction(tx, dexName);
      if (tradeEvent) {
        logger.info(`📊 Trade detected: ${tradeEvent.type} ${tradeEvent.tokenAddress} on ${dexName}`);
        await this.onTradeDetected(tradeEvent);
      }
    } catch (error) {
      logger.error('Error analyzing transaction:', error);
    }
  }

  private getDexName(routerAddress: string): string {
    if (routerAddress === config.pancakeswapRouterV2.toLowerCase()) {
      return 'PancakeSwap';
    } else if (routerAddress === config.fourMemeRouter.toLowerCase()) {
      return 'four.meme';
    }
    return 'Unknown DEX';
  }

  private async decodeSwapTransaction(tx: ethers.TransactionResponse, dexName: string): Promise<TradeEvent | null> {
    try {
      const iface = new ethers.Interface([
        'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline)',
        'function swapExactETHForTokensSupportingFeeOnTransferTokens(uint amountOutMin, address[] calldata path, address to, uint deadline)',
        'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline)',
        'function swapExactTokensForETHSupportingFeeOnTransferTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline)',
        'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline)',
      ]);

      if (!tx.data) return null;

      const decoded = iface.parseTransaction({ data: tx.data, value: tx.value });
      if (!decoded) return null;

      const functionName = decoded.name;
      const path = decoded.args.path as string[];

      // Determine trade type and token
      let type: 'BUY' | 'SELL';
      let tokenAddress: string;
      let amountBNB: string;

      if (functionName.includes('swapExactETHForTokens')) {
        // BUY: BNB -> Token
        type = 'BUY';
        tokenAddress = path[path.length - 1];
        amountBNB = ethers.formatEther(tx.value || 0n);
      } else if (functionName.includes('swapExactTokensForETH')) {
        // SELL: Token -> BNB
        type = 'SELL';
        tokenAddress = path[0];
        
        // For sell, we need to estimate BNB amount from the token amount
        const amountIn = decoded.args.amountIn;
        // We'll set this to the minimum expected out as approximation
        const amountOutMin = decoded.args.amountOutMin;
        amountBNB = ethers.formatEther(amountOutMin || 0n);
      } else {
        // Other swap types (token to token)
        return null;
      }

      // Validate token address
      if (!ethers.isAddress(tokenAddress)) {
        return null;
      }

      // Check if token is blacklisted
      if (config.blacklistedTokens.includes(tokenAddress.toLowerCase())) {
        logger.warn(`Token ${tokenAddress} is blacklisted, skipping`);
        return null;
      }

      return {
        type,
        walletAddress: tx.from,
        tokenAddress,
        amountBNB,
        txHash: tx.hash,
        timestamp: Date.now(),
        dex: dexName,
        routerAddress: tx.to || '',
      };
    } catch (error) {
      logger.debug('Could not decode transaction (might not be a swap)');
      return null;
    }
  }

  isRunning(): boolean {
    return this.isMonitoring;
  }
}

