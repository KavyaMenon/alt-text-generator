import { readFile } from "node:fs/promises";

const imagePath = process.argv[2];
if (!imagePath) {
  console.error("Usage: node test-ollama.mjs <image-path>");
  process.exit(1);
}

const image = (await readFile(imagePath)).toString("base64");
const start = Date.now();

const res = await fetch("http://localhost:11434/api/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "llava",
    stream: false,
    options: { num_predict: 80, temperature: 0.2, num_ctx: 2048 },
    messages: [
      {
        role: "user",
        content:
          "Write alt text for this image in one sentence under 125 characters. Return only the alt text.",
        images: [image],
      },
    ],
  }),
});

if (!res.ok) {
  console.error("Error:", res.status, await res.text());
  process.exit(1);
}

const data = await res.json();
console.log("Alt text:", data.message.content.trim());
console.log(`Took ${((Date.now() - start) / 1000).toFixed(1)}s`);
