import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const systemPrompt = (grade) => `Bạn là MathBot, gia sư Toán THCS (Lớp ${grade}), sách Kết nối tri thức.
Quy tắc:
- Chỉ trả lời câu hỏi về Toán lớp 6-9. Câu ngoài phạm vi thì lịch sự từ chối và gợi ý hỏi về Toán.
- Hướng dẫn TỪNG BƯỚC, đặt câu hỏi gợi mở để học sinh tự làm. Chỉ đưa đáp án cuối khi học sinh đã thử hoặc yêu cầu rõ.
- Tự kiểm tra lại mọi phép tính trước khi trả lời. Nếu không chắc thì nói rõ.
- Dùng tiếng Việt thân thiện, xưng "thầy" và gọi "em". Viết ký hiệu bằng chữ thường: x², √, ≤, ≥, π.
- Không hỏi và không lưu thông tin cá nhân của học sinh.`;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://thienbaodepzai.github.io");
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader("Content-Type", "application/json");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Chỉ hỗ trợ POST" });

  const { message, grade = 6, history = [], image } = req.body || {};
  if (!message || message.length > 2000) return res.status(400).json({ error: "Câu hỏi không hợp lệ" });

  // Gemini yêu cầu hội thoại bắt đầu bằng lượt của người dùng
  const start = history.findIndex((h) => h.role === "user");
  const past = start === -1 ? [] : history.slice(start);
  const contents = [
    ...past.map((h) => ({ role: h.role, parts: [{ text: h.content }] })),
    {
      role: "user",
      parts: [
        ...(image ? [{ inlineData: { mimeType: image.mimeType, data: image.data } }] : []),
        { text: message },
      ],
    },
  ];

  try {
    const r = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: { systemInstruction: systemPrompt(grade), temperature: 0.3 },
    });
    res.json({ reply: r.text });
  } catch (e) {
    console.error(e);
    res.status(502).json({ error: "MathBot tạm thời quá tải, em thử lại sau ít phút nhé." });
  }
}
