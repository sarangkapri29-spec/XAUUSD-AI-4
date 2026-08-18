# XAU/USD AI Market Analyst

Vercel-ready app with:
- Live XAU/USD market data
- 1D, 4H, 1H and 15M technical inputs
- OpenAI AI analysis
- BUY / SELL / NO TRADE
- BUY/SELL probabilities
- AI confidence
- Breakout/retest gate
- AI reasoning

## Vercel environment variable
Set `OPENAI_API_KEY` in the Vercel project environment. Never commit a real `.env` file or API key.

The app uses Yahoo Finance's XAUUSD=X chart endpoint for market data and OpenAI for the analysis layer.
