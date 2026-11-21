# Panduan Lengkap Pemasangan Sistem CBT TKA (GitHub + Supabase)

Paket berkas ini berisi seluruh komponen siap pakai untuk menjalankan **Sistem Ujian CBT TKA Anti-Kecurangan**:
1. `database_supabase.sql` — Skrip pembuatan 7 tabel database, aturan keamanan kunci jawaban, penyimpanan gambar otomatis, dan fungsi penilaian server.
2. `config.js` — Berkas konfigurasi tempat menempelkan URL dan Kunci Supabase Anda.
3. `index.html` — Halaman Ruang Ujian Peserta lengkap dengan deteksi layar terbelah, layar penuh wajib, anti-pindah tab, dan 7 tipe soal TKA.
4. `admin.html` — Dashboard Admin & Pengawas (6 menu lengkap termasuk Identitas Sekolah dan Cetak Kartu).

---

## Tahap 1: Siapkan Database & Akun Pengawas di Supabase
1. Buka dasbor proyek **Supabase** Anda.
2. Klik menu **SQL Editor** di bilah kiri -> **New query**.
3. Buka berkas `database_supabase.sql`, salin seluruh isinya, tempel ke SQL Editor, lalu klik **Run**.
4. Buat akun login khusus Admin/Pengawas:
   - Buka menu **Authentication** -> **Users** -> **Add user** -> **Create new user**.
   - Masukkan email dan kata sandi pengawas, lalu klik **Create user**.

## Tahap 2: Isi Kunci Penghubung di `config.js`
1. Di dasbor Supabase, buka **Project Settings** -> **API Keys**.
2. Salin **Project URL** dan **Publishable Key**.
3. Buka berkas `config.js` dan tempelkan kedua nilai tersebut pada tempat yang disediakan.

## Tahap 3: Unggah ke GitHub & Aktifkan GitHub Pages
1. Buat repositori baru di **GitHub** (misalnya bernama `cbt-tka`).
2. Unggah keempat berkas (`index.html`, `admin.html`, `config.js`, `PANDUAN_LENGKAP.md`) ke repositori tersebut.
3. Buka tab **Settings** -> **Pages** di repositori GitHub Anda.
4. Pada bagian **Branch**, pilih `main` dan folder `/ (root)`, lalu klik **Save**.
5. Tunggu 1–2 menit hingga muncul alamat situs web ujian Anda:
   - Halaman Peserta Ujian: `https://usernameanda.github.io/cbt-tka/`
   - Halaman Admin & Pengawas: `https://usernameanda.github.io/cbt-tka/admin.html`

## Tahap 4: Uji Coba Pertama
1. Buka alamat `/admin.html`, masuk menggunakan email dan kata sandi pengawas yang dibuat pada Tahap 1.
2. Lengkapi profil dan logo sekolah di menu **6. Identitas Sekolah**.
3. Buka alamat utama `/` di peramban lain atau mode penyamaran (*Incognito*), lalu coba masuk menggunakan akun contoh bawaan:
   - **Nomor Peserta:** `2026001`
   - **Token Ujian:** `TKA2026`
