# Arsitektur UknownCode AI

## Gambaran umum

```
Android (Capacitor + React) ──HTTPS──▶ Backend (Fastify) ──▶ Supabase (Postgres, Auth, Vault)
                                          │
                                          ├──▶ Provider AI (Gemini / Claude / OpenAI)
                                          ├──▶ GitHub App API
                                          └──▶ Worker eksekusi terisolasi (Phase 7)
```

Aplikasi Android tidak pernah memegang rahasia. Kunci provider AI, private key GitHub App, dan
service role Supabase hanya ada di backend.

## Struktur repo

| Path | Isi |
| --- | --- |
| `apps/mobile` | Aplikasi React + Vite yang dibungkus Capacitor |
| `backend` | Server Fastify (TypeScript, ESM) |
| `supabase/migrations` | Migrasi SQL |
| `docs` | Dokumentasi |
| `.github/workflows` | CI dan build APK |

## Keputusan teknis

- **Monorepo npm workspaces**: satu `npm ci`, satu CI.
- **Editor kode: CodeMirror 6** (Phase 5), bukan Monaco. Monaco tidak mendukung layar sentuh dan
  keyboard virtual dengan baik; CodeMirror 6 dirancang untuk mobile.
- **Hosting backend: Render (tier gratis)** direkomendasikan. Batasan: layanan tidur setelah
  tidak aktif, jadi permintaan pertama bisa lambat (aplikasi memberi timeout 10 detik dan tombol
  "Periksa ulang"). Eksekusi kode terisolasi (Phase 7) tidak bisa berjalan di tier gratis tanpa
  menurunkan keamanan, jadi akan dibahas terpisah sebelum Phase 7.
- **Router**: `HashRouter`, karena aman untuk WebView Capacitor.
- **Tidak ada token GitHub yang disimpan.** Installation token dibuat backend saat dibutuhkan dari
  private key GitHub App.

## Batas keamanan

- Pengguna hanya bisa menulis langsung ke `profiles`, `projects`, dan kolom non-rahasia
  `ai_providers`. Data audit (eksekusi, penggunaan, perubahan file) hanya ditulis backend.
- Kunci API provider disimpan di Supabase Vault; tabel hanya menyimpan referensi (`vault_secret_id`)
  yang tidak bisa dibaca klien.
- Perubahan kode tidak pernah dipublikasikan ke GitHub tanpa persetujuan eksplisit pengguna.
