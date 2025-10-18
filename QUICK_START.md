# ⚡ Quick Start - Get Running in 5 Minutes

## 🎯 What You Need

1. **Node.js 18+** (download from [nodejs.org](https://nodejs.org/))
2. **A BSC wallet** with some BNB (0.5+ BNB recommended)
3. **Target wallet addresses** you want to copy

## 🚀 Installation (Copy & Paste)

### Windows:
```bash
cd "D:\My Projects\Bot\BNB-Copy-Trading-Bot-four.meme-pancakeSwap"
npm install
npm run build
```

### Linux/Mac:
```bash
npm install
npm run build
```

Or use the automated setup script:
- **Windows**: Double-click `scripts/setup.bat`
- **Linux/Mac**: Run `bash scripts/setup.sh`

## ⚙️ Configuration (3 Steps)

### Step 1: Open the `.env` file

The file is in your project root folder.

### Step 2: Add Your Wallet Info

```env
PRIVATE_KEY=your_private_key_without_0x
WALLET_ADDRESS=0xYourBNBWalletAddress
```

**⚠️ How to get your private key:**
- MetaMask: Account Details → Export Private Key
- Trust Wallet: Settings → Wallets → Show Private Key
- **Remove the "0x" prefix if it has one**

### Step 3: Add Target Wallets & DEXes

```env
# Wallets you want to copy
TARGET_WALLETS=0xWalletToCopy1,0xWalletToCopy2

# Which DEXes to monitor (both by default)
MONITORED_DEXES=pancakeswap,fourmeme
```

Multiple wallets? Separate with commas (no spaces).

## 🏃 Run the Bot

```bash
npm start
```

That's it! You should see:

```
✅ Configuration validated successfully
📊 Monitoring X wallet(s)
🔄 Monitored DEXes: pancakeswap, fourmeme
🔍 Starting wallet monitor...
✅ Bot is now running and monitoring trades
```

## 📱 Optional: Telegram Notifications

**The bot works perfectly without Telegram!** It's a CLI bot with detailed console logging.

Want notifications on your phone? Add these to `.env`:

```env
TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
TELEGRAM_CHAT_ID=123456789
```

**How to get these:**
1. Message [@BotFather](https://t.me/botfather) on Telegram
2. Send: `/newbot`
3. Follow instructions
4. Get your chat ID from: `https://api.telegram.org/bot<TOKEN>/getUpdates`

See `SETUP_GUIDE.md` for detailed instructions. **But again - this is completely optional!**

## 🛡️ Safety Settings (Recommended for First Time)

Before running, set these in your `.env` file:

```env
MIN_BNB_AMOUNT=0.01        # Start small
MAX_BNB_AMOUNT=0.1         # Cap your risk
COPY_PERCENTAGE=50         # Copy 50% of target trades
SLIPPAGE_TOLERANCE=15      # Higher for memecoins
MIN_LIQUIDITY_USD=20000    # Avoid low liquidity tokens
```

## ✅ Verify Setup

Run the setup checker:
```bash
npm run check
```

This will tell you if anything is missing.

## 📊 What Happens Next?

1. Bot monitors your target wallets 24/7 via CLI
2. When they make a PancakeSwap or four.meme trade, bot detects it instantly
3. Bot performs safety checks (liquidity, balance, etc.)
4. If safe, bot copies the trade on the same DEX with your configured amount
5. Everything is logged to console and log files

## 🎮 Control Commands

- **Start**: `npm start`
- **Stop**: Press `Ctrl+C`
- **Check Setup**: `npm run check`
- **View Logs**: Check `logs/combined.log` or run `tail -f logs/combined.log`

## 💻 CLI Output Example

```
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
✅ Successfully copied BUY trade: 0x...
```

## 🆘 Troubleshooting

### "PRIVATE_KEY is required"
→ Make sure you edited the `.env` file and added your private key

### "No valid target wallets"
→ Check that addresses start with "0x" and are valid BSC addresses

### "Insufficient balance"
→ Add more BNB to your wallet (minimum 0.05 BNB)

### Bot not copying trades
→ Verify the target wallet is actively trading on PancakeSwap or four.meme

## 💡 Pro Tips

✅ **Start with test amounts** - Use MIN_BNB_AMOUNT=0.01 first  
✅ **Monitor the console** - Watch the detailed logs  
✅ **Use stop losses** - Set MAX_BNB_AMOUNT wisely  
✅ **Check liquidity** - Set MIN_LIQUIDITY_USD high (20000+)  
✅ **Monitor both DEXes** - Leave MONITORED_DEXES=pancakeswap,fourmeme  
✅ **Add Telegram later** - Get comfortable with CLI first  

## ⚠️ Important Reminders

- **Test with small amounts first**
- **Never share your private key**
- **Only copy wallets you trust**
- **Crypto trading is risky - only invest what you can afford to lose**
- **This is for educational purposes**
- **This is a CLI bot - no GUI, just beautiful terminal output!**

## 📚 Need More Help?

- **Detailed Guide**: `SETUP_GUIDE.md`
- **Full Documentation**: `README.md`
- **Check Logs**: `logs/combined.log` and `logs/error.log`

---

**Ready to go? Run: `npm start`** 🚀

*Happy trading! This is a pure CLI bot - embrace the terminal!*
