/*Code used to generate context-aware responses using OpenAI API.
  - When the frontend makes a POST request to http://localhost:5000/chat, this server takes the user’s conversation and sends it to the OpenAI API.
  - It builds the prompt like this:
      1)A system message: tells the model to act like a friendly French conversation partner.
      2)The history: all previous user + bot messages (so the bot remembers context).
      3)The new user message: the most recent input.
  - OpenAI responds with a natural French reply.
  - The server sends that reply back to your frontend as JSON.
*/

// top of server.js
import express from "express"; //"express" creates a mini web server
import fetch from "node-fetch";  //to make HTTPS requests
import dotenv from "dotenv";  // loads vars from .env (API keys)
import cors from "cors";  //allows backend and frontend communication (React)

dotenv.config();
const app = express(); 
app.use(cors());
app.use(express.json());

app.post("/chat", async (req, res) => {
  try {
    const { history, userInput } = req.body;

    // Convert frontend message format → OpenAI format
    const openaiMessages = [
      { role: "system", content: "Tu es un partenaire de conversation en français, amical et encourageant. Réponds toujours en français." },
      ...history.map(m => ({
        role: m.isUser ? "user" : "assistant",
        content: m.text
      })),
      { role: "user", content: userInput }
    ];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: openaiMessages,
        temperature: 0.8
      })
    });

    const data = await response.json();
    const reply = data.choices[0].message.content;

    res.json({ reply });
  } catch (err) {
    console.error("Chat API error:", err);
    res.status(500).json({ error: "Erreur côté serveur" });
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
