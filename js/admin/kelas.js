// ============================================================================
// MENU 3: CRUD KELAS, CRUD SISWA, IMPOR/EKSPOR CSV (DENGAN L/P) & KARTU A4
// ============================================================================

window.AdminKelas = {
  kelasList: [],
  siswaList: [],

  async mount() {
    const container = document.getElementById("tab-kelas");
    container.innerHTML = `
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-xl font-extrabold text-slate-900">Manajemen Kelas &amp; Data Siswa</h2>
          <p class="text-xs text-slate-500">Kelola rombongan belajar, peserta ujian, impor/ekspor CSV (termasuk L/P), dan cetak kartu peserta A4.</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button type="button" id="btn-tmpl-siswa" class="px-3.5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold">
            Template CSV Siswa
          </button>
          <label class="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer">
            Impor CSV Siswa
            <input type="file" id="file-csv-siswa" accept=".csv,.txt" class="hidden" />
          </label>
          <button type="button" id="btn-export-siswa" class="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold">
            Ekspor CSV Siswa
          </button>
          <button type="button" id="btn-cetak-kartu" class="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow">
            Cetak Kartu Peserta (A4)
          </button>
        </div>
      </div>

      <!-- BAGIAN A: DATA KELAS -->
      <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 class="font-bold text-sm text-slate-800 border-b pb-2">A. Daftar Kelas / Rombongan Belajar</h3>
        <form id="form-kelas" class="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input type="hidden" id="kelas-id" />
          <input type="text" id="kelas-nama" required placeholder="Nama Kelas (cth: XII IPA 1)"
            class="px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-bold" />
          <input type="text" id="kelas-tingkat" placeholder="Tingkat (cth: XII)"
            class="px-3.5 py-2 rounded-xl border border-slate-300 text-sm" />
          <input type="text" id="kelas-wali" placeholder="Wali Kelas (Opsional)"
            class="px-3.5 py-2 rounded-xl border border-slate-300 text-sm" />
          <div class="flex gap-2">
            <button type="submit" class="flex-1 px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm">
              Simpan Kelas
            </button>
            <button type="button" id="btn-reset-kelas" class="px-3 py-2 rounded-xl bg-slate-200 text-slate-700 font-semibold text-xs">
              Reset
            </button>
          </div>
        </form>

        <div id="grid-kelas-chips" class="flex flex-wrap gap-2 pt-1"></div>
      </div>

      <!-- BAGIAN B: DATA PESERTA / SISWA -->
      <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
          <h3 class="font-bold text-sm text-slate-800">B. Daftar Peserta Ujian (<span id="count-siswa">0</span> siswa)</h3>
          <div class="flex flex-wrap gap-2">
            <select id="filter-siswa-kelas" class="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold bg-slate-50">
              <option value="">Semua Kelas</option>
            </select>
            <input type="text" id="search-siswa" placeholder="Cari nama / no peserta..."
              class="px-3 py-1.5 rounded-xl border border-slate-300 text-xs" />
          </div>
        </div>

        <form id="form-siswa" class="grid grid-cols-1 md:grid-cols-5 gap-3">
          <input type="hidden" id="siswa-id" />
          <input type="text" id="siswa-no" required placeholder="No. Peserta (2026001)"
            class="px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-mono font-bold" />
          <input type="text" id="siswa-nama" required placeholder="Nama Lengkap Siswa"
            class="px-3.5 py-2 rounded-xl border border-slate-300 text-sm" />
          <select id="siswa-kelas-id" required class="px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-semibold bg-white"></select>
          <select id="siswa-jk" class="px-3.5 py-2 rounded-xl border border-slate-300 text-sm bg-white">
            <option value="L">Laki-laki (L)</option>
            <option value="P">Perempuan (P)</option>
          </select>
          <div class="flex gap-2">
            <button type="submit" class="flex-1 px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm">
              Simpan
            </button>
            <button type="button" id="btn-reset-siswa" class="px-3 py-2 rounded-xl bg-slate-200 text-slate-700 font-semibold text-xs">
              Reset
            </button>
          </div>
        </form>

        <div class="overflow-x-auto border rounded-xl">
          <table class="w-full text-left text-sm">
            <thead class="bg-slate-50 text-xs uppercase text-slate-500 border-b">
              <tr>
                <th class="p-3">No. Peserta</th>
                <th class="p-3">Nama Lengkap</th>
                <th class="p-3">Kelas</th>
                <th class="p-3">L/P</th>
                <th class="p-3">Status</th>
                <th class="p-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody id="tbody-siswa" class="divide-y divide-slate-100"></tbody>
          </table>
        </div>
      </div>
    `;

    document.getElementById("form-kelas").addEventListener("submit", (e) => this.saveKelas(e));
    document.getElementById("btn-reset-kelas").addEventListener("click", () => {
      document.getElementById("form-kelas").reset();
      document.getElementById("kelas-id").value = "";
    });

    document.getElementById("form-siswa").addEventListener("submit", (e) => this.saveSiswa(e));
    document.getElementById("btn-reset-siswa").addEventListener("click", () => {
      document.getElementById("form-siswa").reset();
      document.getElementById("siswa-id").value = "";
    });

    document.getElementById("filter-siswa-kelas").addEventListener("change", () => this.renderSiswaTable());
    document.getElementById("search-siswa").addEventListener("input", () => this.renderSiswaTable());

    document.getElementById("btn-tmpl-siswa").addEventListener("click", () => this.downloadTemplateCSV());
    document.getElementById("file-csv-siswa").addEventListener("change", (e) => this.importCSVSiswa(e.target));
    document.getElementById("btn-export-siswa").addEventListener("click", () => this.exportCSVSiswa());
    document.getElementById("btn-cetak-kartu").addEventListener("click", () => this.cetakKartuA4());

    await this.loadAll();
  },

  async loadAll() {
    const [kRes, sRes] = await Promise.all([
      window.SB.from("kelas").select("*").order("tingkat", { ascending: true }).order("nama_kelas", { ascending: true }),
      window.SB.from("siswa").select("*, kelas(nama_kelas)").order("no_peserta", { ascending: true })
    ]);

    this.kelasList = kRes.data || [];
    this.siswaList = sRes.data || [];
    window.AdminApp.cache.kelas = this.kelasList;

    this.renderKelasUI();
    this.renderSiswaTable();
  },

  normalizeJenisKelamin(rawVal) {
    const v = String(rawVal || "")
      .trim()
      .toUpperCase()
      .replace(/[^A-Z]/g, "");
    if (!v) return "L";
    if (v === "P" || v === "PR" || v === "F" || v.startsWith("PEREMPUAN") || v.startsWith("WANITA") || v.startsWith("FEMALE")) {
      return "P";
    }
    return "L";
  },

  renderKelasUI() {
    const chips = document.getElementById("grid-kelas-chips");
    chips.innerHTML =
      this.kelasList
        .map(
          (k) => `
          <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs">
            <span class="font-extrabold text-slate-800">${CBTUtils.escapeHtml(k.nama_kelas)}</span>
            ${k.wali_kelas ? `<span class="text-slate-500">(${CBTUtils.escapeHtml(k.wali_kelas)})</span>` : ""}
            <button type="button" data-edit-k="${k.id}" class="btn-edit-k text-blue-600 font-bold hover:underline ml-1">Edit</button>
            <button type="button" data-del-k="${k.id}" class="btn-del-k text-red-600 font-bold hover:underline">&times;</button>
          </div>
        `
        )
        .join("") || '<span class="text-xs text-slate-400">Belum ada data kelas.</span>';

    chips.querySelectorAll(".btn-edit-k").forEach((b) => {
      b.onclick = () => {
        const item = this.kelasList.find((x) => x.id === b.dataset.editK);
        if (!item) return;
        document.getElementById("kelas-id").value = item.id;
        document.getElementById("kelas-nama").value = item.nama_kelas;
        document.getElementById("kelas-tingkat").value = item.tingkat || "";
        document.getElementById("kelas-wali").value = item.wali_kelas || "";
      };
    });

    chips.querySelectorAll(".btn-del-k").forEach((b) => {
      b.onclick = () => {
        CBTUtils.confirmDialog(
          "Hapus Kelas?",
          "Kelas hanya bisa dihapus jika tidak lagi memiliki siswa terdaftar.",
          async () => {
            const { error } = await window.SB.from("kelas").delete().eq("id", b.dataset.delK);
            if (error) CBTUtils.showToast("Gagal menghapus kelas: " + error.message, "error");
            else {
              CBTUtils.showToast("Kelas dihapus.", "success");
              await this.loadAll();
            }
          },
          "Hapus",
          "bg-red-600 text-white"
        );
      };
    });

    const opts = this.kelasList
      .map((k) => `<option value="${k.id}">${CBTUtils.escapeHtml(k.nama_kelas)}</option>`)
      .join("");

    document.getElementById("siswa-kelas-id").innerHTML = opts || '<option value="">-- Buat Kelas Dulu --</option>';
    const prevFilter = document.getElementById("filter-siswa-kelas").value;
    document.getElementById("filter-siswa-kelas").innerHTML =
      '<option value="">Semua Kelas</option>' + opts;
    document.getElementById("filter-siswa-kelas").value = prevFilter;
  },

  async saveKelas(e) {
    e.preventDefault();
    const id = document.getElementById("kelas-id").value;
    const payload = {
      nama_kelas: document.getElementById("kelas-nama").value.trim(),
      tingkat: document.getElementById("kelas-tingkat").value.trim() || null,
      wali_kelas: document.getElementById("kelas-wali").value.trim() || null
    };

    const res = id
      ? await window.SB.from("kelas").update(payload).eq("id", id)
      : await window.SB.from("kelas").insert(payload);

    if (res.error) CBTUtils.showToast("Gagal menyimpan kelas: " + res.error.message, "error");
    else {
      CBTUtils.showToast("Kelas berhasil disimpan!", "success");
      document.getElementById("form-kelas").reset();
      document.getElementById("kelas-id").value = "";
      await this.loadAll();
    }
  },

  getFilteredSiswa() {
    const filterKelas = document.getElementById("filter-siswa-kelas").value;
    const query = document.getElementById("search-siswa").value.trim().toLowerCase();

    return this.siswaList.filter((s) => {
      if (filterKelas && s.kelas_id !== filterKelas) return false;
      if (query) {
        const matchNo = (s.no_peserta || "").toLowerCase().includes(query);
        const matchNama = (s.nama_lengkap || "").toLowerCase().includes(query);
        if (!matchNo && !matchNama) return false;
      }
      return true;
    });
  },

  renderSiswaTable() {
    const filtered = this.getFilteredSiswa();

    document.getElementById("count-siswa").textContent = filtered.length;
    const tbody = document.getElementById("tbody-siswa");

    tbody.innerHTML =
      filtered
        .map(
          (s) => `
          <tr>
            <td class="p-3 font-mono font-bold text-slate-900">${CBTUtils.escapeHtml(s.no_peserta)}</td>
            <td class="p-3 font-semibold">${CBTUtils.escapeHtml(s.nama_lengkap)}</td>
            <td class="p-3"><span class="px-2 py-0.5 rounded bg-slate-100 text-xs font-bold">${CBTUtils.escapeHtml(s.kelas?.nama_kelas || "-")}</span></td>
            <td class="p-3 text-xs font-bold">${CBTUtils.escapeHtml(s.jenis_kelamin || "L")}</td>
            <td class="p-3">
              <span class="px-2 py-0.5 rounded-full text-xs font-bold ${s.aktif ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}">
                ${s.aktif ? "Aktif" : "Nonaktif"}
              </span>
            </td>
            <td class="p-3 text-right space-x-2">
              <button type="button" data-edit-s="${s.id}" class="btn-edit-s text-blue-600 text-xs font-bold hover:underline">Edit</button>
              <button type="button" data-toggle-s="${s.id}" data-aktif="${!s.aktif}" class="btn-toggle-s text-amber-600 text-xs font-bold hover:underline">
                ${s.aktif ? "Nonaktifkan" : "Aktifkan"}
              </button>
              <button type="button" data-del-s="${s.id}" class="btn-del-s text-red-600 text-xs font-bold hover:underline">Hapus</button>
            </td>
          </tr>
        `
        )
        .join("") || '<tr><td colspan="6" class="p-5 text-center text-slate-400">Tidak ada data siswa ditemukan.</td></tr>';

    tbody.querySelectorAll(".btn-edit-s").forEach((b) => {
      b.onclick = () => {
        const s = this.siswaList.find((x) => x.id === b.dataset.editS);
        if (!s) return;
        document.getElementById("siswa-id").value = s.id;
        document.getElementById("siswa-no").value = s.no_peserta;
        document.getElementById("siswa-nama").value = s.nama_lengkap;
        document.getElementById("siswa-kelas-id").value = s.kelas_id;
        document.getElementById("siswa-jk").value = s.jenis_kelamin || "L";
      };
    });

    tbody.querySelectorAll(".btn-toggle-s").forEach((b) => {
      b.onclick = async () => {
        const nextAktif = b.dataset.aktif === "true";
        await window.SB.from("siswa").update({ aktif: nextAktif }).eq("id", b.dataset.toggleS);
        await this.loadAll();
      };
    });

    tbody.querySelectorAll(".btn-del-s").forEach((b) => {
      b.onclick = () => {
        CBTUtils.confirmDialog(
          "Hapus Data Siswa?",
          "Data siswa beserta riwayat sesi ujiannya akan dihapus permanen.",
          async () => {
            await window.SB.from("siswa").delete().eq("id", b.dataset.delS);
            CBTUtils.showToast("Siswa dihapus.", "success");
            await this.loadAll();
          },
          "Hapus",
          "bg-red-600 text-white"
        );
      };
    });
  },

  async saveSiswa(e) {
    e.preventDefault();
    const id = document.getElementById("siswa-id").value;
    const payload = {
      no_peserta: document.getElementById("siswa-no").value.trim(),
      nama_lengkap: document.getElementById("siswa-nama").value.trim(),
      kelas_id: document.getElementById("siswa-kelas-id").value,
      jenis_kelamin: document.getElementById("siswa-jk").value,
      aktif: true
    };

    const res = id
      ? await window.SB.from("siswa").update(payload).eq("id", id)
      : await window.SB.from("siswa").insert(payload);

    if (res.error) CBTUtils.showToast("Gagal menyimpan siswa: " + res.error.message, "error");
    else {
      CBTUtils.showToast("Data siswa berhasil disimpan!", "success");
      document.getElementById("form-siswa").reset();
      document.getElementById("siswa-id").value = "";
      await this.loadAll();
    }
  },

  // Template CSV: no_peserta;nama;kelas;jenis_kelamin
  downloadTemplateCSV() {
    const csv =
      "\uFEFFno_peserta;nama;kelas;jenis_kelamin\n" +
      "2026001;Budi Santoso;XII IPA 1;L\n" +
      "2026002;Siti Aminah;XII IPA 1;P\n" +
      "2026003;Rizky Pratama;XII IPS 1;L\n";
    CBTUtils.downloadFile(csv, "template_siswa_cbt.csv");
  },

  // Ekspor CSV Data Siswa (mengikuti filter kelas/pencarian aktif)
  exportCSVSiswa() {
    const dataEkspor = this.getFilteredSiswa();
    if (dataEkspor.length === 0) {
      CBTUtils.showToast("Tidak ada data siswa untuk diekspor.", "warning");
      return;
    }

    const escapeCsv = (val) => {
      const s = String(val ?? "");
      return s.includes(";") || s.includes('"') || s.includes("\n")
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    };

    const rows = dataEkspor.map((s) =>
      [
        escapeCsv(s.no_peserta),
        escapeCsv(s.nama_lengkap),
        escapeCsv(s.kelas?.nama_kelas || ""),
        escapeCsv(s.jenis_kelamin || "L")
      ].join(";")
    );

    const csv = "\uFEFFno_peserta;nama;kelas;jenis_kelamin\n" + rows.join("\n") + "\n";
    CBTUtils.downloadFile(csv, `data_siswa_cbt_${new Date().toISOString().slice(0, 10)}.csv`);
    CBTUtils.showToast(`Berhasil mengekspor ${dataEkspor.length} data siswa.`, "success");
  },

  // Impor CSV Siswa (mendukung kolom jenis_kelamin L/P & otomatis membuat kelas baru)
  importCSVSiswa(inputEl) {
    const file = inputEl.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target.result.replace(/^\uFEFF/, "");
        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (lines.length < 2) {
          CBTUtils.showToast("File CSV kosong atau hanya berisi header.", "warning");
          return;
        }

        const delimiter = lines[0].includes(";") ? ";" : ",";
        const parsedRows = [];
        const uniqueKelasNames = new Set();

        for (let i = 1; i < lines.length; i++) {
          const cols = CBTUtils.parseCSVLine(lines[i], delimiter);
          if (cols.length >= 3 && cols[0] && cols[1] && cols[2]) {
            parsedRows.push({
              no_peserta: cols[0].trim(),
              nama: cols[1].trim(),
              kelas: cols[2].trim(),
              jenis_kelamin: this.normalizeJenisKelamin(cols[3])
            });
            uniqueKelasNames.add(cols[2].trim());
          }
        }

        if (parsedRows.length === 0) {
          CBTUtils.showToast("Tidak ada baris valid (format: no_peserta;nama;kelas;jenis_kelamin).", "error");
          return;
        }

        CBTUtils.showToast("Memproses kelas & mengimpor siswa...", "info");

        // 1. Pastikan semua nama kelas ada di tabel kelas
        const existingMap = {};
        this.kelasList.forEach((k) => {
          existingMap[k.nama_kelas.toLowerCase()] = k.id;
        });

        const missingKelas = Array.from(uniqueKelasNames).filter(
          (name) => !existingMap[name.toLowerCase()]
        );

        if (missingKelas.length > 0) {
          const toInsertKelas = missingKelas.map((name) => ({
            nama_kelas: name,
            tingkat: name.split(" ")[0] || null
          }));
          const { data: insertedKelas, error: errInsK } = await window.SB
            .from("kelas")
            .upsert(toInsertKelas, { onConflict: "nama_kelas" })
            .select("id, nama_kelas");

          if (errInsK) throw errInsK;
          (insertedKelas || []).forEach((k) => {
            existingMap[k.nama_kelas.toLowerCase()] = k.id;
          });
        }

        // 2. Upsert data siswa berdasarkan no_peserta termasuk jenis_kelamin
        const siswaPayload = parsedRows.map((r) => ({
          no_peserta: r.no_peserta,
          nama_lengkap: r.nama,
          kelas_id: existingMap[r.kelas.toLowerCase()],
          jenis_kelamin: r.jenis_kelamin,
          aktif: true
        }));

        const { error: errUpsert } = await window.SB
          .from("siswa")
          .upsert(siswaPayload, { onConflict: "no_peserta" });

        if (errUpsert) throw errUpsert;

        CBTUtils.showToast(`Berhasil mengimpor ${siswaPayload.length} siswa (beserta L/P)!`, "success");
        inputEl.value = "";
        await this.loadAll();
      } catch (err) {
        CBTUtils.showToast("Gagal impor CSV siswa: " + err.message, "error");
        inputEl.value = "";
      }
    };
    reader.readAsText(file, "UTF-8");
  },

  cetakKartuA4() {
    const filterKelas = document.getElementById("filter-siswa-kelas").value;
    const targetSiswa = this.siswaList.filter((s) => s.aktif && (!filterKelas || s.kelas_id === filterKelas));

    if (targetSiswa.length === 0) {
      CBTUtils.showToast("Tidak ada siswa aktif untuk dicetak.", "warning");
      return;
    }

    const sek = window.AdminApp.cache.sekolah || {};
    const webUrl = window.location.href.replace(/admin(_\d+)?\.html.*$/i, "index.html");
    const area = document.getElementById("print-kartu-area");

    area.innerHTML = `
      <div class="kartu-grid grid grid-cols-2 gap-4">
        ${targetSiswa
          .map(
            (s) => `
            <div class="kartu-item border-2 border-slate-900 p-4 rounded-lg text-xs">
              <div class="flex items-center justify-between gap-2 border-b-2 border-slate-900 pb-2 mb-2.5">
                <div class="flex items-center gap-2">
                  ${sek.logo_sekolah_url ? `<img src="${sek.logo_sekolah_url}" class="h-10 w-10 object-contain" />` : ""}
                  <div>
                    <div class="font-extrabold uppercase text-xs leading-tight">${CBTUtils.escapeHtml(sek.nama_sekolah || "KARTU PESERTA UJIAN")}</div>
                    <div class="text-[10px] text-slate-700">Kartu Peserta CBT &bull; TP ${CBTUtils.escapeHtml(sek.tahun_pelajaran || "-")}</div>
                  </div>
                </div>
                ${sek.logo_dinas_url ? `<img src="${sek.logo_dinas_url}" class="h-9 w-9 object-contain" />` : ""}
              </div>
              <table class="w-full text-xs">
                <tr><td class="w-28 py-0.5 text-slate-600">Nomor Peserta</td><td class="font-mono font-extrabold text-sm">: ${CBTUtils.escapeHtml(s.no_peserta)}</td></tr>
                <tr><td class="py-0.5 text-slate-600">Nama Peserta</td><td class="font-bold uppercase">: ${CBTUtils.escapeHtml(s.nama_lengkap)}</td></tr>
                <tr><td class="py-0.5 text-slate-600">Kelas</td><td class="font-semibold">: ${CBTUtils.escapeHtml(s.kelas?.nama_kelas || "-")}</td></tr>
                <tr><td class="py-0.5 text-slate-600">Laman Ujian</td><td class="text-[10px] font-mono">: ${CBTUtils.escapeHtml(webUrl)}</td></tr>
              </table>
              <div class="mt-3 flex justify-end text-[10px]">
                <div class="text-center">
                  <div>${CBTUtils.escapeHtml(sek.kota_kabupaten || "Panitia Ujian")},</div>
                  <div>Ketua Panitia Ujian</div>
                  <div class="mt-7 font-bold underline">${CBTUtils.escapeHtml(sek.ketua_panitia || "______________________")}</div>
                </div>
              </div>
            </div>
          `
          )
          .join("")}
      </div>
    `;

    window.print();
  }
};
