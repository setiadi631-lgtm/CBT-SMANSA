# Panduan Instalasi Cepat CBT Sekolah (5 Langkah)

Ikuti 5 langkah berikut untuk menjalankan aplikasi CBT Sekolah dari awal hingga siap digunakan ujian:

## Langkah 1: Siapkan Proyek & Database Supabase
1. Login ke [https://supabase.com/dashboard](https://supabase.com/dashboard) dan buat proyek baru (pilih region terdekat, misalnya Singapore).
2. Buka **SQL Editor** -> **New query**.
3. Salin dan jalankan isi file di folder `sql/` satu per satu sesuai urutan nomor:
   1. `sql/01-schema.sql`
   2. `sql/02-rpc.sql`
   3. `sql/03-storage.sql`
   4. `sql/04-seed.sql`
4. Pastikan setiap eksekusi menampilkan status `Success. No rows returned`.

## Langkah 2: Buat Akun Login Admin / Pengawas
1. Di dashboard Supabase, buka menu **Authentication** -> **Users**.
2. Klik **Add user** -> **Create new user**.
3. Isikan **Email** (contoh: `admin@sekolah.sch.id`) dan **Password**, centang *Auto Confirm User*, lalu simpan.

## Langkah 3: Hubungkan `config.js`
1. Buka **Project Settings** (ikon gerigi) -> **API** di Supabase.
2. Salin **Project URL** dan **anon / publishable key**.
3. Buka file `config.js` di folder proyek dan isikan kedua nilai tersebut:
   ```javascript
   const SUPABASE_CONFIG = {
     URL: "https://xxxxxxxxxxxx.supabase.co",
     ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   };
   ```

## Langkah 4: Publikasikan ke Hosting Statis
Unggah seluruh file dan folder di dalam `cbt-sekolah/` ke layanan hosting statis pilihan Anda:
- **Netlify Drop**: Drag & drop folder `cbt-sekolah` ke halaman Netlify Drop.
- **GitHub Pages / Vercel / Cloudflare Pages**: Upload ke repository lalu deploy sebagai static site.
- **Server Lokal / cPanel Sekolah**: Ekstrak ke folder `public_html` atau `htdocs`.

## Langkah 5: Persiapan Data Ujian Sebelum Hari-H
1. Buka `admin.html` dan login dengan akun admin pada Langkah 2.
2. Lengkapi nama sekolah & unggah logo di menu **1. Identitas Sekolah**.
3. Tambah/impor data kelas dan siswa via CSV di menu **3. Kelas & Siswa**, lalu cetak kartu peserta (A4).
4. Input atau impor soal via CSV di menu **4. Bank Soal**.
5. Buat jadwal ujian, tentukan kelas peserta, dan catat token di menu **6. Kelola Ujian**.
