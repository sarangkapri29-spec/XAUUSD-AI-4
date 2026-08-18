import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  try {
    const prompt = req.body?.prompt || req.query?.prompt || 'Analyze XAUUSD market structure, key session levels, and technical bias.';
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

    const result = await model.generateContent(prompt);
    const response = await result.response;

    return res.status(200).json({ 
      text: response.text(),
      analysis: response.text()
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
