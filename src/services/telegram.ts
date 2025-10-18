import TelegramBot from 'node-telegram-bot-api';
import { config } from '../config';
import { logger } from '../utils/logger';

export class TelegramNotifier {
  private bot: TelegramBot | null = null;
  private chatId: string | null = null;
  private enabled: boolean = false;

  constructor() {
    if (config.telegramBotToken && config.telegramChatId) {
      try {
        this.bot = new TelegramBot(config.telegramBotToken, { polling: false });
        this.chatId = config.telegramChatId;
        this.enabled = true;
        logger.info('Telegram notifications enabled');
      } catch (error) {
        logger.error('Failed to initialize Telegram bot:', error);
      }
    } else {
      logger.info('Telegram notifications disabled (no credentials provided)');
    }
  }

  async sendMessage(message: string): Promise<void> {
    if (!this.enabled || !this.bot || !this.chatId) {
      return;
    }

    try {
      await this.bot.sendMessage(this.chatId, message, { parse_mode: 'HTML' });
    } catch (error) {
      logger.error('Failed to send Telegram message:', error);
    }
  }

  async sendTradeAlert(
    type: 'BUY' | 'SELL',
    targetWallet: string,
    tokenAddress: string,
    amount: string,
    txHash: string
  ): Promise<void> {
    const emoji = type === 'BUY' ? '🟢' : '🔴';
    const message = `
${emoji} <b>${type} Trade Detected</b>

<b>Target Wallet:</b> <code>${targetWallet}</code>
<b>Token:</b> <code>${tokenAddress}</code>
<b>Amount:</b> ${amount} BNB
<b>Transaction:</b> <a href="https://bscscan.com/tx/${txHash}">View on BSCScan</a>
    `.trim();

    await this.sendMessage(message);
  }

  async sendCopyTradeResult(
    success: boolean,
    type: 'BUY' | 'SELL',
    tokenAddress: string,
    amount: string,
    txHash?: string,
    error?: string
  ): Promise<void> {
    const emoji = success ? '✅' : '❌';
    let message = `
${emoji} <b>Copy Trade ${success ? 'Success' : 'Failed'}</b>

<b>Type:</b> ${type}
<b>Token:</b> <code>${tokenAddress}</code>
<b>Amount:</b> ${amount} BNB
    `.trim();

    if (success && txHash) {
      message += `\n<b>Transaction:</b> <a href="https://bscscan.com/tx/${txHash}">View on BSCScan</a>`;
    }

    if (!success && error) {
      message += `\n<b>Error:</b> ${error}`;
    }

    await this.sendMessage(message);
  }

  async sendError(errorMessage: string): Promise<void> {
    const message = `❌ <b>Bot Error</b>\n\n${errorMessage}`;
    await this.sendMessage(message);
  }

  async sendStartupMessage(): Promise<void> {
    const message = `
🤖 <b>Copy Trading Bot Started</b>

<b>Monitoring Wallets:</b> ${config.targetWallets.length}
<b>Min Trade:</b> ${config.minBnbAmount} BNB
<b>Max Trade:</b> ${config.maxBnbAmount} BNB
<b>Slippage:</b> ${config.slippageTolerance}%

Bot is now monitoring target wallets...
    `.trim();

    await this.sendMessage(message);
  }
}

