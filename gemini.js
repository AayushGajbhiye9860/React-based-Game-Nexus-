import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY)

export async function getGameVibe(gameName, genres) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
  const prompt = `In 2 sentences, tell a gamer why they'd love "${gameName}" (genres: ${genres}). Be enthusiastic and specific.`
  const result = await model.generateContent(prompt)
  return result.response.text()
}