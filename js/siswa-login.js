// ============================================================================
// LOGIKA HALAMAN LOGIN PESERTA & KONFIRMASI DATA (index.html)
// ============================================================================

(function () {
  let daftarPaketKelas = [];
  let sekolahInfo = {};

  const elKelas = document.getElementById("select-kelas");
  const elPaket = document.getElementById("select-paket-ujian");
  const elForm = document.getElementById("form-login-peserta");
  const elErr = document.getElementById("login-error-box");
  const elBtn = document.getElementById("btn-submit-login");

  function showLoginError(msg) {
    elErr.textContent = msg;
    elErr.classList.remove("hidden");
  }

  function hideLoginError() {
    elErr.classList.add("hidden");
  }

  function applySchoolLogo(imgId, fallbackId, url) {
    const imgEl = document.getElementById(imgId);
    const fbEl = document.getElementById(fallbackId);
    if (!imgEl || !fbEl) return;

    if (url) {
      imgEl.onerror = () => {
        imgEl.classList.add("hidden");
        fbEl.classList.remove("hidden");
      };
      imgEl.src = url;
      imgEl.classList.remove("hidden");
      fbEl.classList.add("hidden");
    } else {
      imgEl.classList.add("hidden");
      fbEl.classList.remove("hidden");
    }
  }

  async function initLoginPage() {
    if (!window.SB) {
      showLoginError("Konfigurasi Supabase (config.js) belum terbaca atau tidak valid.");
      return;
    }

    try {
      const { data: sek, error: errSek } = await window.SB
        .from("identitas_sekolah")
        .select("*")
        .order("id", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (errSek) throw errSek;

      if (sek) {
        sekolahInfo = sek;
        document.getElementById("login-nama-sekolah").textContent = sek.nama_sekolah || "CBT Sekolah";
        document.getElementById("login-tahun-pelajaran").textContent =
          "Tahun Pelajaran " + (sek.tahun_pelajaran || "-");

        applySchoolLogo("login-logo-sekolah", "login-logo-fallback", sek.logo_sekolah_url);

        if (sek.logo_dinas_url) {
          const imgDinas = document.getElementById("login-logo-dinas");
          imgDinas.onerror = () => imgDinas.classList.add("hidden");
          imgDinas.src = sek.logo_dinas_url;
          imgDinas.classList.remove("hidden");
        }
      }

      const { data: kelasList, error: errKelas } = await window.SB
        .from("kelas")
        .select("id, nama_kelas, tingkat")
        .order("tingkat", { ascending: true })
        .order("nama_kelas", { ascending: true });

      if (errKelas) throw errKelas;

      if (!kelasList || kelasList.length === 0) {
        elKelas.innerHTML = '<option value="">-- Belum ada data kelas --</option>';
        return;
      }

      elKelas.innerHTML =
        '<option value="">-- Pilih Kelas Anda --</option>' +
        kelasList
          .map((k) => `<option value="${k.id}">${CBTUtils.escapeHtml(k.nama_kelas)}</option>`)
          .join("");
    } catch (err) {
      showLoginError("Gagal memuat data awal sekolah: " + err.message);
    }
  }

  elKelas.addEventListener("change", async () => {
    hideLoginError();
    const kelasId = elKelas.value;
    document.getElementById("box-info-jadwal").classList.add("hidden");

    if (!kelasId) {
      daftarPaketKelas = [];
      elPaket.disabled = true;
      elPaket.innerHTML = '<option value="">-- Pilih Kelas Dulu --</option>';
      return;
    }

    elPaket.disabled = true;
    elPaket.innerHTML = '<option value="">Memuat jadwal mapel...</option>';

    try {
      const { data, error } = await window.SB.rpc("daftar_paket_untuk_kelas", {
        p_kelas_id: kelasId
      });

      if (error) throw error;
      daftarPaketKelas = Array.isArray(data) ? data : [];

      if (daftarPaketKelas.length === 0) {
        elPaket.innerHTML = '<option value="">-- Tidak ada jadwal aktif untuk kelas ini --</option>';
        return;
      }

      elPaket.disabled = false;
      elPaket.innerHTML = daftarPaketKelas
        .map(
          (p) =>
            `<option value="${p.id}">${CBTUtils.escapeHtml(p.nama_mapel)} — ${CBTUtils.escapeHtml(p.judul_ujian)}</option>`
        )
        .join("");

      tampilkanInfoJadwal();
    } catch (err) {
      elPaket.innerHTML = '<option value="">Gagal memuat jadwal</option>';
      showLoginError("Gagal memuat daftar mata pelajaran: " + err.message);
    }
  });

  elPaket.addEventListener("change", tampilkanInfoJadwal);

  function tampilkanInfoJadwal() {
    const paketId = elPaket.value;
    const paket = daftarPaketKelas.find((p) => p.id === paketId);
    const box = document.getElementById("box-info-jadwal");

    if (!paket) {
      box.classList.add("hidden");
      return;
    }

    box.classList.remove("hidden");
    document.getElementById("info-jenis-badge").textContent = paket.jenis_ujian || "Ujian";
    document.getElementById("info-judul-ujian").textContent = `${paket.nama_mapel} (${paket.judul_ujian})`;
    document.getElementById("info-durasi").textContent = `${paket.durasi_menit} Menit`;
    document.getElementById("info-waktu-buka").textContent = paket.waktu_buka
      ? CBTUtils.formatWaktuIndo(paket.waktu_buka)
      : "Langsung Tersedia";
    document.getElementById("info-deadline").textContent = paket.batas_akhir_pengerjaan
      ? CBTUtils.formatWaktuIndo(paket.batas_akhir_pengerjaan)
      : "Tidak Dibatasi";

    const now = Date.now();
    const bukaTime = paket.waktu_buka ? new Date(paket.waktu_buka).getTime() : null;
    const tutupTime = paket.batas_akhir_pengerjaan ? new Date(paket.batas_akhir_pengerjaan).getTime() : null;
    const statusBadge = document.getElementById("info-status-jadwal");

    if (bukaTime && now < bukaTime) {
      statusBadge.textContent = "BELUM DIBUKA";
      statusBadge.className = "px-2 py-0.5 rounded font-bold text-[11px] bg-amber-200 text-amber-900";
      elBtn.disabled = true;
      elBtn.textContent = "Ujian Belum Dibuka";
    } else if (tutupTime && now > tutupTime) {
      statusBadge.textContent = "SUDAH BERAKHIR";
      statusBadge.className = "px-2 py-0.5 rounded font-bold text-[11px] bg-red-200 text-red-900";
      elBtn.disabled = true;
      elBtn.textContent = "Batas Waktu Mengerjakan Habis";
    } else {
      statusBadge.textContent = "SEDANG DIBUKA";
      statusBadge.className = "px-2 py-0.5 rounded font-bold text-[11px] bg-emerald-200 text-emerald-900";
      elBtn.disabled = false;
      elBtn.textContent = "Lanjut ke Konfirmasi Data →";
    }
  }

  function tampilkanModalKonfirmasi(data) {
    applySchoolLogo("konf-logo-sekolah", "konf-logo-fallback", sekolahInfo.logo_sekolah_url);
    document.getElementById("konf-nama-sekolah").textContent = sekolahInfo.nama_sekolah || "CBT Sekolah";
    document.getElementById("konf-no-peserta").textContent = data.siswa.no_peserta || "-";
    document.getElementById("konf-nama-siswa").textContent = data.siswa.nama_lengkap || "-";
    document.getElementById("konf-kelas").textContent = data.siswa.nama_kelas || "-";
    document.getElementById("konf-mapel").textContent = `${data.paket.nama_mapel} — ${data.paket.judul_ujian}`;
    document.getElementById("konf-durasi-soal").textContent = `${data.paket.durasi_menit} Menit • ${data.soal_list.length} Soal`;

    const modal = document.getElementById("modal-konfirmasi-peserta");
    modal.classList.remove("hidden");
    modal.classList.add("flex");
  }

  document.getElementById("btn-batal-konfirmasi").addEventListener("click", () => {
    const modal = document.getElementById("modal-konfirmasi-peserta");
    modal.classList.add("hidden");
    modal.classList.remove("flex");
    elBtn.disabled = false;
    elBtn.textContent = "Lanjut ke Konfirmasi Data →";
  });

  document.getElementById("btn-mulai-ujian-fix").addEventListener("click", async () => {
    if (document.documentElement.requestFullscreen) {
      try {
        await document.documentElement.requestFullscreen();
      } catch (_) {}
    }
    window.location.href = "ujian.html";
  });

  elForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideLoginError();

    const kelasId = elKelas.value;
    const paketId = elPaket.value;
    const noPeserta = document.getElementById("input-no-peserta").value.trim();
    const token = document.getElementById("input-token").value.trim().toUpperCase();

    if (!kelasId) {
      showLoginError("Silakan pilih kelas terlebih dahulu.");
      return;
    }
    if (!paketId) {
      showLoginError("Silakan pilih mata pelajaran / paket ujian.");
      return;
    }
    if (!noPeserta || !token) {
      showLoginError("Nomor peserta dan token ujian wajib diisi.");
      return;
    }

    elBtn.disabled = true;
    elBtn.textContent = "Memverifikasi Peserta & Token...";

    try {
      const { data, error } = await window.SB.rpc("masuk_ujian", {
        p_no_peserta: noPeserta,
        p_paket_id: paketId,
        p_token: token
      });

      if (error) throw error;
      if (!data || !data.ok) {
        showLoginError(data?.pesan || "Gagal masuk ruang ujian.");
        elBtn.disabled = false;
        elBtn.textContent = "Lanjut ke Konfirmasi Data →";
        return;
      }

      sessionStorage.setItem(
        "cbt_state",
        JSON.stringify({
          sesi: data.sesi,
          siswa: data.siswa,
          paket: data.paket,
          soal_list: data.soal_list,
          sisa_detik: data.sisa_detik,
          sekolah: {
            nama_sekolah: sekolahInfo.nama_sekolah || "",
            logo_sekolah_url: sekolahInfo.logo_sekolah_url || "",
            logo_dinas_url: sekolahInfo.logo_dinas_url || ""
          }
        })
      );

      tampilkanModalKonfirmasi(data);
    } catch (err) {
      showLoginError("Terjadi kesalahan koneksi: " + err.message);
      elBtn.disabled = false;
      elBtn.textContent = "Lanjut ke Konfirmasi Data →";
    }
  });

  initLoginPage();
})();