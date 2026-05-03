const state = {
  config: null,
  soal: JSON.parse(localStorage.getItem('soal_ai') || '[]'),
  docType: 'soal',
  apiBase: localStorage.getItem('soal_api_base') || '',
  byok: localStorage.getItem('soal_openai_key') || '',
};

const FORM_HTML = `
<label>Jenjang<select name="jenjang" required><option value="">Pilih jenjang</option><option>SD</option><option>SMP</option><option>SMA</option></select></label>
<label>Mata Pelajaran<select name="mapel" required><option value="">Pilih mapel</option><option>Matematika</option><option>Bahasa Indonesia</option><option>Bahasa Inggris</option><option>IPA</option><option>IPS</option><option>PPKn</option><option>Informatika</option><option>Sejarah</option><option>Geografi</option><option>Ekonomi</option><option>Biologi</option><option>Fisika</option><option>Kimia</option></select></label>
<label>Kurikulum<select name="kurikulum" required><option value="">Pilih kurikulum</option><option value="Kurikulum Merdeka">Kurikulum Merdeka (CP)</option><option value="Kurikulum 2013">Kurikulum 2013 (KI/KD)</option></select></label>
<label>Jenis Asesmen<select name="asesmen" required><option value="">Pilih jenis asesmen</option><option>Ulangan Harian</option><option>TKA</option><option>Literasi</option><option>Numerasi</option></select></label>
<label>Level Bloom<select name="bloom" required><option value="">Pilih level</option><option value="C1">C1 – Mengingat</option><option value="C2">C2 – Memahami</option><option value="C3">C3 – Menerapkan</option><option value="C4">C4 – Menganalisis</option><option value="C5">C5 – Mengevaluasi</option><option value="C6">C6 – Mencipta</option></select></label>
<label>Jumlah Soal<input name="jumlah" type="number" min="1" max="50" value="10" required /></label>
<div class="actions"><button type="submit" class="btn primary">Generate Soal</button><button type="button" id="btnRegenerate" class="btn">Regenerate</button><button type="button" id="btnRandom" class="btn">Randomisasi</button></div>`;

const el = (s) => document.querySelector(s); const els = (s) => [...document.querySelectorAll(s)];
const getApiUrl = () => (state.apiBase.trim() ? `${state.apiBase.trim().replace(/\/$/, '')}/api/generate` : '/api/generate');

function buildPrompt(data) { const indikator = data.kurikulum === 'Kurikulum Merdeka' ? 'indikator kompetensi (CP)' : 'indikator kompetensi (KI/KD)'; const kurikulumLabel = data.kurikulum === 'Kurikulum Merdeka' ? 'berdasarkan Kurikulum Merdeka' : 'berdasarkan Kurikulum 2013'; return `Buatkan ${data.jumlah} soal pilihan ganda ${data.mapel} tingkat ${data.jenjang} untuk asesmen ${data.asesmen} dengan level ${data.bloom} ${kurikulumLabel}. Sertakan: 4 opsi jawaban, jawaban benar, pembahasan, ${indikator}, level bloom. Pastikan soal sesuai literasi numerasi dan valid secara akademik. Kembalikan hanya JSON dengan format: {"soal":[{"pertanyaan":"","opsi":["A","B","C","D"],"jawaban":"","pembahasan":"","bloom":"${data.bloom}","indikator":"","kurikulum":"${data.kurikulum}"}]}`; }
function validate(data) { if (Object.values(data).some((v) => !v)) throw new Error('Semua input wajib diisi.'); }
function showPage(id){els('.page').forEach(p=>p.classList.toggle('active',p.id===id));els('.nav-btn').forEach(n=>n.classList.toggle('active',n.dataset.page===id));}
function persist(){localStorage.setItem('soal_ai',JSON.stringify(state.soal));renderAll();}
function renderAll(){el('#statsGrid').innerHTML=`<div class="stat"><strong>${state.soal.length}</strong><br/>Total Soal</div><div class="stat"><strong>${state.apiBase? 'Terhubung':'Lokal'}</strong><br/>Backend</div><div class="stat"><strong>${state.byok? 'Aktif':'Server Env'}</strong><br/>OpenAI Key</div>`; renderResults(); renderDoc(); el('#configInfo').textContent=`Backend: ${state.apiBase||'(belum diatur)'} | OpenAI Key: ${state.byok? 'tersimpan lokal':'menggunakan env server'}`;}
function renderResults(){const c=el('#resultList'); if(!state.soal.length) return c.innerHTML='<p class="muted">Belum ada soal.</p>'; c.innerHTML=state.soal.map((q,i)=>`<article class="question-card"><div class="badges"><span class="badge">${q.bloom}</span><span class="badge">${q.kurikulum}</span></div><h4>${i+1}. ${q.pertanyaan}</h4><ol type="A">${q.opsi.map(o=>`<li class="option ${o===q.jawaban?'correct':''}">${o}</li>`).join('')}</ol><button class="btn" onclick="togglePembahasan(${i})">Lihat pembahasan</button><div id="pb-${i}" class="hidden"><p>${q.pembahasan}</p></div></article>`).join('');}
function renderDoc(){const d=el('#docPreview'); const rows=state.soal.map((q,i)=>({...q,no:i+1})); if(state.docType==='soal') d.innerHTML=rows.map(q=>`<p><strong>${q.no}.</strong>${q.pertanyaan}</p>`).join(''); if(state.docType==='kunci') d.innerHTML=rows.map(q=>`<p>${q.no}. ${q.jawaban}</p>`).join(''); if(state.docType==='kisi') d.innerHTML=`<table><tr><th>No</th><th>Kompetensi</th><th>Indikator</th><th>Bloom</th><th>No Soal</th></tr>${rows.map(q=>`<tr><td>${q.no}</td><td>${q.kurikulum}</td><td>${q.indikator}</td><td>${q.bloom}</td><td>${q.no}</td></tr>`).join('')}</table>`; if(state.docType==='kartu') d.innerHTML=rows.map(q=>`<p><strong>Soal:</strong>${q.pertanyaan}<br/><strong>Jawaban:</strong>${q.jawaban}<br/><strong>Pembahasan:</strong>${q.pembahasan}</p><hr>`).join('');}
async function generateSoal(data){el('#loading').classList.remove('hidden'); try{const res=await fetch(getApiUrl(),{method:'POST',headers:{'Content-Type':'application/json','x-openai-key':state.byok||''},body:JSON.stringify({prompt:buildPrompt(data)})}); if(!res.ok) throw new Error('Gagal generate'); const json=await res.json(); state.soal=json.soal||[]; state.config=data; persist(); showPage('hasil');}catch(e){alert(e.message);}finally{el('#loading').classList.add('hidden');}}
window.togglePembahasan=(i)=>el(`#pb-${i}`).classList.toggle('hidden');

document.addEventListener('DOMContentLoaded',()=>{
  el('#generatorForm').innerHTML=FORM_HTML;
  el('#apiBaseInput').value=state.apiBase; el('#openAiKeyInput').value=state.byok;
  els('.nav-btn').forEach((b)=>b.addEventListener('click',()=>showPage(b.dataset.page)));
  el('#saveConfigBtn').addEventListener('click',()=>{state.apiBase=el('#apiBaseInput').value.trim();state.byok=el('#openAiKeyInput').value.trim();localStorage.setItem('soal_api_base',state.apiBase);localStorage.setItem('soal_openai_key',state.byok);renderAll();alert('Konfigurasi tersimpan.');});
  el('#clearConfigBtn').addEventListener('click',()=>{state.apiBase='';state.byok='';localStorage.removeItem('soal_api_base');localStorage.removeItem('soal_openai_key');el('#apiBaseInput').value='';el('#openAiKeyInput').value='';renderAll();});
  el('#testConnectionBtn').addEventListener('click',async()=>{try{const r=await fetch(getApiUrl(),{method:'POST',headers:{'Content-Type':'application/json','x-openai-key':state.byok||''},body:JSON.stringify({prompt:'Kembalikan JSON {"soal":[]}'} )}); alert(r.ok?'Koneksi backend berhasil.':'Koneksi gagal.');}catch{alert('Koneksi gagal. Pastikan URL backend benar.')}});
  el('#generatorForm').addEventListener('submit',(e)=>{e.preventDefault();const data=Object.fromEntries(new FormData(e.target).entries());try{validate(data);generateSoal(data);}catch(err){alert(err.message);}});
  el('#generatorForm').addEventListener('click',(e)=>{if(e.target.id==='btnRegenerate'&&state.config)generateSoal(state.config); if(e.target.id==='btnRandom'){state.soal.sort(()=>Math.random()-.5);persist();}});
  els('[data-doc]').forEach((b)=>b.addEventListener('click',()=>{state.docType=b.dataset.doc;renderDoc();}));
  el('#btnPrint').addEventListener('click',()=>window.print());
  renderAll();
});
