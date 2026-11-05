# UknownCode AI

AI-powered Android coding environment with multi-provider agents and GitHub integration.

**Status: Phase 1 (fondasi dan UI Android).** Fitur lain ditampilkan sebagai "Belum tersedia"
sampai fasenya dibangun.

## Isi repo

- `apps/mobile`: aplikasi Android (React + Vite + Capacitor)
- `backend`: server Fastify
- `supabase/migrations`: skema database dan RLS
- `docs`: [arsitektur](docs/architecture.md), [database](docs/database.md), [setup](docs/setup.md)

## Mulai cepat

```bash
npm install
npm test
npm run build
```

Panduan lengkap, termasuk membangun APK lewat GitHub Actions, ada di [docs/setup.md](docs/setup.md).

## Roadmap

1. Fondasi dan UI Android (sedang dikerjakan)
2. Autentikasi dan database Supabase
3. Integrasi GitHub
4. Integrasi AI multi-provider
5. Editor kode dan explorer
6. Agent perencana dan pengkode
7. Eksekusi sandbox
8. Operasi Git dan Pull Request
9. Build APK otomatis
10. Pengujian, review keamanan, rilis

## Lisensi

MIT
