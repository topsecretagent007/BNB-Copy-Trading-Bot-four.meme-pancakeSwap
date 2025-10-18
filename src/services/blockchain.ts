import { ethers } from 'ethers';
import { config } from '../config';
import { logger } from '../utils/logger';

export class BlockchainService {
  public provider: ethers.JsonRpcProvider;
  public wallet: ethers.Wallet;
  private connectionAttempts = 0;
  private maxConnectionAttempts = 5;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(config.bscRpcUrl);
    this.wallet = new ethers.Wallet(config.privateKey, this.provider);
  }

  async initialize(): Promise<void> {
    try {
      await this.checkConnection();
      logger.info('Blockchain service initialized successfully');
      logger.info(`Connected to BSC network`);
      logger.info(`Bot wallet address: ${this.wallet.address}`);
      
      const balance = await this.getBalance(this.wallet.address);
      logger.info(`Bot wallet balance: ${balance} BNB`);

      if (parseFloat(balance) < config.minBnbAmount) {
        logger.warn(`Warning: Wallet balance is below minimum trade amount!`);
      }
    } catch (error) {
      logger.error('Failed to initialize blockchain service:', error);
      throw error;
    }
  }

  async checkConnection(): Promise<void> {
    try {
      const network = await this.provider.getNetwork();
      if (network.chainId !== 56n) {
        throw new Error(`Wrong network! Expected BSC (56), got ${network.chainId}`);
      }
      this.connectionAttempts = 0;
    } catch (error) {
      this.connectionAttempts++;
      if (this.connectionAttempts >= this.maxConnectionAttempts) {
        throw new Error(`Failed to connect to BSC network after ${this.maxConnectionAttempts} attempts`);
      }
      logger.warn(`Connection attempt ${this.connectionAttempts} failed, retrying...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return this.checkConnection();
    }
  }

  async getBalance(address: string): Promise<string> {
    try {
      const balance = await this.provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      logger.error(`Failed to get balance for ${address}:`, error);
      return '0';
    }
  }

  async getTokenBalance(tokenAddress: string, walletAddress: string): Promise<string> {
    try {
      const tokenContract = new ethers.Contract(
        tokenAddress,
        ['function balanceOf(address) view returns (uint256)'],
        this.provider
      );
      const balance = await tokenContract.balanceOf(walletAddress);
      return balance.toString();
    } catch (error) {
      logger.error(`Failed to get token balance:`, error);
      return '0';
    }
  }

  async getGasPrice(): Promise<bigint> {
    try {
      const feeData = await this.provider.getFeeData();
      const gasPrice = feeData.gasPrice || ethers.parseUnits(config.gasPriceGwei.toString(), 'gwei');
      return gasPrice;
    } catch (error) {
      logger.error('Failed to get gas price:', error);
      return ethers.parseUnits(config.gasPriceGwei.toString(), 'gwei');
    }
  }

  async waitForTransaction(txHash: string, confirmations = 1): Promise<ethers.TransactionReceipt | null> {
    try {
      logger.info(`Waiting for transaction confirmation: ${txHash}`);
      const receipt = await this.provider.waitForTransaction(txHash, confirmations, 60000); // 60 second timeout
      return receipt;
    } catch (error) {
      logger.error(`Error waiting for transaction ${txHash}:`, error);
      return null;
    }
  }

  async estimateGas(transaction: ethers.TransactionRequest): Promise<bigint> {
    try {
      return await this.provider.estimateGas(transaction);
    } catch (error) {
      logger.warn('Gas estimation failed, using default:', error);
      return BigInt(config.gasLimit);
    }
  }

  async getNonce(address: string): Promise<number> {
    return await this.provider.getTransactionCount(address, 'pending');
  }

  async getTransaction(txHash: string): Promise<ethers.TransactionResponse | null> {
    try {
      return await this.provider.getTransaction(txHash);
    } catch (error) {
      logger.error(`Failed to get transaction ${txHash}:`, error);
      return null;
    }
  }

  async getTransactionReceipt(txHash: string): Promise<ethers.TransactionReceipt | null> {
    try {
      return await this.provider.getTransactionReceipt(txHash);
    } catch (error) {
      logger.error(`Failed to get transaction receipt ${txHash}:`, error);
      return null;
    }
  }

  createContract(address: string, abi: any[]): ethers.Contract {
    return new ethers.Contract(address, abi, this.wallet);
  }
}

