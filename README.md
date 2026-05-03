# S.O.A.L
S.O.A.L – **Sistem Otomatisasi Asesmen & Latihan**.

Aplikasi ini terdiri dari:
- **Frontend statis** (`/frontend`) untuk GitHub Pages.
- **Backend serverless** (`/api/generate.js`) untuk panggilan OpenAI agar API key tidak ditaruh di frontend.

---

## Arsitektur

Alur aplikasi:

`Frontend (GitHub Pages) -> Backend (Vercel) -> OpenAI API`

> Rekomendasi produksi: gunakan API key di **Environment Variables Vercel**, bukan disimpan di browser.

---

## Struktur Proyek

```bash
frontend/
  index.html
  style.css
  script.js
api/
  generate.js
.github/workflows/
  deploy-pages.yml
```

---

## Deploy Frontend ke GitHub Pages

1. Push repo ini ke GitHub.
2. Pastikan workflow `deploy-pages.yml` aktif.
3. Buka **GitHub Repository -> Settings -> Pages**.
4. Pada **Build and deployment**, pilih **Source: GitHub Actions**.
5. Setelah workflow sukses, URL frontend akan tersedia di Pages.

---

## Deploy Backend ke Vercel (Step-by-step sangat detail)

### 1) Buat project baru di Vercel

1. Masuk ke https://vercel.com
2. Klik **Add New... -> Project**.
3. Pilih repository GitHub `S.O.A.L` ini.
4. Pada halaman konfigurasi project, gunakan pengaturan berikut:

- **Framework Preset**: `Other`
- **Root Directory**: `.` (root repository)
- **Build Command**: *(kosongkan / default)*
- **Output Directory**: *(kosongkan / default)*
- **Install Command**: *(kosongkan / default)*

> Karena kita menggunakan file serverless `api/generate.js`, preset `Other` paling aman.

### 2) Tambahkan OpenAI API Key di Vercel

Sebelum klik deploy final:

1. Buka bagian **Environment Variables**.
2. Tambahkan variable baru:
   - **Name**: `OPENAI_API_KEY`
   - **Value**: `sk-...` (API key OpenAI Anda)
   - **Environment**: centang `Production` (dan `Preview/Development` bila diperlukan)
3. Klik **Save**.
4. Lanjutkan klik **Deploy**.

Jika project sudah terlanjur dibuat tanpa env var:

- Masuk ke **Project -> Settings -> Environment Variables**
- Tambahkan `OPENAI_API_KEY`
- Lalu lakukan **Redeploy** (Deployments -> pilih latest -> Redeploy)

### 3) Ambil URL backend Vercel

Setelah deploy sukses, Anda akan dapat domain seperti:

`https://nama-project-anda.vercel.app`

Endpoint API yang dipakai frontend:

`https://nama-project-anda.vercel.app/api/generate`

---

## Hubungkan Frontend GitHub Pages ke Backend Vercel

1. Buka aplikasi S.O.A.L di GitHub Pages.
2. Masuk ke halaman **Dashboard Konfigurasi**.
3. Pada kolom **URL Backend Vercel**, isi:
   - `https://nama-project-anda.vercel.app`
4. Klik **Simpan Konfigurasi**.
5. Klik **Tes Koneksi**.
6. Jika berhasil, gunakan menu **Generator Soal**.

---

## Opsi OpenAI Key untuk pengguna

Aplikasi mendukung 2 mode:

1. **Mode direkomendasikan (server env)**
   - API key disimpan di Vercel (`OPENAI_API_KEY`)
   - Frontend tidak perlu mengisi key

2. **Mode BYOK pribadi (opsional)**
   - User mengisi key di Dashboard (`OpenAI API Key Pribadi`)
   - Key dikirim ke backend via header `x-openai-key`
   - Cocok untuk uji coba personal

> Peringatan: mode BYOK menyimpan key di localStorage browser, jangan dipakai untuk perangkat publik.

---

## Troubleshooting

### 1) Halaman tampil tapi generate gagal
- Pastikan URL backend Vercel benar (tanpa `/api/generate`, cukup domain utama).
- Pastikan `OPENAI_API_KEY` sudah diisi di Vercel.
- Coba klik **Tes Koneksi** dari Dashboard.

### 2) GitHub Pages hanya tampil judul / style tidak termuat
- Pastikan deploy workflow GitHub Actions berhasil.
- Pastikan akses lewat URL Pages hasil deploy terbaru (bukan file lokal yang tidak lengkap).

### 3) Error 500 dari API
- Periksa **Vercel Logs** di tab Deployments.
- Periksa key OpenAI valid dan billing OpenAI aktif.

---

## Pengembangan Lokal (opsional)

Frontend dapat dijalankan dengan static server apa pun. Untuk backend serverless lokal, disarankan pakai Vercel CLI.

Contoh cepat:

```bash
npm i -g vercel
vercel dev
```

Lalu buka URL local yang diberikan Vercel.

---

## Catatan Model

Backend default menggunakan model:

- `gpt-4o-mini`

Dapat diubah pada file `api/generate.js` jika diperlukan.
