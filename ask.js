export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "No message provided" });

  const SHEETY_URL = "https://api.sheety.co/e5f42c6a1510007d10970f8672a067dd/داتا تجربة/medicinesPrices";

  function normalize(text) {
    const replacements = {
      "أ": "ا","إ": "ا","آ": "ا","ة": "ه","ى": "ي","ؤ": "و","ئ": "ي"
    };
    for (let a in replacements) text = text.split(a).join(replacements[a]);
    return text.toLowerCase().trim();
  }

  function fuzzyMatch(name, choices) {
    let n = normalize(name);
    let best = null;
    let bestScore = 0;

    for (let c of choices) {
      let norm = normalize(c);
      let score = 0;
      for (let i = 0; i < Math.min(n.length, norm.length); i++) {
        if (n[i] === norm[i]) score++;
      }
      score = score / Math.max(n.length, norm.length);
      if (score > bestScore) {
        bestScore = score;
        best = c;
      }
    }
    return bestScore >= 0.3 ? best : null;
  }

  try {
    const sheet = await fetch(SHEETY_URL).then(r => r.json());
    const rows = sheet.medicinesPrices || [];
    const names = rows.map(r => r.medicine);

    const match = fuzzyMatch(message, names);
    if (match) {
      const row = rows.find(r => r.medicine === match);
      return res.status(200).json({
        reply: `✔ المنتج متوفر\n\n📌 الاسم: ${row.medicine}\n💰 السعر: ${row.price}$\n📦 المتوفر: ${row.stock}`
      });
    }

    return res.status(200).json({ reply: "❌ المنتج غير موجود." });
  } catch (e) {
    return res.status(500).json({ error: e.toString() });
  }
}