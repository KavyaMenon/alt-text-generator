import express from "express";
import multer from "multer";
const app = express();


const PORT = 3000;
const OLLAMA_URL = "http://localhost:11434/api/chat";
const MODEL = "llava";
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];


const PROMPT = `Write alt text for this image for a screen reader user.
One sentence, under 125 characters.
Don't start with "Image of" or "Picture of".
Include any visible text. Return only the alt text.`;


const upload = multer({
  storage: multer.memoryStorage(), // keep the file in RAM (a Buffer), not on disk
  limits: { fileSize: MAX_FILE_SIZE }, // enforce the size limit above
});


app.use(express.static("public"));


app.post("/api/alt-text", upload.single("image"), async (req, res) => {
  try {

    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }


    if (!ALLOWED_TYPES.includes(req.file.mimetype)) {
      return res.status(400).json({ error: "Unsupported image type" });
    }


    const imageBase64 = req.file.buffer.toString("base64");


    const response = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        stream: false,
        options: {
          num_predict: 80,
          temperature: 0.2,
          num_ctx: 2048,
        },
        messages: [
          {
            role: "user",
            content: PROMPT,
            images: [imageBase64],
          },
        ],
      }),
    });


    if (!response.ok) {
      throw new Error(`Ollama error ${response.status}`);
    }

    const data = await response.json();

    const altText = data.message.content.trim().replace(/^["']|["']$/g, "");


    res.json({ altText });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Failed to generate alt text. Is Ollama running?" });
  }
});

app.listen(PORT, () => {
  console.log(`Running on http://localhost:${PORT}`);
});