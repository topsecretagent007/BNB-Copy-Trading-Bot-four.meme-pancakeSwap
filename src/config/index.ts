import dotenv from 'dotenv';
import { ethers } from 'ethers';

dotenv.config();

export interface Config {
  bscRpcUrl: string;
  privateKey: string;
  walletAddress: string;
  targetWallets: string[];
  minBnbAmount: number;
  maxBnbAmount: number;
  slippageTolerance: number;
  gasPriceGwei: number;
  gasLimit: number;
  copyPercentage: number;
  minLiquidityUsd: number;
  maxBuyTax: number;
  maxSellTax: number;
  enableAntiRug: boolean;
  enableHoneypotCheck: boolean;
  blacklistedTokens: string[];
  pancakeswapRouterV2: string;
  pancakeswapFactoryV2: string;
  fourMemeRouter: string;
  fourMemeFactory: string;
  monitoredDexes: string[];
  telegramBotToken?: string;
  telegramChatId?: string;
  logLevel: string;
}

function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Environment variable ${key} is required but not set`);
  }
  return value;
}

function getEnvVarOptional(key: string, defaultValue?: string): string | undefined {
  return process.env[key] || defaultValue;
}

function parseWalletAddresses(addresses: string): string[] {
  return addresses
    .split(',')
    .map(addr => addr.trim())
    .filter(addr => addr.length > 0)
    .filter(addr => ethers.isAddress(addr));
}

export const config: Config = {
  bscRpcUrl: getEnvVar('BSC_RPC_URL', 'https://bsc-dataseed1.binance.org/'),
  privateKey: getEnvVar('PRIVATE_KEY'),
  walletAddress: getEnvVar('WALLET_ADDRESS'),
  targetWallets: parseWalletAddresses(getEnvVar('TARGET_WALLETS')),
  minBnbAmount: parseFloat(getEnvVar('MIN_BNB_AMOUNT', '0.01')),
  maxBnbAmount: parseFloat(getEnvVar('MAX_BNB_AMOUNT', '1.0')),
  slippageTolerance: parseInt(getEnvVar('SLIPPAGE_TOLERANCE', '10')),
  gasPriceGwei: parseFloat(getEnvVar('GAS_PRICE_GWEI', '5')),
  gasLimit: parseInt(getEnvVar('GAS_LIMIT', '500000')),
  copyPercentage: parseFloat(getEnvVar('COPY_PERCENTAGE', '100')),
  minLiquidityUsd: parseFloat(getEnvVar('MIN_LIQUIDITY_USD', '10000')),
  maxBuyTax: parseFloat(getEnvVar('MAX_BUY_TAX', '10')),
  maxSellTax: parseFloat(getEnvVar('MAX_SELL_TAX', '10')),
  enableAntiRug: getEnvVar('ENABLE_ANTI_RUG', 'true') === 'true',
  enableHoneypotCheck: getEnvVar('ENABLE_HONEYPOT_CHECK', 'true') === 'true',
  blacklistedTokens: parseWalletAddresses(getEnvVar('BLACKLISTED_TOKENS', '')),
  pancakeswapRouterV2: getEnvVar('PANCAKESWAP_ROUTER_V2', '0x10ED43C718714eb63d5aA57B78B54704E256024E'),
  pancakeswapFactoryV2: getEnvVar('PANCAKESWAP_FACTORY_V2', '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73'),
  fourMemeRouter: getEnvVar('FOUR_MEME_ROUTER', '0x9Fe4E3A3F0B6c23dE454A1Da7f8d1b5D0f961C0a'),
  fourMemeFactory: getEnvVar('FOUR_MEME_FACTORY', '0x152eE697f2E276fA89E96742e9bB9aB1F2E61bE3'),
  monitoredDexes: getEnvVar('MONITORED_DEXES', 'pancakeswap,fourmeme').split(',').map(d => d.trim().toLowerCase()),
  telegramBotToken: getEnvVarOptional('TELEGRAM_BOT_TOKEN'),
  telegramChatId: getEnvVarOptional('TELEGRAM_CHAT_ID'),
  logLevel: getEnvVar('LOG_LEVEL', 'info'),
};

export function validateConfig(): void {
  if (config.targetWallets.length === 0) {
    throw new Error('No valid target wallets configured');
  }

  if (!ethers.isAddress(config.walletAddress)) {
    throw new Error('Invalid wallet address');
  }

  if (config.minBnbAmount <= 0) {
    throw new Error('MIN_BNB_AMOUNT must be greater than 0');
  }

  if (config.maxBnbAmount < config.minBnbAmount) {
    throw new Error('MAX_BNB_AMOUNT must be greater than or equal to MIN_BNB_AMOUNT');
  }

  if (config.slippageTolerance < 0 || config.slippageTolerance > 100) {
    throw new Error('SLIPPAGE_TOLERANCE must be between 0 and 100');
  }

  if (config.copyPercentage <= 0 || config.copyPercentage > 100) {
    throw new Error('COPY_PERCENTAGE must be between 0 and 100');
  }

  console.log('✅ Configuration validated successfully');
  console.log(`📊 Monitoring ${config.targetWallets.length} wallet(s)`);
  console.log(`💰 Trade range: ${config.minBnbAmount} - ${config.maxBnbAmount} BNB`);
  console.log(`🔄 Monitored DEXes: ${config.monitoredDexes.join(', ')}`);
}

