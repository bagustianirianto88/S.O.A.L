const state = {
  config: null,
  soal: JSON.parse(localStorage.getItem('soal_ai') || '[]'),
  docType: 'soal',
  apiBase: localStorage.getItem('soal_api_base') || '',
};

const el = (s) => document.querySelector(s);

function getApiUrl() {
  const trimmed = state.apiBase.trim();
  if (!trimmed) return '/api/generate';
  return `${trimmed.replace(/\/$/, '')}/api/generate`;
}
const els = (s) => [...document.querySelectorAll(s)];

function buildPrompt(data) {
  const indikator = data.kurikulum === 'Kurikulum Merdeka' ? 'indikator kompetensi (CP)' : 'indikator kompetensi (KI/KD)';
  const kurikulumLabel = data.kurikulum === 'Kurikulum Merdeka' ? 'berdasarkan Kurikulum Merdeka' : 'berdasarkan Kurikulum 2013';
  return `Buatkan ${data.jumlah} soal pilihan ganda ${data.mapel} tingkat ${data.jenjang} untuk asesmen ${data.asesmen} dengan level ${data.bloom} ${kurikulumLabel}. Sertakan: 4 opsi jawaban, jawaban benar, pembahasan, ${indikator}, level bloom. Pastikan soal sesuai literasi numerasi dan valid secara akademik. Kembalikan hanya JSON dengan format: {"soal":[{"pertanyaan":"","opsi":["A","B","C","D"],"jawaban":"","pembahasan":"","bloom":"${data.bloom}","indikator":"","kurikulum":"${data.kurikulum}"}]} `;
}

function validate(data) {
  if (Object.values(data).some((v) => !v)) throw new Error('Semua input wajib diisi.');
  if (Number(data.jumlah) < 1 || Number(data.jumlah) > 50) throw new Error('Jumlah soal harus 1-50.');
}

function renderStats() {
  el('#statsGrid').innerHTML = `
    <div class="stat"><strong>${state.soal.length}</strong><br/>Total Soal Tersimpan</div>
    <div class="stat"><strong>${new Set(state.soal.map((s) => s.mapel)).size || 0}</strong><br/>Mapel</div>
    <div class="stat"><strong>${state.config?.kurikulum || '-'}</strong><br/>Kurikulum Aktif</div>`;
}

function renderResults() {
  const c = el('#resultList');
  if (!state.soal.length) return (c.innerHTML = '<p class="muted">Belum ada soal.</p>');
  c.innerHTML = state.soal.map((q, i) => `
    <article class="question-card">
      <div class="badges">
        <span class="badge">${q.bloom}</span><span class="badge">${q.kurikulum}</span><span class="badge">${state.config?.asesmen || '-'}</span>
      </div>
      <h4>${i + 1}. ${q.pertanyaan}</h4>
      <ol type="A">${q.opsi.map((o) => `<li class="option ${o === q.jawaban ? 'correct' : ''}">${o}</li>`).join('')}</ol>
      <button class="btn" onclick="togglePembahasan(${i})">Lihat pembahasan</button>
      <button class="btn" onclick="editSoal(${i})">Edit soal</button>
      <div id="pb-${i}" class="hidden"><p><strong>Pembahasan:</strong> ${q.pembahasan}</p></div>
    </article>`).join('');
}

window.togglePembahasan = (i) => el(`#pb-${i}`).classList.toggle('hidden');
window.editSoal = (i) => {
  const text = prompt('Edit pertanyaan:', state.soal[i].pertanyaan);
  if (text) state.soal[i].pertanyaan = text;
  persistAndRender();
};

function renderDoc() {
  const d = el('#docPreview');
  const rows = state.soal.map((q, i) => ({ ...q, no: i + 1 }));
  if (state.docType === 'soal') d.innerHTML = rows.map((q) => `<p><strong>${q.no}.</strong> ${q.pertanyaan}</p><ol type="A">${q.opsi.map((o) => `<li>${o}</li>`).join('')}</ol>`).join('');
  if (state.docType === 'kunci') d.innerHTML = rows.map((q) => `<p>${q.no}. ${q.jawaban}</p>`).join('');
  if (state.docType === 'kisi') d.innerHTML = `<table><tr><th>No</th><th>Kompetensi (CP/KD)</th><th>Indikator</th><th>Bloom</th><th>No Soal</th></tr>${rows.map((q) => `<tr><td>${q.no}</td><td>${q.kurikulum}</td><td>${q.indikator}</td><td>${q.bloom}</td><td>${q.no}</td></tr>`).join('')}</table>`;
  if (state.docType === 'kartu') d.innerHTML = rows.map((q) => `<hr><p><strong>Soal:</strong> ${q.pertanyaan}</p><p><strong>Jawaban:</strong> ${q.jawaban}</p><p><strong>Pembahasan:</strong> ${q.pembahasan}</p><p><small>${q.kurikulum} | ${q.bloom} | ${q.indikator}</small></p>`).join('');
}

function persistAndRender() {
  localStorage.setItem('soal_ai', JSON.stringify(state.soal));
  renderStats(); renderResults(); renderDoc();
}

async function generateSoal(data) {
  el('#loading').classList.remove('hidden');
  try {
    const res = await fetch(getApiUrl(), {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data, prompt: buildPrompt(data) }),
    });
    if (!res.ok) throw new Error('Gagal generate dari server.');
    const json = await res.json();
    state.soal = json.soal || [];
    state.config = data;
    persistAndRender();
    showPage('hasil');
  } catch (e) {
    alert(e.message);
  } finally {
    el('#loading').classList.add('hidden');
  }
}

function showPage(id) {
  els('.page').forEach((p) => p.classList.toggle('active', p.id === id));
  els('.nav-btn').forEach((n) => n.classList.toggle('active', n.dataset.page === id));
}

els('.nav-btn').forEach((b) => b.addEventListener('click', () => showPage(b.dataset.page)));
el('#generatorForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target).entries());
  try { validate(data); generateSoal(data); } catch (err) { alert(err.message); }
});
el('#btnRegenerate').addEventListener('click', () => state.config && generateSoal(state.config));
el('#btnRandom').addEventListener('click', () => { state.soal.sort(() => Math.random() - .5); persistAndRender(); });
els('[data-doc]').forEach((b) => b.addEventListener('click', () => { state.docType = b.dataset.doc; renderDoc(); }));
el('#btnPrint').addEventListener('click', () => window.print());

persistAndRender();


const apiBaseInput = el('#apiBaseInput');
if (apiBaseInput) {
  apiBaseInput.value = state.apiBase;
  el('#saveApiBase').addEventListener('click', () => {
    const val = apiBaseInput.value.trim();
    state.apiBase = val;
    localStorage.setItem('soal_api_base', val);
    alert('URL backend berhasil disimpan.');
  });
}
