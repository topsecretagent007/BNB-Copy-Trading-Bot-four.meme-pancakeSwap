import { BlockchainService } from './blockchain';
import { PancakeSwapService } from './pancakeswap';
import { TelegramNotifier } from './telegram';
import { TradeEvent } from './monitor';
import { logger } from '../utils/logger';
import { config } from '../config';
import BigNumber from 'bignumber.js';

export class TradeCopier {
  private activeTrades = new Map<string, TradeEvent>();
  private tradeHistory = new Map<string, Date>();

  constructor(
    private blockchain: BlockchainService,
    private pancakeswap: PancakeSwapService,
    private telegram: TelegramNotifier | null
  ) {}

  async copyTrade(trade: TradeEvent): Promise<void> {
    try {
      logger.info(`🔄 Starting to copy trade from ${trade.walletAddress}`);
      logger.info(`DEX: ${trade.dex}, Type: ${trade.type}, Token: ${trade.tokenAddress}, Amount: ${trade.amountBNB} BNB`);

      // Send Telegram alert (if configured)
      if (this.telegram) {
        await this.telegram.sendTradeAlert(
          trade.type,
          trade.walletAddress,
          trade.tokenAddress,
          trade.amountBNB,
          trade.txHash
        );
      }

      // Perform safety checks
      const safetyChecksPassed = await this.performSafetyChecks(trade);
      if (!safetyChecksPassed) {
        logger.warn('Safety checks failed, skipping trade');
        if (this.telegram) {
          await this.telegram.sendCopyTradeResult(
            false,
            trade.type,
            trade.tokenAddress,
            trade.amountBNB,
            undefined,
            'Safety checks failed'
          );
        }
        return;
      }

      // Calculate trade amount based on copy percentage
      const tradeAmount = this.calculateTradeAmount(trade.amountBNB);
      if (!tradeAmount) {
        logger.warn('Trade amount out of configured range, skipping');
        return;
      }

      logger.info(`Calculated copy amount: ${tradeAmount} BNB (${config.copyPercentage}% of original)`);

      // Execute the trade on the same DEX
      let txHash: string | null = null;

      if (trade.type === 'BUY') {
        txHash = await this.executeBuy(trade.tokenAddress, tradeAmount, trade.routerAddress);
      } else {
        txHash = await this.executeSell(trade.tokenAddress, trade.routerAddress);
      }

      if (txHash) {
        logger.info(`✅ Successfully copied ${trade.type} trade: ${txHash}`);
        if (this.telegram) {
          await this.telegram.sendCopyTradeResult(
            true,
            trade.type,
            trade.tokenAddress,
            tradeAmount,
            txHash
          );
        }

        // Track the trade
        if (trade.type === 'BUY') {
          this.activeTrades.set(trade.tokenAddress.toLowerCase(), trade);
        } else {
          this.activeTrades.delete(trade.tokenAddress.toLowerCase());
        }
      } else {
        logger.error(`Failed to copy ${trade.type} trade`);
        if (this.telegram) {
          await this.telegram.sendCopyTradeResult(
            false,
            trade.type,
            trade.tokenAddress,
            tradeAmount,
            undefined,
            'Transaction execution failed'
          );
        }
      }
    } catch (error) {
      logger.error('Error copying trade:', error);
      if (this.telegram) {
        await this.telegram.sendError(`Failed to copy trade: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  private async performSafetyChecks(trade: TradeEvent): Promise<boolean> {
    try {
      // Check 1: Verify token info is accessible
      const tokenInfo = await this.pancakeswap.getTokenInfo(trade.tokenAddress);
      if (!tokenInfo) {
        logger.warn('Cannot get token info');
        return false;
      }

      logger.info(`Token: ${tokenInfo.name} (${tokenInfo.symbol})`);

      // Check 2: Check liquidity
      if (config.minLiquidityUsd > 0) {
        const liquidity = await this.pancakeswap.checkLiquidity(trade.tokenAddress);
        logger.info(`Token liquidity: $${liquidity.toFixed(2)}`);

        if (liquidity < config.minLiquidityUsd) {
          logger.warn(`Liquidity too low: $${liquidity} < $${config.minLiquidityUsd}`);
          return false;
        }
      }

      // Check 3: Rate limiting (don't copy the same token too frequently)
      const lastTradeTime = this.tradeHistory.get(trade.tokenAddress.toLowerCase());
      if (lastTradeTime) {
        const timeSinceLastTrade = Date.now() - lastTradeTime.getTime();
        const minTimeBetweenTrades = 60000; // 1 minute

        if (timeSinceLastTrade < minTimeBetweenTrades) {
          logger.warn('Rate limit: Too soon since last trade for this token');
          return false;
        }
      }

      // Check 4: Verify we have enough balance
      const balance = await this.blockchain.getBalance(this.blockchain.wallet.address);
      const balanceNum = parseFloat(balance);

      if (trade.type === 'BUY') {
        const tradeAmount = this.calculateTradeAmount(trade.amountBNB);
        if (tradeAmount && balanceNum < parseFloat(tradeAmount) + 0.01) {
          logger.warn(`Insufficient BNB balance: ${balance} BNB`);
          return false;
        }
      } else {
        // For sells, check if we actually own the token
        const tokenBalance = await this.blockchain.getTokenBalance(
          trade.tokenAddress,
          this.blockchain.wallet.address
        );
        if (tokenBalance === '0') {
          logger.warn('Cannot sell: No token balance');
          return false;
        }
      }

      // Update trade history
      this.tradeHistory.set(trade.tokenAddress.toLowerCase(), new Date());

      logger.info('✅ All safety checks passed');
      return true;
    } catch (error) {
      logger.error('Error performing safety checks:', error);
      return false;
    }
  }

  private calculateTradeAmount(originalAmount: string): string | null {
    try {
      const original = new BigNumber(originalAmount);
      const percentage = new BigNumber(config.copyPercentage).dividedBy(100);
      const calculated = original.multipliedBy(percentage);

      const calculatedNum = calculated.toNumber();

      // Check if within configured range
      if (calculatedNum < config.minBnbAmount) {
        logger.warn(`Calculated amount ${calculatedNum} BNB is below minimum ${config.minBnbAmount} BNB`);
        return null;
      }

      if (calculatedNum > config.maxBnbAmount) {
        logger.info(`Calculated amount ${calculatedNum} BNB exceeds maximum, capping at ${config.maxBnbAmount} BNB`);
        return config.maxBnbAmount.toString();
      }

      return calculated.toFixed(6);
    } catch (error) {
      logger.error('Error calculating trade amount:', error);
      return null;
    }
  }

  private async executeBuy(tokenAddress: string, amountBNB: string, routerAddress: string): Promise<string | null> {
    try {
      logger.info(`Executing BUY: ${amountBNB} BNB -> ${tokenAddress}`);
      return await this.pancakeswap.buyToken(
        tokenAddress,
        amountBNB,
        config.slippageTolerance,
        routerAddress
      );
    } catch (error) {
      logger.error('Error executing buy:', error);
      return null;
    }
  }

  private async executeSell(tokenAddress: string, routerAddress: string): Promise<string | null> {
    try {
      // Get our token balance
      const balanceStr = await this.blockchain.getTokenBalance(
        tokenAddress,
        this.blockchain.wallet.address
      );

      if (balanceStr === '0') {
        logger.warn('No tokens to sell');
        return null;
      }

      const balance = BigInt(balanceStr);
      logger.info(`Executing SELL: ${balance.toString()} tokens -> BNB`);

      return await this.pancakeswap.sellToken(
        tokenAddress,
        balance,
        config.slippageTolerance,
        routerAddress
      );
    } catch (error) {
      logger.error('Error executing sell:', error);
      return null;
    }
  }

  getActiveTrades(): Map<string, TradeEvent> {
    return this.activeTrades;
  }

  getTradeHistory(): Map<string, Date> {
    return this.tradeHistory;
  }
}

