# Aplikasi Ujian Online Sekolah (CBT Sekolah)

Aplikasi Computer-Based Test (CBT) sekolah lengkap berbasis **HTML5 + Tailwind CSS (CDN) + Vanilla JavaScript** dengan backend **Supabase** (PostgreSQL + Auth + Storage + RPC `SECURITY DEFINER`), siap diunggah ke hosting statis tanpa build tool.

## Struktur Proyek

```text
cbt-sekolah/
├── README.md
├── PANDUAN-INSTALASI.md
├── config.js
├── index.html              (Halaman Login Siswa)
├── ujian.html              (Ruang Ujian Aktif Siswa)
├── admin.html              (Login Admin + Dashboard 7 Menu)
├── css/style.css
├── js/
│   ├── supabase-client.js
│   ├── utils.js
│   ├── siswa-login.js
│   ├── siswa-ujian.js
│   └── admin/
│       ├── shell.js
│       ├── sekolah.js
│       ├── mapel.js
│       ├── kelas.js
│       ├── bank-soal.js
│       ├── pengawas.js
│       ├── kelola-ujian.js
│       └── rekap-nilai.js
└── sql/
    ├── 01-schema.sql
    ├── 02-rpc.sql
    ├── 03-storage.sql
    └── 04-seed.sql
```

## Fitur Utama

### Halaman Siswa (`index.html` & `ujian.html`)
- **Identitas Sekolah & Filter Jadwal per Kelas**: Siswa memilih kelas, sistem memuat daftar paket ujian aktif yang ditugaskan untuk kelas tersebut via RPC `daftar_paket_untuk_kelas`.
- **Verifikasi Token SHA-256 & Sesi Aman**: Login melalui RPC `masuk_ujian` tanpa mengekspos kunci jawaban maupun hash token ke browser siswa.
- **7 Tipe Soal**:
  1. Pilihan Ganda (`pg`) — huruf opsi A–E tetap urut meskipun urutan isi diacak.
  2. PG Kompleks Multi-Jawaban (`pgk_mcma`).
  3. PG Kompleks Kategori Benar/Salah (`pgk_kategori_bs`).
  4. PG Kompleks Kategori Sesuai/Tidak Sesuai (`pgk_kategori_sesuai`).
  5. Menjodohkan (`menjodohkan`) — sistem pasangan warna interaktif klik kiri ke kanan.
  6. Isian Singkat (`isian_singkat`) — mendukung multi-variasi kunci jawaban.
  7. Uraian (`uraian`).
- **Stimulus Wacana / Grafik**: Mendukung teks wacana panjang serta gambar yang dapat diperbesar (zoom).
- **Autosave Sequential Promise Queue**: Setiap perubahan jawaban otomatis disimpan berurutan ke server via RPC `simpan_jawaban_sesi`.
- **Proteksi Anti-Kecurangan**: Deteksi pindah tab (`visibilitychange`), keluar fokus (`blur`), keluar mode layar penuh (`fullscreenchange`), split-screen (`resize`), serta blokir copy/cut/paste/klik kanan/DevTools (`F12`, `Ctrl+Shift+I/J/C`).

### Halaman Admin & Pengawas (`admin.html`)
1. **Identitas Sekolah**: Edit profil satuan pendidikan, kepala sekolah, ketua panitia, serta unggah logo sekolah dan logo dinas.
2. **Mata Pelajaran**: CRUD daftar mata pelajaran dan kode mapel.
3. **Kelas & Siswa**: CRUD kelas, CRUD siswa, impor siswa massal via CSV (otomatis membuat kelas baru jika belum ada), dan cetak kartu peserta format A4 2 kolom.
4. **Bank Soal**: Tambah stimulus wacana/gambar, buat soal manual 7 tipe, unduh template CSV, impor massal dengan pratinjau tabel, dan ekspor bank soal ke CSV.
5. **Ruang Pengawas**: Statistik sesi real-time (total/mengerjakan/selesai/terkunci), progres jawaban siswa, log pelanggaran, buka kunci sesi (`buka_kunci_sesi`), dan reset sesi.
6. **Kelola Ujian**: Buat/edit paket ujian, generator token 6 karakter otomatis dengan hash SHA-256, pengaturan jadwal buka & deadline, assign multi-kelas, acak soal/opsi, serta opsi tampilkan nilai PG.
7. **Rekap Nilai & Uraian**: Rekap nilai PG & nilai akhir, koreksi soal uraian per siswa dengan skor & catatan, hitung ulang nilai otomatis, serta ekspor rekap nilai ke CSV.

---

## Panduan Setup & Instalasi

### 1. Setup Database Supabase (SQL Editor)
1. Buka proyek Anda di [Supabase Dashboard](https://supabase.com/dashboard).
2. Masuk ke menu **SQL Editor** -> **New Query**.
3. Jalankan 4 file SQL berikut **secara berurutan**:
   - `sql/01-schema.sql` (membuat tabel, index, dan aturan RLS)
   - `sql/02-rpc.sql` (membuat fungsi RPC `SECURITY DEFINER`)
   - `sql/03-storage.sql` (membuat bucket publik `gambar-soal` beserta policy-nya)
   - `sql/04-seed.sql` (mengisi data awal sekolah, kelas, dan mata pelajaran)

### 2. Buat Akun Admin di Authentication
1. Buka menu **Authentication** -> **Users** di Supabase Dashboard.
2. Klik **Add User** -> **Create New User**.
3. Masukkan email dan kata sandi untuk admin/pengawas sekolah, lalu klik **Create User**.

### 3. Edit `config.js`
Buka file `config.js` dan pastikan `URL` serta `ANON_KEY` sesuai dengan kredensial di menu **Project Settings -> API**:
```javascript
const SUPABASE_CONFIG = {
  URL: "https://<PROJECT_ID>.supabase.co",
  ANON_KEY: "<ANON_KEY_JWT_DIAWALI_eyJ>"
};
```

### 4. Upload ke Hosting Statis
Aplikasi ini tidak memerlukan build step (`npm`/`vite`). Anda dapat langsung mengunggah seluruh folder `cbt-sekolah/` ke:
- **Netlify Drop**: Tarik dan lepas folder `cbt-sekolah` ke [app.netlify.com/drop](https://app.netlify.com/drop).
- **cPanel / Hosting Sekolah**: Upload seluruh isi folder `cbt-sekolah` ke direktori `public_html/`.
- **GitHub Pages**: Push seluruh isi folder ke repository GitHub dan aktifkan GitHub Pages pada branch utama.

### 5. Pengujian Sistem (Admin & Siswa Paralel)
1. Buka `admin.html` di jendela browser utama dan masuk dengan akun admin.
2. Tambahkan minimal 1 siswa di menu **3. Kelas & Siswa**, buat soal di **4. Bank Soal**, lalu aktifkan jadwal ujian di **6. Kelola Ujian** (catat **Token** yang dihasilkan).
3. Buka `index.html` di jendela **Incognito / Private Window**, pilih **Kelas** dan **Mata Pelajaran**, masukkan **Nomor Peserta** dan **Token**, lalu uji pengerjaan soal hingga selesai.
4. Pantau progres siswa secara bersamaan di menu **5. Ruang Pengawas** dan periksa nilai di **7. Rekap Nilai & Uraian**.

---

## Troubleshooting Umum

- **"Invalid API key"**: Pastikan `ANON_KEY` di `config.js` menggunakan key publik (`anon` / `publishable` key) dari menu *Project Settings -> API*, bukan `service_role` key, dan pastikan tidak ada spasi tambahan.
- **"Token salah"**: Token diverifikasi dengan mencocokkan hash SHA-256 huruf kapital (`UPPERCASE`). Simpan ulang paket ujian di menu **6. Kelola Ujian** agar `token_hash` tersinkronisasi dengan `token_plain`.
- **"RLS error" / "new row violates row-level security policy"**: Pastikan Anda sudah login di `admin.html` menggunakan akun dari *Authentication -> Users* sehingga berstatus `authenticated`, dan pastikan `sql/01-schema.sql` sudah dijalankan penuh.
- **"Storage 403" saat upload gambar**: Pastikan `sql/03-storage.sql` sudah dijalankan sehingga bucket `gambar-soal` berstatus `PUBLIC` dan memiliki policy `INSERT/UPDATE/DELETE` untuk peran `authenticated`.
