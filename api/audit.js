export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const { imageBase64, mimeType } = req.body || {};

    if (!imageBase64) {
      return res.status(400).json({ error: "Image data missing." });
    }

    const prompt = `You are a world-class institutional ICT and SMC price-action trading mentor.
    Analyze this trade chart screenshot in detail.
    Provide an institutional audit with this exact JSON structure:
    {
      "grade": "B+",
      "trade_verdict": "Valid Entry / Poor Risk Management",
      "entry_quality": "High-probability Liquidity Sweep at session open.",
      "key_mistake": "Stop loss was placed inside the Fair Value Gap instead of below the swing low.",
      "what_went_well": "Waited for clear Change of Character (CHoCH) on 5M timeframe.",
      "actionable_fix": "Always place SL beyond the institutional displacement leg to avoid news stop runs."
    }`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: mimeType || "image/png",
                  data: imageBase64.replace(/^data:image\/\w+;base64,/, "")
                }
              }
            ]
          }],
          generationConfig: { responseMimeType: "application/json" }
        })
      }
    );

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    const auditData = rawText ? JSON.parse(rawText) : {};

    return res.status(200).json({
      success: true,
      audit: auditData
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
