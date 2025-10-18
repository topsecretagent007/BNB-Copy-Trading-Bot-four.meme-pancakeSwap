import { config, validateConfig } from './config';
import { logger } from './utils/logger';
import { BlockchainService } from './services/blockchain';
import { PancakeSwapService } from './services/pancakeswap';
import { TelegramNotifier } from './services/telegram';
import { WalletMonitor } from './services/monitor';
import { TradeCopier } from './services/tradeCopier';
import { TradeEvent } from './services/monitor';

class CopyTradingBot {
  private blockchain: BlockchainService;
  private pancakeswap: PancakeSwapService;
  private telegram: TelegramNotifier | null;
  private monitor: WalletMonitor;
  private tradeCopier: TradeCopier;
  private isRunning = false;

  constructor() {
    this.blockchain = new BlockchainService();
    this.pancakeswap = new PancakeSwapService(this.blockchain);
    // Telegram is optional for CLI mode
    this.telegram = (config.telegramBotToken && config.telegramChatId) ? new TelegramNotifier() : null;
    this.tradeCopier = new TradeCopier(this.blockchain, this.pancakeswap, this.telegram);
    this.monitor = new WalletMonitor(this.blockchain, this.handleTradeDetected.bind(this));
  }

  async initialize(): Promise<void> {
    try {
      logger.info('='.repeat(60));
      logger.info('🚀 BNB Copy Trading Bot - Initializing...');
      logger.info('='.repeat(60));

      // Validate configuration
      validateConfig();

      // Initialize blockchain service
      await this.blockchain.initialize();

      // Send startup notification (if Telegram is configured)
      if (this.telegram) {
        await this.telegram.sendStartupMessage();
      }

      logger.info('='.repeat(60));
      logger.info('✅ Initialization complete');
      logger.info('='.repeat(60));
    } catch (error) {
      logger.error('Failed to initialize bot:', error);
      if (this.telegram) {
        await this.telegram.sendError(`Failed to initialize bot: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      throw error;
    }
  }

  async start(): Promise<void> {
    try {
      if (this.isRunning) {
        logger.warn('Bot is already running');
        return;
      }

      this.isRunning = true;

      logger.info('='.repeat(60));
      logger.info('🤖 Starting Copy Trading Bot...');
      logger.info('='.repeat(60));

      // Start monitoring target wallets
      await this.monitor.start();

      logger.info('='.repeat(60));
      logger.info('✅ Bot is now running and monitoring trades');
      logger.info(`📊 Target wallets: ${config.targetWallets.length}`);
      logger.info(`💰 Trade range: ${config.minBnbAmount} - ${config.maxBnbAmount} BNB`);
      logger.info(`📈 Copy percentage: ${config.copyPercentage}%`);
      logger.info(`⚙️ Slippage tolerance: ${config.slippageTolerance}%`);
      logger.info('='.repeat(60));

      // Keep the process running
      this.setupGracefulShutdown();
    } catch (error) {
      logger.error('Failed to start bot:', error);
      if (this.telegram) {
        await this.telegram.sendError(`Failed to start bot: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      throw error;
    }
  }

  private async handleTradeDetected(trade: TradeEvent): Promise<void> {
    try {
      logger.info('='.repeat(60));
      logger.info(`🎯 Trade Detected!`);
      logger.info(`DEX: ${trade.dex}`);
      logger.info(`Type: ${trade.type}`);
      logger.info(`Wallet: ${trade.walletAddress}`);
      logger.info(`Token: ${trade.tokenAddress}`);
      logger.info(`Amount: ${trade.amountBNB} BNB`);
      logger.info(`TX: ${trade.txHash}`);
      logger.info('='.repeat(60));

      // Copy the trade
      await this.tradeCopier.copyTrade(trade);
    } catch (error) {
      logger.error('Error handling trade detection:', error);
    }
  }

  stop(): void {
    if (!this.isRunning) {
      logger.warn('Bot is not running');
      return;
    }

    logger.info('Stopping bot...');
    this.isRunning = false;
    this.monitor.stop();
    logger.info('Bot stopped');
  }

  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully...`);
      this.stop();
      if (this.telegram) {
        await this.telegram.sendMessage('🛑 Bot stopped');
      }
      process.exit(0);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGUSR2', () => shutdown('SIGUSR2')); // For nodemon

    process.on('uncaughtException', async (error) => {
      logger.error('Uncaught exception:', error);
      if (this.telegram) {
        await this.telegram.sendError(`Uncaught exception: ${error.message}`);
      }
      this.stop();
      process.exit(1);
    });

    process.on('unhandledRejection', async (reason, promise) => {
      logger.error('Unhandled rejection at:', promise, 'reason:', reason);
      if (this.telegram) {
        await this.telegram.sendError(`Unhandled rejection: ${reason}`);
      }
    });
  }

  isActive(): boolean {
    return this.isRunning;
  }
}

// Main execution
async function main() {
  try {
    const bot = new CopyTradingBot();
    await bot.initialize();
    await bot.start();
  } catch (error) {
    logger.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run the bot
if (require.main === module) {
  main();
}

export { CopyTradingBot };

