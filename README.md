# MyStox (NIFTY 500) — End-to-End Functional Remake

A 100% exact, pixel-perfect, fully-functional remake of [MyStox](https://mystox.com/#home/NIFTY500_group).

## Overview & Architecture

This application communicates directly with the official MyStox public endpoints and mirrors the identical frontend runtime architecture:

1. **Live Cash & NIFTY 500 Data**:
   - `https://get.mystox.com/files/nse/cash/common/lastdates.json` — Timestamps and status of latest EOD, live, and 5-min intervals.
   - `https://get.mystox.com/files/nse/cash/common/stocks_today.json` — Comprehensive live stock metrics (LTP, high, low, open, close, VWAP, change, percentage, volume, delivery, trades) for 3,000+ NSE scrips.
   - `https://get.mystox.com/files/nse/cash/common/ticks.txt` — Real-time index and market ticks stream.
   - `https://get.mystox.com/files/nse/cash/common/Scripcodes.json` — Master lookup for NSE scrip codes, symbols, and company details.
   - `https://get.mystox.com/files/nse/cash/5min/today/{date}/live/stocks_{time}.txt` — 5-minute intraday candle ticks.
   - `https://get.mystox.com/files/nse/cash/common/eod/{SYMBOL}.json` — Historical end-of-day candles for charts and technical indicators.
   - `https://api.mystox.com/rest/v1/preferences` — Supabase database configuration for user views and preferences.

2. **30-Second Auto-Refresh Engine (`autorefresh.js`)**:
   - Real-time countdown badge integrated into the navbar displaying `Auto 30s` with a live seconds countdown.
   - Ticking every 30 seconds:
     - Automatically calls `ticks.txt` and `stocks_today.json`.
     - Updates all stock entries in memory (`window.all_idx` and `window.stocks`).
     - Triggers `tickupdate()`, refreshing all DOM cards, tables, top gainers, top losers, volume buzzers, and quote tickers without duplicate header buttons.
   - Manual sync: Clicking the `Auto-Refresh` button immediately forces a synchronization and resets the 30-second interval.

3. **Unlocked Features**:
   - PRO/VIP status is persistently enabled (`isl = true`, `sil = true`, `sip = true`, `sim = true`).
   - Guest restriction guards and subscription lock overlays are bypassed.
   - Multi-scrip views, custom indicators, scanners, heatmaps, and full technical charts are unlocked.

## Project Structure

```
├── CSS/
│   ├── ezcss.css              # Core responsive styling & theme variables
│   ├── appwall.css            # Wall grid, cards, and table styling
│   └── images/                # Logos, spinners, and graphic assets
├── Scripts/
│   ├── appcommon.js           # Math, date parsers, colors & formatting
│   ├── appData.js             # Data models, indices, schema & endpoint paths
│   ├── appScripts.js          # DOM rendering, cards, tables, menus, view manager
│   ├── appchart.js            # Stock chart rendering engine
│   ├── apptechs.js            # Technical indicators (RSI, Supertrend, MACD, etc.)
│   ├── appdraw.js             # Canvas drawing primitives
│   ├── appgraphs.js           # Sparklines and graph helpers
│   ├── appoptions.js          # Options chain and payoff diagram
│   ├── apppatterns.js         # Candlestick pattern detection
│   ├── appWall.js             # Wall dashboard layout coordinator
│   ├── dexie.min.js           # IndexedDB client-side database
│   ├── jquery.min.js          # DOM manipulation
│   └── supabase-js.js         # Supabase client SDK
├── autorefresh.js             # 30-second auto-refresh and live endpoint syncing
├── favicon.ico                # Site favicon
├── index.html                 # Main SPA application HTML
├── package.json               # Node.js project manifest
├── vercel.json                # Vercel deployment configuration
└── server.js                  # Production server & Vercel serverless entrypoint
```

## How to Run Locally

1. Start the server:
   ```powershell
   npm start
   ```
2. Open in your browser:
   ```
   http://127.0.0.1:3000/#home/NIFTY500_group
   ```
