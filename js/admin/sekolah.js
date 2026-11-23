// ============================================================================
// MENU 1: IDENTITAS SEKOLAH & UPLOAD LOGO
// ============================================================================

window.AdminSekolah = {
  async mount() {
    const container = document.getElementById("tab-sekolah");
    container.innerHTML = `
      <div>
        <h2 class="text-xl font-extrabold text-slate-900">Identitas Sekolah &amp; Kop Dokumen</h2>
        <p class="text-xs text-slate-500">Data ini ditampilkan pada halaman login siswa dan kartu peserta ujian.</p>
      </div>

      <form id="form-sekolah" class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-bold text-slate-600 mb-1">Nama Satuan Pendidikan / Sekolah</label>
          <input type="text" id="sek-nama" required class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold" />
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-600 mb-1">NPSN</label>
          <input type="text" id="sek-npsn" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm" />
        </div>
        <div class="md:col-span-2">
          <label class="block text-xs font-bold text-slate-600 mb-1">Alamat Lengkap Sekolah</label>
          <input type="text" id="sek-alamat" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm" />
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-600 mb-1">Kota / Kabupaten</label>
          <input type="text" id="sek-kota" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm" />
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-600 mb-1">Tahun Pelajaran</label>
          <input type="text" id="sek-tahun" placeholder="2025/2026" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm" />
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-600 mb-1">Nama Kepala Sekolah</label>
          <input type="text" id="sek-kepsek" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm" />
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-600 mb-1">NIP Kepala Sekolah</label>
          <input type="text" id="sek-nip" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm" />
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-600 mb-1">Ketua Panitia Ujian</label>
          <input type="text" id="sek-panitia" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm" />
        </div>
        <div></div>

        <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
          <label class="block text-xs font-bold text-slate-700">Logo Sekolah (Upload ke Storage)</label>
          <input type="file" id="file-logo-sekolah" accept="image/*" class="text-xs w-full" />
          <input type="hidden" id="sek-logo-url" />
          <img id="sek-logo-prev" alt="Preview Logo Sekolah" class="h-16 mt-2 object-contain hidden rounded bg-white p-1 border" />
        </div>

        <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
          <label class="block text-xs font-bold text-slate-700">Logo Dinas / Yayasan (Upload ke Storage)</label>
          <input type="file" id="file-logo-dinas" accept="image/*" class="text-xs w-full" />
          <input type="hidden" id="sek-dinas-url" />
          <img id="sek-dinas-prev" alt="Preview Logo Dinas" class="h-16 mt-2 object-contain hidden rounded bg-white p-1 border" />
        </div>

        <div class="md:col-span-2 pt-2">
          <button type="submit" id="btn-save-sekolah" class="px-6 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm shadow">
            Simpan Identitas Sekolah
          </button>
        </div>
      </form>
    `;

    await this.loadData();

    document.getElementById("file-logo-sekolah").addEventListener("change", (e) =>
      this.handleUploadLogo(e.target, "sek-logo-url", "sek-logo-prev")
    );
    document.getElementById("file-logo-dinas").addEventListener("change", (e) =>
      this.handleUploadLogo(e.target, "sek-dinas-url", "sek-dinas-prev")
    );
    document.getElementById("form-sekolah").addEventListener("submit", (e) => this.handleSave(e));
  },

  async loadData() {
    const { data, error } = await window.SB.from("identitas_sekolah").select("*").eq("id", 1).maybeSingle();
    if (error) {
      CBTUtils.showToast("Gagal memuat identitas sekolah: " + error.message, "error");
      return;
    }
    const d = data || {};
    window.AdminApp.cache.sekolah = d;
    document.getElementById("sidebar-school-name").textContent = d.nama_sekolah || "Sekolah CBT";
    document.getElementById("sek-nama").value = d.nama_sekolah || "";
    document.getElementById("sek-npsn").value = d.npsn || "";
    document.getElementById("sek-alamat").value = d.alamat || "";
    document.getElementById("sek-kota").value = d.kota_kabupaten || "";
    document.getElementById("sek-tahun").value = d.tahun_pelajaran || "";
    document.getElementById("sek-kepsek").value = d.kepala_sekolah || "";
    document.getElementById("sek-nip").value = d.nip_kepala_sekolah || "";
    document.getElementById("sek-panitia").value = d.ketua_panitia || "";
    document.getElementById("sek-logo-url").value = d.logo_sekolah_url || "";
    document.getElementById("sek-dinas-url").value = d.logo_dinas_url || "";

    if (d.logo_sekolah_url) {
      const p = document.getElementById("sek-logo-prev");
      p.src = d.logo_sekolah_url;
      p.classList.remove("hidden");
    }
    if (d.logo_dinas_url) {
      const p = document.getElementById("sek-dinas-prev");
      p.src = d.logo_dinas_url;
      p.classList.remove("hidden");
    }
  },

  async handleUploadLogo(inputEl, hiddenId, previewId) {
    const file = inputEl.files[0];
    if (!file) return;
    try {
      CBTUtils.showToast("Mengunggah logo...", "info");
      const url = await CBTUtils.uploadImageToBucket(file, "logo");
      document.getElementById(hiddenId).value = url;
      const img = document.getElementById(previewId);
      img.src = url;
      img.classList.remove("hidden");
      CBTUtils.showToast("Logo berhasil diunggah!", "success");
    } catch (err) {
      CBTUtils.showToast("Gagal mengunggah logo: " + err.message, "error");
    }
  },

  async handleSave(e) {
    e.preventDefault();
    const btn = document.getElementById("btn-save-sekolah");
    btn.disabled = true;
    btn.textContent = "Menyimpan...";

    const payload = {
      id: 1,
      nama_sekolah: document.getElementById("sek-nama").value.trim(),
      npsn: document.getElementById("sek-npsn").value.trim(),
      alamat: document.getElementById("sek-alamat").value.trim(),
      kota_kabupaten: document.getElementById("sek-kota").value.trim(),
      tahun_pelajaran: document.getElementById("sek-tahun").value.trim(),
      kepala_sekolah: document.getElementById("sek-kepsek").value.trim(),
      nip_kepala_sekolah: document.getElementById("sek-nip").value.trim(),
      ketua_panitia: document.getElementById("sek-panitia").value.trim(),
      logo_sekolah_url: document.getElementById("sek-logo-url").value || null,
      logo_dinas_url: document.getElementById("sek-dinas-url").value || null,
      updated_at: new Date().toISOString()
    };

    const { error } = await window.SB.from("identitas_sekolah").upsert(payload, { onConflict: "id" });
    btn.disabled = false;
    btn.textContent = "Simpan Identitas Sekolah";

    if (error) {
      CBTUtils.showToast("Gagal menyimpan: " + error.message, "error");
    } else {
      CBTUtils.showToast("Identitas sekolah berhasil disimpan!", "success");
      await this.loadData();
    }
  }
};
