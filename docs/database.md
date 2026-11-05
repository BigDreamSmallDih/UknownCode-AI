# Database

Migrasi ada di `supabase/migrations`. Migrasi ini ditulis di Phase 1 dan diterapkan ke project Supabase di Phase 2
(lihat [auth.md](auth.md)). Gunakan project Supabase khusus UknownCode.

## Tabel

| Tabel | Fungsi |
| --- | --- |
| `profiles` | Profil pengguna, dibuat otomatis oleh trigger saat user baru mendaftar |
| `github_connections` | Instalasi GitHub App milik pengguna (tanpa token) |
| `projects` | Proyek, terhubung ke repo GitHub |
| `ai_providers` | Konfigurasi provider per pengguna; kunci API ada di Vault |
| `agent_sessions` | Sesi agent per proyek |
| `agent_tasks` | Tahap dan persetujuan tugas agent |
| `file_changes` | Perubahan file yang diusulkan; `approved` harus true sebelum commit |
| `executions` | Audit eksekusi perintah di sandbox |
| `usage_logs` | Pemakaian token dan latensi per permintaan AI |

## Kepemilikan data

Setiap tabel punya `user_id`. Tabel anak memakai foreign key gabungan `(parent_id, user_id)`,
sehingga baris tidak bisa menunjuk ke induk milik pengguna lain.

## Row Level Security

- RLS aktif di semua tabel; hak akses `anon` dicabut.
- Pengguna bisa menulis langsung hanya ke `projects`, `profiles` (nama dan avatar), dan kolom
  non-rahasia `ai_providers`.
- Tabel lain read-only untuk pengguna. Backend menulisnya dengan service role setelah validasi.

## Menerapkan skema

**Cara termudah (dari HP):** buka Supabase Dashboard, **SQL Editor**, tempel seluruh isi
`supabase/setup.sql`, lalu **Run**. Jalankan sekali di project yang baru dan kosong.

`setup.sql` dihasilkan dari folder `supabase/migrations`. Setelah mengubah migrasi, buat ulang
dengan `./scripts/bundle-sql.sh`.

**Lewat Supabase CLI:**

```bash
npx supabase login
npx supabase link --project-ref <PROJECT_REF>
npx supabase db push
```

Setelah dijalankan, buka **Table Editor** dan pastikan sembilan tabel ada dan RLS aktif.
