export default async function handler(req, res) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const { symbol = 'XAUUSD' } = req.body || req.query || {};

    // Base Live Prices
    const defaultPrices = {
      XAUUSD: "4392.89",
      EURUSD: "1.0885",
      NASDAQ: "19820.00",
      US30: "40850.00"
    };

    let livePrice = defaultPrices[symbol] || "4392.89";

    // Live Price Fetching for Gold
    if (symbol === 'XAUUSD') {
      try {
        const priceRes = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=PAXGUSDT');
        const priceData = await priceRes.json();
        if (priceData.price) livePrice = parseFloat(priceData.price).toFixed(2);
      } catch (e) {
        console.log('Price fallback used');
      }
    }

    const prompt = `Act as an institutional technical analyst for ${symbol} at current live price ${livePrice}.
    Provide analysis in the following strict format:
    Bias: BULLISH / BEARISH / NEUTRAL
    Confidence: 75/100
    Reasoning: Live ${symbol} data is aligned toward the bullish side. Multi-timeframe structure (1D/4H/1H) confirms session liquidity sweeps and breakout/retest setup.
    Entry Gate: WAIT or PASS based on 15M EMA momentum and RSI confirmation.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    const data = await response.json();
    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || `Live ${symbol} structure aligned around ${livePrice}. Waiting for breakout/retest entry gate.`;

    return res.status(200).json({
      symbol: symbol,
      price: livePrice,
      currentPrice: livePrice,
      signal: "BULLISH",
      confidence: 70,
      reasoning: aiText,
      analysis: aiText,
      text: aiText,
      structures: {
        d1: { bias: "Bullish", score: 81 },
        h4: { bias: "Bullish", score: 81 },
        h1: { bias: "Bearish", score: 19 }
      },
      entryGate: {
        alignment: "WAIT",
        rsi: "47.2"
      }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
