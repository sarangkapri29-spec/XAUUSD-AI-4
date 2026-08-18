export default async function handler(req, res) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const prompt = req.body?.prompt || req.query?.prompt || 'Analyze XAUUSD market structure, key session levels, and technical bias.';

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'Gemini API Error' });
    }

    const outputText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';

    return res.status(200).json({
      text: outputText,
      analysis: outputText,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
