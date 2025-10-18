# 🤖 BNB Copy Trading Bot - PancakeSwap & four.meme

A powerful TypeScript-based CLI trading bot that monitors target wallets on Binance Smart Chain (BSC) and automatically copies their trades from **PancakeSwap** and **four.meme** DEX in real-time.

## ✨ Features

- **🎯 Multi-DEX Support**: Monitor trades on both PancakeSwap V2 and four.meme
- **💻 CLI-First Design**: Pure command-line interface with detailed logging
- **⚡ Real-time Trade Monitoring**: Tracks multiple wallet addresses simultaneously
- **🔄 Instant Trade Copying**: Automatically copies buy/sell trades with minimal latency
- **🛡️ Safety Features**: 
  - Configurable min/max trade amounts
  - Liquidity checks before executing trades
  - Token blacklist support
  - Anti-rug and honeypot detection options
  - Rate limiting to prevent spam trades
- **📊 Smart Slippage**: Configurable slippage tolerance for both buys and sells
- **💰 Portfolio Management**: Tracks active positions and manages sells automatically
- **📱 Optional Telegram**: Add Telegram notifications if you want (completely optional)
- **⚙️ Highly Configurable**: Extensive configuration via environment variables

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 18.0.0
- **npm** or **yarn**
- A BSC wallet with BNB for gas and trading
- (Optional) Telegram Bot Token for notifications

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd BNB-Copy-Trading-Bot-four.meme-pancakeSwap
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**

Edit the `.env` file in the root directory:

```env
# Your Wallet (REQUIRED)
PRIVATE_KEY=your_wallet_private_key_here
WALLET_ADDRESS=your_wallet_address_here

# Wallets to Monitor (REQUIRED)
TARGET_WALLETS=0x123...,0x456...

# DEXes to Monitor (REQUIRED)
MONITORED_DEXES=pancakeswap,fourmeme
```

4. **Build the project**
```bash
npm run build
```

5. **Start the bot**
```bash
npm start
```

## ⚙️ Configuration

### Required Environment Variables

```env
# BSC Network
BSC_RPC_URL=https://bsc-dataseed1.binance.org/

# Your Wallet (KEEP SECURE!)
PRIVATE_KEY=your_wallet_private_key_here
WALLET_ADDRESS=your_wallet_address_here

# Target Wallets to Copy (comma-separated)
TARGET_WALLETS=0x123...,0x456...
```

### DEX Configuration

```env
# PancakeSwap V2 (Default addresses)
PANCAKESWAP_ROUTER_V2=0x10ED43C718714eb63d5aA57B78B54704E256024E
PANCAKESWAP_FACTORY_V2=0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73

# four.meme DEX (Default addresses)
FOUR_MEME_ROUTER=0x9Fe4E3A3F0B6c23dE454A1Da7f8d1b5D0f961C0a
FOUR_MEME_FACTORY=0x152eE697f2E276fA89E96742e9bB9aB1F2E61bE3

# Which DEXes to monitor (comma-separated: pancakeswap, fourmeme)
MONITORED_DEXES=pancakeswap,fourmeme
```

### Trading Configuration

```env
# Trade amount limits
MIN_BNB_AMOUNT=0.01
MAX_BNB_AMOUNT=1.0

# Slippage tolerance (10 = 10%)
SLIPPAGE_TOLERANCE=10

# Gas settings
GAS_PRICE_GWEI=5
GAS_LIMIT=500000

# Copy percentage of target wallet's trade (100 = 100%)
COPY_PERCENTAGE=100

# Minimum liquidity required (in USD)
MIN_LIQUIDITY_USD=10000

# Maximum tax tolerance
MAX_BUY_TAX=10
MAX_SELL_TAX=10
```

### Safety Features

```env
# Enable anti-rug protection
ENABLE_ANTI_RUG=true

# Enable honeypot check
ENABLE_HONEYPOT_CHECK=true

# Blacklisted token addresses (comma-separated)
BLACKLISTED_TOKENS=0x...
```

### Optional Telegram Notifications

**This bot works perfectly without Telegram!** If you want notifications:

```env
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id
```

#### How to Get Telegram Credentials:

1. **Create a Telegram Bot**:
   - Message [@BotFather](https://t.me/botfather) on Telegram
   - Send `/newbot` and follow instructions
   - Copy the bot token

2. **Get Your Chat ID**:
   - Start a chat with your bot
   - Send any message
   - Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
   - Find your `chat_id` in the response

## 📖 How It Works

1. **Monitoring Phase**: Bot continuously monitors blockchain for transactions from target wallets
2. **Detection Phase**: When a target wallet interacts with PancakeSwap or four.meme router, bot decodes the transaction
3. **Analysis Phase**: Bot performs safety checks:
   - Validates token information
   - Checks liquidity levels
   - Verifies token is not blacklisted
   - Ensures sufficient wallet balance
4. **Execution Phase**: If all checks pass, bot executes the same trade on the same DEX with your configured parameters
5. **Notification Phase**: Logs to console (and sends to Telegram if configured)

## 💻 CLI Interface

The bot provides detailed console output:

```
============================================================
🚀 BNB Copy Trading Bot - Initializing...
============================================================
✅ Configuration validated successfully
📊 Monitoring 2 wallet(s)
💰 Trade range: 0.01 - 1.0 BNB
🔄 Monitored DEXes: pancakeswap, fourmeme
Connected to BSC network
Bot wallet address: 0x...
Bot wallet balance: 0.5 BNB
============================================================
✅ Initialization complete
============================================================
🔍 Starting wallet monitor...
Monitoring 2 wallet(s):
  - 0x123...
  - 0x456...
Monitored DEXes: pancakeswap, fourmeme
✅ Monitor started successfully
============================================================
✅ Bot is now running and monitoring trades
📊 Target wallets: 2
💰 Trade range: 0.01 - 1.0 BNB
📈 Copy percentage: 100%
⚙️ Slippage tolerance: 10%
============================================================
🎯 Target wallet transaction detected on PancakeSwap: 0x...
📊 Trade detected: BUY 0x... on PancakeSwap
============================================================
🎯 Trade Detected!
DEX: PancakeSwap
Type: BUY
Wallet: 0x123...
Token: 0xabc...
Amount: 0.5 BNB
TX: 0xdef...
============================================================
🔄 Starting to copy trade from 0x123...
DEX: PancakeSwap, Type: BUY, Token: 0xabc..., Amount: 0.5 BNB
Token: MyToken (MTK)
Token liquidity: $25000.00
✅ All safety checks passed
Calculated copy amount: 0.5 BNB (100% of original)
Executing BUY: 0.5 BNB -> 0xabc...
Buying token 0xabc... on PancakeSwap
Amount in: 0.5 BNB
Expected output: 1000000000000000000
Min output (10% slippage): 900000000000000000
Buy transaction sent: 0x...
✅ Buy transaction confirmed: 0x...
✅ Successfully copied BUY trade: 0x...
```

## 🔧 Advanced Usage

### Monitor Only Specific DEX

```env
# Only monitor PancakeSwap
MONITORED_DEXES=pancakeswap

# Only monitor four.meme
MONITORED_DEXES=fourmeme

# Monitor both (default)
MONITORED_DEXES=pancakeswap,fourmeme
```

### Running as a Service (Linux)

Create a systemd service file `/etc/systemd/system/copy-trading-bot.service`:

```ini
[Unit]
Description=BNB Copy Trading Bot
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/BNB-Copy-Trading-Bot-four.meme-pancakeSwap
ExecStart=/usr/bin/node /path/to/BNB-Copy-Trading-Bot-four.meme-pancakeSwap/dist/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable copy-trading-bot
sudo systemctl start copy-trading-bot
sudo systemctl status copy-trading-bot
```

### Running with PM2

```bash
npm install -g pm2
pm2 start dist/index.js --name copy-trading-bot
pm2 save
pm2 startup
```

## 📊 Project Structure

```
src/
├── config/
│   └── index.ts           # Configuration management
├── contracts/
│   └── pancakeswap.ts     # DEX ABIs and interfaces
├── services/
│   ├── blockchain.ts      # BSC blockchain connection
│   ├── pancakeswap.ts     # Multi-DEX interaction service
│   ├── monitor.ts         # Wallet monitoring service
│   ├── tradeCopier.ts     # Trade copying logic
│   └── telegram.ts        # Optional Telegram notifications
├── utils/
│   └── logger.ts          # Logging utility
└── index.ts               # Main bot entry point
```

## 🛡️ Security Best Practices

1. **Never share your `.env` file** - It contains your private key!
2. **Use a dedicated trading wallet** - Don't use your main wallet
3. **Start with small amounts** - Test with minimal BNB first
4. **Keep your private key secure** - Consider using environment variables or secret managers
5. **Review target wallets carefully** - Only copy wallets you trust
6. **Set appropriate limits** - Use MIN_BNB_AMOUNT and MAX_BNB_AMOUNT wisely
7. **Monitor regularly** - Check logs frequently
8. **Test on testnet first** - If possible, test the bot on BSC testnet

## 🚨 Risks and Disclaimers

⚠️ **IMPORTANT**: This bot is for educational purposes. Trading cryptocurrencies involves significant risk.

- **Market Risk**: Crypto markets are highly volatile
- **Smart Contract Risk**: DEXes and tokens may have vulnerabilities
- **Rug Pulls**: Even with safety checks, tokens can be malicious
- **Impermanent Loss**: Price changes can result in losses
- **Gas Fees**: Failed transactions still cost gas
- **Slippage**: Actual execution price may differ from expected

**USE AT YOUR OWN RISK. The developers are not responsible for any financial losses.**

## 🐛 Troubleshooting

### Bot won't start

- Check that all required environment variables are set
- Verify your private key is valid (without the '0x' prefix)
- Ensure your RPC URL is accessible
- Check Node.js version (>= 18.0.0)

### Trades not being copied

- Verify target wallets are correctly formatted
- Check if trades are being detected in logs
- Ensure you have sufficient BNB balance
- Check if safety checks are passing
- Verify DEX router addresses are correct
- Confirm MONITORED_DEXES includes the right DEXes

### Transaction failures

- Increase slippage tolerance
- Increase gas price
- Check token liquidity
- Verify token is not a honeypot

### High gas fees

- Adjust `GAS_PRICE_GWEI` to a lower value
- Consider trading during off-peak hours
- Note: Too low gas prices may result in stuck transactions

## 📝 Logs

Logs are stored in the `logs/` directory:
- `combined.log` - All logs
- `error.log` - Error logs only

View live logs:
```bash
tail -f logs/combined.log
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit pull requests.

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Built with [ethers.js](https://github.com/ethers-io/ethers.js/)
- PancakeSwap smart contracts
- four.meme DEX
- Binance Smart Chain

---

**Happy Trading! 🚀**

*Remember: Never trade more than you can afford to lose. This is a CLI-first bot - no GUI needed!*
