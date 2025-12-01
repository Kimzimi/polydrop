# PolyDrop - Polymarket $POLY Airdrop Estimator

![PolyDrop Logo](polydrop_logo.png)

Check your eligibility for the Polymarket $POLY token airdrop based on real trading data.

🌐 **Live Site:** [polydrop.fun](https://polydrop.fun)

## Features

### Real-Time Data Analysis
- **100% Accurate Volume Calculation** - Fetches complete trading history from Polymarket API
- **Total PNL Tracking** - Calculates both realized and unrealized profit/loss using FIFO matching
- **Multi-Address Support** - Check multiple wallet addresses simultaneously
- **Detailed Metrics**:
  - Trading volume (USD)
  - Profit & Loss (realized + unrealized)
  - Active trading days
  - Number of unique markets traded
  - Consistency score

### Tier System
Wallets are ranked into tiers based on weighted scoring:
- **Tier S** (Top 1%): $50k+ volume, high consistency
- **Tier A** (Top 5%): $10k+ volume, good activity
- **Tier B** (Top 15%): $1k+ volume, moderate trading
- **Tier C** (Top 30%): $100+ volume, basic activity

### Scoring Algorithm
- **Volume (40%)**: Total trading volume
- **Consistency (30%)**: Regular trading frequency
- **Diversity (15%)**: Number of unique markets
- **Activity (10%)**: Total number of trades
- **Profitability (5%)**: Positive PNL bonus

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Data Source**: Polymarket Data API
- **Deployment**: GitHub Pages / Vercel
- **Analytics**: Custom tracking system

## Getting Started

### Installation

```bash
# Clone the repository
git clone https://github.com/Kimzimi/polydrop.git
cd polydrop

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Usage

1. Enter one or more Ethereum wallet addresses (comma or newline separated)
2. Click "Check" to analyze
3. Wait for data to load (may take a few seconds for wallets with many trades)
4. View your tier, percentile rank, and estimated $POLY allocation

## How It Works

### Data Fetching
The app connects to Polymarket's public API to fetch all trading activity:
```
https://data-api.polymarket.com/activity?user={address}&type=TRADE
```

### PNL Calculation
Uses **FIFO (First In, First Out)** position matching:
1. Groups trades by market and outcome
2. Matches buy/sell orders chronologically
3. Calculates realized PNL from closed positions
4. Estimates unrealized PNL using mark-to-market pricing

### Volume Calculation
Total volume = Sum of all trade sizes in USD:
- Uses `usdcSize` field when available
- Falls back to `size × price` calculation

## API Endpoints

### POST `/api/analyze`
Analyzes wallet addresses and returns metrics.

**Request:**
```json
{
  "addresses": ["0x..."]
}
```

**Response:**
```json
[{
  "address": "0x...",
  "volume": 50000,
  "pnl": 2500,
  "activeDays": 120,
  "marketsTraded": 45,
  "estimatedTier": "S",
  "percentile": 99,
  "estimatedAllocation": {
    "min": 5000,
    "max": 20000
  },
  "suggestions": []
}]
```

### GET/POST `/api/stats`
Track and retrieve usage statistics (admin only).

## Project Structure

```
polydrop/
├── app/
│   ├── api/
│   │   ├── analyze/route.ts    # Main analysis endpoint
│   │   └── stats/route.ts      # Analytics endpoint
│   ├── admin/page.tsx          # Admin dashboard
│   └── page.tsx                # Main app page
├── lib/
│   └── polymarket.ts           # Polymarket API utilities
├── components/
│   ├── AddressInput.tsx        # Address input component
│   └── ResultsDisplay.tsx      # Results display component
├── types/
│   └── index.ts                # TypeScript definitions
├── index.html                  # Standalone HTML version
├── static-demo.html            # Static demo
└── polydrop_logo.png          # Logo
```

## Configuration

### Environment Variables
No environment variables required - uses public Polymarket API.

### Customization
Edit `app/api/analyze/route.ts` to adjust:
- Tier thresholds
- Scoring weights
- Allocation estimates

## Deployment

### GitHub Pages (Static)
```bash
git push origin main
```
Site automatically deploys to: `https://kimzimi.github.io/polydrop/`

### Vercel (Full Stack)
```bash
vercel --prod
```

### Custom Domain
1. Add CNAME file with domain name
2. Configure DNS:
   - A records: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - CNAME: `kimzimi.github.io`

## Contributing

This is a personal project for the Polymarket community. Feel free to fork and customize for your own use.

## Disclaimer

**This tool provides estimates only.**
- Tier assignments and allocations are not official
- Based on community speculation and on-chain activity
- Actual airdrop criteria (if any) are determined by Polymarket
- No guarantee of accuracy or airdrop eligibility

## Support

For questions or issues:
- Visit: [polydrop.fun](https://polydrop.fun)
- GitHub: [@Kimzimi](https://github.com/Kimzimi)

## License

MIT License - feel free to use and modify.

---

**Built by Kimzimi** for the Polymarket community 🎯
