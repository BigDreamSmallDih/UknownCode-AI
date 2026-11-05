# Database

Migrasi ada di `supabase/migrations`. Migrasi ini baru **ditulis** di Phase 1 dan belum diterapkan
ke project Supabase mana pun. Penerapan dilakukan di Phase 2 bersama autentikasi.

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

## Menerapkan migrasi dari Termux

```bash
npm install -g supabase   # atau: npx supabase ...
supabase login
supabase link --project-ref <PROJECT_REF>
supabase db push
```

Jika Supabase CLI tidak berjalan di Termux, salin isi tiap file `.sql` secara berurutan ke
SQL Editor di dashboard Supabase.
