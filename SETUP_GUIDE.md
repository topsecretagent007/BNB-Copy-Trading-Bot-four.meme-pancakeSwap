# 🚀 Quick Setup Guide

## Step-by-Step Installation

### 1. Install Dependencies

Open terminal in the project directory and run:

```bash
npm install
```

### 2. Configure Your Bot

Edit the `.env` file with your details:

**Required Settings:**
```env
# Your BSC wallet private key (without 0x prefix)
PRIVATE_KEY=your_private_key_here

# Your BSC wallet address
WALLET_ADDRESS=0xYourWalletAddress

# Wallets you want to copy (comma-separated)
TARGET_WALLETS=0xTargetWallet1,0xTargetWallet2
```

**Telegram Notifications (Optional but Recommended):**

To get Telegram notifications, you'll need to:

1. **Create a Telegram Bot:**
   - Open Telegram and search for `@BotFather`
   - Send `/newbot` command
   - Follow the instructions to create your bot
   - Copy the bot token you receive

2. **Get Your Chat ID:**
   - Start a chat with your new bot
   - Send any message to it
   - Open this URL in your browser (replace YOUR_BOT_TOKEN):
     ```
     https://api.telegram.org/botYOUR_BOT_TOKEN/getUpdates
     ```
   - Look for `"chat":{"id":` in the response - that's your chat ID

3. **Add to .env file:**
   ```env
   TELEGRAM_BOT_TOKEN=your_bot_token_here
   TELEGRAM_CHAT_ID=your_chat_id_here
   ```

### 3. Build the Project

```bash
npm run build
```

### 4. Start the Bot

```bash
npm start
```

For development mode (with auto-reload):
```bash
npm run dev
```

## ⚙️ Configuration Tips

### For Beginners:
```env
MIN_BNB_AMOUNT=0.01
MAX_BNB_AMOUNT=0.1
COPY_PERCENTAGE=50
SLIPPAGE_TOLERANCE=15
```

### For Advanced Users:
```env
MIN_BNB_AMOUNT=0.05
MAX_BNB_AMOUNT=1.0
COPY_PERCENTAGE=100
SLIPPAGE_TOLERANCE=10
MIN_LIQUIDITY_USD=50000
```

## 🔍 Verifying Your Setup

After starting the bot, you should see:

```
✅ Configuration validated successfully
📊 Monitoring X wallet(s)
💰 Trade range: 0.01 - 1.0 BNB
🔍 Starting wallet monitor...
✅ Monitor started successfully
```

If you configured Telegram, you'll also receive a startup message.

## ⚠️ Before You Start

1. **Test with small amounts first** - Start with MIN_BNB_AMOUNT=0.01
2. **Make sure you have BNB** - You need BNB for gas fees and trading
3. **Choose target wallets carefully** - Only copy wallets you trust
4. **Monitor the logs** - Keep an eye on the console output

## 🆘 Common Issues

### "Environment variable PRIVATE_KEY is required"
- Make sure you've created a `.env` file
- Copy from `.env.example` if needed
- Add your private key without "0x" prefix

### "No valid target wallets configured"
- Check that TARGET_WALLETS addresses are valid BSC addresses
- Make sure they start with "0x"
- Use comma separation for multiple wallets (no spaces)

### "Insufficient BNB balance"
- Your wallet needs BNB for both gas fees and trading
- Minimum: 0.05 BNB for testing
- Recommended: 0.5+ BNB

### Trades not being copied
- Verify the target wallet is actually trading on PancakeSwap V2
- Check that you have enough BNB balance
- Review logs for safety check failures
- Increase SLIPPAGE_TOLERANCE if needed

## 📊 Monitoring Your Bot

### View Logs
```bash
# Real-time monitoring
tail -f logs/combined.log

# View errors only
tail -f logs/error.log
```

### Stop the Bot
Press `Ctrl+C` in the terminal

## 🎯 Next Steps

1. Start with test trades (small amounts)
2. Monitor for 24 hours
3. Adjust configuration based on results
4. Scale up gradually

## 💡 Pro Tips

- Use COPY_PERCENTAGE to control your exposure (50% = half the size of target wallet trades)
- Set MIN_LIQUIDITY_USD high (50000+) to avoid low-liquidity tokens
- Enable Telegram notifications to stay informed
- Review trades regularly through BSCScan
- Keep some BNB reserved for gas fees

---

**Need help? Check the main README.md for detailed documentation.**

