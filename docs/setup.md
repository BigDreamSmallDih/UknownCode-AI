# Setup

## Kebutuhan

- Node.js 20 atau lebih baru (di Termux: `pkg install nodejs`)
- Git

## Menjalankan dari Termux

```bash
git clone https://github.com/BigDreamSmallDih/UknownCode-AI.git
cd UknownCode-AI
npm install
npm test
npm run typecheck
npm run build
```

Backend lokal:

```bash
npm run dev:backend      # http://localhost:8080/health
```

Aplikasi web (pratinjau di browser HP):

```bash
npm run dev:mobile       # http://localhost:5173
```

## Variabel lingkungan backend

Lihat `backend/.env.example`. Semua variabel divalidasi saat server start; nilai yang salah
menghentikan server dengan pesan yang jelas.

## Membangun APK (tanpa Android Studio)

1. Push ke `main`, atau buka tab **Actions** di GitHub, pilih **Build Android APK**, lalu **Run workflow**.
2. Setelah selesai, unduh artifact `uknowncode-debug-apk`.
3. Pasang `app-debug.apk` di HP (izinkan instalasi dari sumber tidak dikenal).

Ini APK debug untuk pengujian. APK release yang ditandatangani dibuat di Phase 9.

## Deploy backend ke Render (gratis)

1. Buat Web Service baru di Render dari repo ini.
2. Root directory: `backend`. Build: `npm install --include=dev && npm run build`. Start: `npm start`.
3. Environment: `NODE_ENV=production`, `CORS_ORIGINS=https://localhost`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, dan `OPENROUTER_API_KEY` (lihat [ai.md](ai.md)).
4. Isi URL layanan di aplikasi: **Settings → Backend**.

Catatan: tier gratis Render tidur saat tidak dipakai, jadi permintaan pertama bisa memakan waktu.
