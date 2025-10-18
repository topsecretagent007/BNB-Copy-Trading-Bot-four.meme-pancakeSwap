import { ethers } from 'ethers';
import { BlockchainService } from './blockchain';
import { logger } from '../utils/logger';
import { config } from '../config';
import {
  PANCAKESWAP_ROUTER_ABI,
  PANCAKESWAP_FACTORY_ABI,
  PANCAKESWAP_PAIR_ABI,
  ERC20_ABI,
  WBNB_ADDRESS,
  TokenInfo,
  PairReserves,
  SwapPath,
} from '../contracts/pancakeswap';

export class PancakeSwapService {
  private routers: Map<string, ethers.Contract>;
  private factories: Map<string, ethers.Contract>;

  constructor(private blockchain: BlockchainService) {
    this.routers = new Map();
    this.factories = new Map();

    // Initialize PancakeSwap
    this.routers.set(config.pancakeswapRouterV2.toLowerCase(), this.blockchain.createContract(
      config.pancakeswapRouterV2,
      PANCAKESWAP_ROUTER_ABI
    ));
    this.factories.set(config.pancakeswapFactoryV2.toLowerCase(), new ethers.Contract(
      config.pancakeswapFactoryV2,
      PANCAKESWAP_FACTORY_ABI,
      this.blockchain.provider
    ));

    // Initialize four.meme
    this.routers.set(config.fourMemeRouter.toLowerCase(), this.blockchain.createContract(
      config.fourMemeRouter,
      PANCAKESWAP_ROUTER_ABI
    ));
    this.factories.set(config.fourMemeFactory.toLowerCase(), new ethers.Contract(
      config.fourMemeFactory,
      PANCAKESWAP_FACTORY_ABI,
      this.blockchain.provider
    ));
  }

  private getRouter(routerAddress: string): ethers.Contract {
    const router = this.routers.get(routerAddress.toLowerCase());
    if (!router) {
      throw new Error(`Router not found: ${routerAddress}`);
    }
    return router;
  }

  private getFactory(routerAddress: string): ethers.Contract {
    // Map router to factory
    if (routerAddress.toLowerCase() === config.pancakeswapRouterV2.toLowerCase()) {
      return this.factories.get(config.pancakeswapFactoryV2.toLowerCase())!;
    } else if (routerAddress.toLowerCase() === config.fourMemeRouter.toLowerCase()) {
      return this.factories.get(config.fourMemeFactory.toLowerCase())!;
    }
    throw new Error(`Factory not found for router: ${routerAddress}`);
  }

  async getTokenInfo(tokenAddress: string): Promise<TokenInfo | null> {
    try {
      const tokenContract = new ethers.Contract(
        tokenAddress,
        ERC20_ABI,
        this.blockchain.provider
      );

      const [name, symbol, decimals] = await Promise.all([
        tokenContract.name(),
        tokenContract.symbol(),
        tokenContract.decimals(),
      ]);

      return {
        address: tokenAddress,
        name,
        symbol,
        decimals: Number(decimals),
      };
    } catch (error) {
      logger.error(`Failed to get token info for ${tokenAddress}:`, error);
      return null;
    }
  }

  async getPairAddress(tokenA: string, tokenB: string, factoryAddress?: string): Promise<string | null> {
    try {
      const factory = factoryAddress 
        ? this.getFactory(factoryAddress)
        : this.factories.get(config.pancakeswapFactoryV2.toLowerCase())!;
      
      const pairAddress = await factory.getPair(tokenA, tokenB);
      if (pairAddress === ethers.ZeroAddress) {
        return null;
      }
      return pairAddress;
    } catch (error) {
      logger.error('Failed to get pair address:', error);
      return null;
    }
  }

  async getPairReserves(tokenA: string, tokenB: string): Promise<PairReserves | null> {
    try {
      const pairAddress = await this.getPairAddress(tokenA, tokenB);
      if (!pairAddress) {
        return null;
      }

      const pairContract = new ethers.Contract(
        pairAddress,
        PANCAKESWAP_PAIR_ABI,
        this.blockchain.provider
      );

      const [reserves, token0] = await Promise.all([
        pairContract.getReserves(),
        pairContract.token0(),
      ]);

      return {
        reserve0: reserves[0],
        reserve1: reserves[1],
        token0: token0,
        token1: token0.toLowerCase() === tokenA.toLowerCase() ? tokenB : tokenA,
      };
    } catch (error) {
      logger.error('Failed to get pair reserves:', error);
      return null;
    }
  }

  async getAmountsOut(amountIn: bigint, path: string[], routerAddress?: string): Promise<bigint[]> {
    try {
      const router = routerAddress 
        ? this.getRouter(routerAddress)
        : this.routers.get(config.pancakeswapRouterV2.toLowerCase())!;
      
      const amounts = await router.getAmountsOut(amountIn, path);
      return amounts.map((amount: any) => BigInt(amount.toString()));
    } catch (error) {
      logger.error('Failed to get amounts out:', error);
      return [];
    }
  }

  async approveToken(tokenAddress: string, amount: bigint, routerAddress: string): Promise<boolean> {
    try {
      const tokenContract = this.blockchain.createContract(tokenAddress, ERC20_ABI);
      
      // Check current allowance
      const allowance = await tokenContract.allowance(
        this.blockchain.wallet.address,
        routerAddress
      );

      if (BigInt(allowance.toString()) >= amount) {
        logger.info('Token already approved');
        return true;
      }

      logger.info(`Approving token ${tokenAddress} for router ${routerAddress}...`);
      const tx = await tokenContract.approve(routerAddress, amount);
      const receipt = await tx.wait();

      if (receipt && receipt.status === 1) {
        logger.info('Token approved successfully');
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Failed to approve token:', error);
      return false;
    }
  }

  async buyToken(
    tokenAddress: string,
    amountInBNB: string,
    slippageTolerance: number,
    routerAddress: string
  ): Promise<string | null> {
    try {
      const router = this.getRouter(routerAddress);
      const amountIn = ethers.parseEther(amountInBNB);
      const path = [WBNB_ADDRESS, tokenAddress];

      // Get expected output
      const amounts = await this.getAmountsOut(amountIn, path, routerAddress);
      if (amounts.length === 0) {
        logger.error('Failed to calculate expected output');
        return null;
      }

      const expectedOutput = amounts[amounts.length - 1];
      const minOutput = (expectedOutput * BigInt(100 - slippageTolerance)) / 100n;

      const dexName = this.getDexName(routerAddress);
      logger.info(`Buying token ${tokenAddress} on ${dexName}`);
      logger.info(`Amount in: ${amountInBNB} BNB`);
      logger.info(`Expected output: ${expectedOutput.toString()}`);
      logger.info(`Min output (${slippageTolerance}% slippage): ${minOutput.toString()}`);

      const deadline = Math.floor(Date.now() / 1000) + 60 * 10; // 10 minutes
      const gasPrice = await this.blockchain.getGasPrice();

      const tx = await router.swapExactETHForTokensSupportingFeeOnTransferTokens(
        minOutput,
        path,
        this.blockchain.wallet.address,
        deadline,
        {
          value: amountIn,
          gasLimit: BigInt(config.gasLimit),
          gasPrice: gasPrice,
        }
      );

      logger.info(`Buy transaction sent: ${tx.hash}`);
      const receipt = await tx.wait();

      if (receipt && receipt.status === 1) {
        logger.info(`✅ Buy transaction confirmed: ${tx.hash}`);
        return tx.hash;
      }

      logger.error('Buy transaction failed');
      return null;
    } catch (error) {
      logger.error('Failed to buy token:', error);
      return null;
    }
  }

  private getDexName(routerAddress: string): string {
    if (routerAddress.toLowerCase() === config.pancakeswapRouterV2.toLowerCase()) {
      return 'PancakeSwap';
    } else if (routerAddress.toLowerCase() === config.fourMemeRouter.toLowerCase()) {
      return 'four.meme';
    }
    return 'Unknown DEX';
  }

  async sellToken(
    tokenAddress: string,
    amountIn: bigint,
    slippageTolerance: number,
    routerAddress: string
  ): Promise<string | null> {
    try {
      const router = this.getRouter(routerAddress);
      const path = [tokenAddress, WBNB_ADDRESS];

      // Approve token first
      const approved = await this.approveToken(tokenAddress, amountIn, routerAddress);
      if (!approved) {
        logger.error('Failed to approve token for selling');
        return null;
      }

      // Get expected output
      const amounts = await this.getAmountsOut(amountIn, path, routerAddress);
      if (amounts.length === 0) {
        logger.error('Failed to calculate expected output');
        return null;
      }

      const expectedOutput = amounts[amounts.length - 1];
      const minOutput = (expectedOutput * BigInt(100 - slippageTolerance)) / 100n;

      const dexName = this.getDexName(routerAddress);
      logger.info(`Selling token ${tokenAddress} on ${dexName}`);
      logger.info(`Amount in: ${amountIn.toString()}`);
      logger.info(`Expected BNB output: ${ethers.formatEther(expectedOutput)}`);
      logger.info(`Min BNB output (${slippageTolerance}% slippage): ${ethers.formatEther(minOutput)}`);

      const deadline = Math.floor(Date.now() / 1000) + 60 * 10; // 10 minutes
      const gasPrice = await this.blockchain.getGasPrice();

      const tx = await router.swapExactTokensForETHSupportingFeeOnTransferTokens(
        amountIn,
        minOutput,
        path,
        this.blockchain.wallet.address,
        deadline,
        {
          gasLimit: BigInt(config.gasLimit),
          gasPrice: gasPrice,
        }
      );

      logger.info(`Sell transaction sent: ${tx.hash}`);
      const receipt = await tx.wait();

      if (receipt && receipt.status === 1) {
        logger.info(`✅ Sell transaction confirmed: ${tx.hash}`);
        return tx.hash;
      }

      logger.error('Sell transaction failed');
      return null;
    } catch (error) {
      logger.error('Failed to sell token:', error);
      return null;
    }
  }

  async checkLiquidity(tokenAddress: string): Promise<number> {
    try {
      const reserves = await this.getPairReserves(tokenAddress, WBNB_ADDRESS);
      if (!reserves) {
        return 0;
      }

      const wbnbReserve = reserves.token0.toLowerCase() === WBNB_ADDRESS.toLowerCase()
        ? reserves.reserve0
        : reserves.reserve1;

      // Assuming BNB price is ~$300 for USD calculation
      const bnbPriceUsd = 300;
      const liquidityBnb = parseFloat(ethers.formatEther(wbnbReserve));
      const liquidityUsd = liquidityBnb * bnbPriceUsd;

      return liquidityUsd;
    } catch (error) {
      logger.error('Failed to check liquidity:', error);
      return 0;
    }
  }
}

