import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYMBOL_MAP = {
  "XAU/USD": "GC=F",
  "EUR/USD": "EURUSD=X",
  "NASDAQ": "^IXIC",
  "US30": "^DJI"
};

export default async function handler(req, res) {
  try {
    const symbolQuery = req.query.symbol || "XAU/USD";
    const yahooSymbol = SYMBOL_MAP[symbolQuery] || "GC=F";

    // 1. Fetch Live Candle Data from Yahoo Finance
    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?range=1d&interval=15m`;
    const response = await fetch(yahooUrl, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    
    const json = await response.json();
    const result = json?.chart?.result?.[0];
    
    if (!result || !result.indicators?.quote?.[0]?.close) {
      throw new Error("Could not fetch market data");
    }

    const closes = result.indicators.quote[0].close.filter(v => v !== null);
    const currentPrice = closes[closes.length - 1].toFixed(2);

    // 2. Request OpenAI Technical Analysis
    const prompt = `Analyze this live asset: ${symbolQuery}. Current price is ${currentPrice}. Recent 15-minute close prices: ${closes.slice(-5).join(", ")}. 
Provide a quick market analysis. Return ONLY a valid JSON object in this exact format:
{
  "bias": "BULLISH" or "BEARISH" or "NEUTRAL",
  "confidence": 75,
  "reasoning": "Two clear sentences explaining price structure and momentum."
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    const aiData = JSON.parse(completion.choices[0].message.content);

    return res.status(200).json({
      price: currentPrice,
      bias: aiData.bias,
      confidence: aiData.confidence,
      reasoning: aiData.reasoning
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
