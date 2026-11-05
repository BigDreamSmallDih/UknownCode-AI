# AI (OpenRouter)

Chat AI memakai [OpenRouter](https://openrouter.ai), satu API untuk banyak model (ada yang gratis).
Aplikasi tidak pernah memegang kunci AI. Semua permintaan lewat backend.

## Alur

```
Aplikasi ──POST /ai/chat (Bearer token Supabase)──▶ Backend ──▶ OpenRouter
         ◀── Server-Sent Events: delta, done, error ──┘
```

- `GET /ai/models`: daftar model (gratis lebih dulu), di-cache 10 menit.
- `POST /ai/chat`: chat streaming. Hanya pengguna yang login. Prompt sistem ditambahkan oleh
  server, klien tidak bisa mengirim pesan `system`.
- Batas per pengguna: `AI_RATE_LIMIT` permintaan per 10 menit (default 30), supaya satu akun
  tidak menghabiskan kuota kunci server.
- Kesalahan dari OpenRouter dipetakan ke kode umum (`RATE_LIMITED`, `MODEL`, `TIMEOUT`,
  `UPSTREAM`, `AUTH`). Teks mentah dari server upstream tidak pernah dikirim ke aplikasi.

## Menyiapkan

1. Buat API key di openrouter.ai/keys (model berlabel `:free` tidak memerlukan saldo).
2. Di hosting backend (mis. Render), tambahkan environment `OPENROUTER_API_KEY`.
   **Jangan** menaruh kunci ini di repo atau di aplikasi.
3. Di aplikasi: **Settings → Backend**, isi URL server, lalu buka tab **AI Agent**.

## Yang belum ada

- Kunci OpenRouter per pengguna (saat ini satu kunci server untuk semua pengguna).
- Provider Gemini, Claude, dan OpenAI langsung.
- Riwayat percakapan tersimpan dan pencatatan pemakaian ke tabel `usage_logs`.
- Agent perencana dan pengkode (Phase 6).
