export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method tidak diizinkan' });

  try {
    const { prompt } = req.body || {};
    if (!prompt) return res.status(400).json({ error: 'Prompt wajib diisi' });
    if (!process.env.OPENAI_API_KEY) return res.status(500).json({ error: 'OPENAI_API_KEY belum dikonfigurasi' });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'Anda adalah asisten penyusun soal akademik Indonesia. Keluarkan hanya JSON valid sesuai skema {"soal":[{"pertanyaan":"","opsi":["","","",""],"jawaban":"","pembahasan":"","bloom":"","indikator":"","kurikulum":""}]}.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: 'Gagal dari OpenAI', detail: text });
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    const parsed = JSON.parse(content);

    if (!parsed?.soal || !Array.isArray(parsed.soal)) {
      return res.status(500).json({ error: 'Format JSON AI tidak valid' });
    }

    return res.status(200).json(parsed);
  } catch (error) {
    return res.status(500).json({ error: 'Kesalahan internal server', detail: error.message });
  }
}
