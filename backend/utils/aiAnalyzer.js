const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const analyzeCode = async (code, language, task) => {
  try {
    const prompt = `
You are an expert code reviewer and frontend development teacher. Analyze the following ${language} code for a learning platform.

Task Description: ${task}

Code:
\`\`\`${language}
${code}
\`\`\`

Please analyze this code and provide:
1. A score from 0-100 based on correctness, best practices, optimization, and readability
2. Specific feedback items with line numbers (if applicable), message, and type (error, warning, or suggestion)
3. General comments on the solution

Return ONLY a JSON object in this exact format:
{
  "score": number,
  "feedback": [
    {
      "line": number or null,
      "message": "string",
      "type": "error" | "warning" | "suggestion"
    }
  ],
  "generalComment": "string",
  "improvements": ["string"]
}

Be thorough but encouraging. Focus on educational value.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful code reviewer for a frontend learning platform. Always respond with valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const responseText = completion.choices[0].message.content;

    // Extract JSON from response (in case there's markdown formatting)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : responseText;

    const analysis = JSON.parse(jsonStr);

    // Ensure score is within bounds
    analysis.score = Math.max(0, Math.min(100, analysis.score));

    return analysis;
  } catch (error) {
    console.error("AI Analysis Error:", error);

    // Fallback response if AI fails
    return {
      score: 50,
      feedback: [
        {
          line: null,
          message:
            "AI analysis temporarily unavailable. Please try again later.",
          type: "warning",
        },
      ],
      generalComment: "Unable to analyze code at this moment.",
      improvements: ["Try again later"],
    };
  }
};

module.exports = { analyzeCode };
