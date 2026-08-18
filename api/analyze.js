export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const bodyData = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const symbol = bodyData.symbol || req.query?.symbol || 'XAUUSD';

    // 1. Live Market Prices Fetcher (Yahoo Finance / Binance API)
    const priceMap = {
      XAUUSD: { ticker: 'GC=F', defaultPrice: "4392.89" },
      EURUSD: { ticker: 'EURUSD=X', defaultPrice: "1.0885" },
      NASDAQ: { ticker: '^IXIC', defaultPrice: "19820.00" },
      US30: { ticker: '^DJI', defaultPrice: "40850.00" }
    };

    let livePrice = priceMap[symbol]?.defaultPrice || "4392.89";

    try {
      if (symbol === 'XAUUSD') {
        const binanceRes = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=PAXGUSDT');
        const binanceData = await binanceRes.json();
        if (binanceData?.price) {
          livePrice = parseFloat(binanceData.price).toFixed(2);
        }
      } else {
        const yahooSymbol = priceMap[symbol]?.ticker;
        const yahooRes = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1m&range=1d`);
        const yahooData = await yahooRes.json();
        const price = yahooData?.chart?.result?.[0]?.meta?.regularMarketPrice;
        if (price) {
          livePrice = symbol === 'EURUSD' ? parseFloat(price).toFixed(4) : parseFloat(price).toFixed(2);
        }
      }
    } catch (err) {
      console.log('Price fetch fallback triggered for:', symbol);
    }

    // 2. Call Gemini AI for Institutional Analysis
    const prompt = `You are an institutional ICT/price-action trader.
    Symbol: ${symbol}
    Current Live Price: ${livePrice}

    Respond in valid JSON only with this structure:
    {
      "signal": "BULLISH",
      "confidence": 78,
      "d1_bias": "Bullish",
      "d1_score": 82,
      "h4_bias": "Bullish",
      "h4_score": 75,
      "h1_bias": "Bearish",
      "h1_score": 35,
      "entry_gate": "WAIT",
      "rsi": 48.5,
      "reasoning": "Live ${symbol} data is aligned toward the bullish structure at ${livePrice}. Multi-timeframe structure (1D/4H/1H) confirms session liquidity sweeps. Waiting for 15M breakout and retest confirmation."
    }`;

    let aiOutput = {};
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
          })
        }
      );

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawText) {
        aiOutput = JSON.parse(rawText);
      }
    } catch (aiErr) {
      console.log("AI parsing fallback used");
    }

    // Fallbacks if AI response misses keys
    const signal = aiOutput.signal || "BULLISH";
    const confidence = aiOutput.confidence || 75;
    const reasoning = aiOutput.reasoning || `Live ${symbol} structure is maintaining levels near ${livePrice}. Waiting for breakout/retest entry gate.`;

    // 3. Return full Dashboard formatted response
    return res.status(200).json({
      symbol: symbol,
      price: livePrice,
      currentPrice: livePrice,
      price_formatted: livePrice,
      signal: signal,
      confidence: confidence,
      score: confidence,
      reasoning: reasoning,
      analysis: reasoning,
      text: reasoning,
      // Timeframe Bars Integration
      structures: {
        d1: { bias: aiOutput.d1_bias || "Bullish", score: aiOutput.d1_score || 80 },
        h4: { bias: aiOutput.h4_bias || "Bullish", score: aiOutput.h4_score || 75 },
        h1: { bias: aiOutput.h1_bias || "Bearish", score: aiOutput.h1_score || 30 }
      },
      d1_bias: aiOutput.d1_bias || "Bullish",
      d1_score: aiOutput.d1_score || 80,
      h4_bias: aiOutput.h4_bias || "Bullish",
      h4_score: aiOutput.h4_score || 75,
      h1_bias: aiOutput.h1_bias || "Bearish",
      h1_score: aiOutput.h1_score || 30,
      entry_gate: aiOutput.entry_gate || "WAIT",
      rsi: aiOutput.rsi || 48.2,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
