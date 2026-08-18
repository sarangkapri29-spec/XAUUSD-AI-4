export default async function handler(req, res) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    // Fetch live market price
    let livePrice = "2645.50";
    try {
      const priceRes = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=PAXGUSDT');
      const priceData = await priceRes.json();
      if (priceData.price) {
        livePrice = parseFloat(priceData.price).toFixed(2);
      }
    } catch (e) {
      console.log('Price fetch fallback used');
    }

    // Call Gemini API
    const prompt = `Act as an institutional technical analyst for XAUUSD (Gold). Current Price is ${livePrice}. Provide brief price action analysis including key liquidity levels, session bias, and breakout/retest setup. Keep it under 100 words.`;

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
    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'XAUUSD displaying bullish market structure near key liquidity levels.';

    return res.status(200).json({
      price: livePrice,
      currentPrice: livePrice,
      signal: "BULLISH",
      confidence: 85,
      reasoning: aiText,
      analysis: aiText,
      text: aiText
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
