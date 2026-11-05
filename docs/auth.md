# Autentikasi (Phase 2)

Login memakai Supabase Auth (email + kata sandi). Aplikasi hanya memegang **URL project** dan
**publishable key**, keduanya aman ada di aplikasi karena data dilindungi Row Level Security.
Jangan pernah memasukkan secret key atau service role ke aplikasi atau repo.

## Alur

```
Aplikasi ──signIn──▶ Supabase Auth ──▶ sesi (disimpan di perangkat)
Aplikasi ──GET /me + Bearer token──▶ Backend ──verifikasi token──▶ Supabase Auth
                                       └──baca profil dengan token pengguna──▶ tabel profiles (RLS)
```

- Sesi disimpan lewat Capacitor Preferences dan diperbarui otomatis.
- Login hanya diwajibkan jika build memiliki konfigurasi Supabase. Tanpa konfigurasi, aplikasi
  tetap terbuka dan Settings menampilkan "Login belum dikonfigurasi".
- Backend membaca profil memakai token milik pengguna, jadi RLS tetap berlaku.

## Menyiapkan Supabase

1. Buat project baru di supabase.com (disarankan project terpisah dari aplikasi lain).
2. Terapkan migrasi di `supabase/migrations` secara berurutan (lihat [database.md](database.md)).
3. Di **Authentication → Providers**, pastikan Email aktif. Untuk pengujian cepat, matikan
   "Confirm email"; untuk produksi biarkan aktif.
4. Catat **Project URL** dan **publishable key** (Settings → API Keys).

## Konfigurasi aplikasi (build APK)

Di GitHub: **Settings → Secrets and variables → Actions → Variables**, tambahkan:

| Variable | Isi |
| --- | --- |
| `VITE_SUPABASE_URL` | `https://<ref>.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | publishable key (`sb_publishable_...`) |

Lalu jalankan ulang workflow **Build Android APK**.

## Konfigurasi backend

Isi environment di hosting (Render): `SUPABASE_URL` dan `SUPABASE_PUBLISHABLE_KEY` (nilai yang
sama). Tanpa keduanya, `/me` membalas 503 `AUTH_NOT_CONFIGURED`.

## Pengujian

- Otomatis: `npm test` (validasi input login, pemetaan error, route `/me` dengan auth palsu).
- Manual di HP: daftar, masuk, buka Home dan pastikan baris **Akun** menampilkan nama, keluar,
  tutup lalu buka aplikasi dan pastikan sesi tetap ada.
