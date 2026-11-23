// ============================================================================
// MENU 6: KELOLA PAKET UJIAN (TOKEN, JADWAL, ASSIGN KELAS & PILIH BUTIR SOAL)
// ============================================================================

window.AdminKelolaUjian = {
  paketList: [],
  soalBankMapel: [],
  selectedSoalIds: new Set(),

  async mount() {
    const container = document.getElementById("tab-ujian");
    const mapelList = window.AdminApp.cache.mapel || [];
    const kelasList = window.AdminApp.cache.kelas || [];

    container.innerHTML = `
      <div>
        <h2 class="text-xl font-extrabold text-slate-900">Kelola Paket &amp; Jadwal Ujian</h2>
        <p class="text-xs text-slate-500">Atur mata pelajaran ujian, token, jadwal buka/deadline, kelas peserta, dan pilih butir soal yang diujikan.</p>
      </div>

      <form id="form-paket" class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <input type="hidden" id="paket-id" />

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-xs font-bold text-slate-600 mb-1">Mata Pelajaran</label>
            <select id="paket-mapel-id" required class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold bg-white">
              ${
                mapelList.length > 0
                  ? mapelList.map((m) => `<option value="${m.id}">${CBTUtils.escapeHtml(m.nama_mapel)}</option>`).join("")
                  : '<option value="">-- Tambah Mapel Dulu --</option>'
              }
            </select>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-600 mb-1">Jenis / Kategori Ujian</label>
            <input type="text" id="paket-jenis" list="list-jenis-ujian" required placeholder="Asesmen Sumatif Akhir Semester"
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold bg-blue-50/40" />
            <datalist id="list-jenis-ujian">
              <option value="Asesmen Sumatif Akhir Semester (ASAS)"></option>
              <option value="Asesmen Sumatif Tengah Semester (ASTS)"></option>
              <option value="Ulangan Harian"></option>
              <option value="Try Out Ujian Sekolah"></option>
              <option value="Remedial / Susulan"></option>
            </datalist>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-600 mb-1">Judul Paket Ujian</label>
            <input type="text" id="paket-judul" required placeholder="Contoh: Paket Utama Kelas XII"
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm" />
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-600 mb-1">Token Ujian (6 Karakter)</label>
            <div class="flex gap-1.5">
              <input type="text" id="paket-token" required maxlength="12"
                class="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-mono font-extrabold uppercase tracking-wider" />
              <button type="button" id="btn-gen-token" class="px-3.5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-xs font-bold">
                Acak
              </button>
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-600 mb-1">Durasi Pengerjaan (Menit)</label>
            <input type="number" id="paket-durasi" required value="60" min="1"
              class="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-semibold" />
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-600 mb-1">Batas Toleransi Pelanggaran</label>
            <input type="number" id="paket-batas" required value="3" min="1" max="20"
              class="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm" />
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-600 mb-1">Waktu Buka Jadwal (Opsional)</label>
            <input type="datetime-local" id="paket-waktu-buka"
              class="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm" />
          </div>

          <div>
            <label class="block text-xs font-bold text-red-700 mb-1">Batas Akhir Pengerjaan / Deadline (Opsional)</label>
            <input type="datetime-local" id="paket-deadline"
              class="w-full px-3.5 py-2 rounded-xl border border-red-200 bg-red-50/30 text-sm" />
          </div>

          <div class="flex flex-col justify-center space-y-1.5">
            <label class="flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <input type="checkbox" id="paket-acak-soal" checked class="accent-blue-600" /> Acak Urutan Soal
            </label>
            <label class="flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <input type="checkbox" id="paket-acak-opsi" checked class="accent-blue-600" /> Acak Isi Opsi (Huruf A-E Tetap Urut)
            </label>
            <label class="flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <input type="checkbox" id="paket-tampil-nilai" class="accent-indigo-600" /> Tampilkan Skor PG Setelah Selesai
            </label>
            <label class="flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <input type="checkbox" id="paket-aktif" checked class="accent-emerald-600" /> Status Aktif (Bisa Diakses Siswa)
            </label>
          </div>
        </div>

        <!-- Assign Kelas Peserta (Multi-Checkbox) -->
        <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-extrabold uppercase text-slate-700">Assign Kelas Peserta Ujian:</span>
            <button type="button" id="btn-pilih-semua-kelas" class="text-xs text-blue-700 font-bold hover:underline">
              Pilih / Batal Semua Kelas
            </button>
          </div>
          <div id="box-checkbox-kelas" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 pt-1">
            ${
              kelasList.length > 0
                ? kelasList
                    .map(
                      (k) => `
                      <label class="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 text-xs font-bold cursor-pointer hover:border-blue-400">
                        <input type="checkbox" name="paket_kelas_ids" value="${k.id}" data-tingkat="${CBTUtils.escapeHtml(k.tingkat || "")}" class="accent-blue-700" />
                        <span class="truncate">${CBTUtils.escapeHtml(k.nama_kelas)}</span>
                      </label>
                    `
                    )
                    .join("")
                : '<span class="text-xs text-slate-400 col-span-full">Belum ada data kelas. Tambahkan kelas di menu Kelas &amp; Siswa terlebih dahulu.</span>'
            }
          </div>
        </div>

        <!-- Pilih Butir Soal yang Diujikan -->
        <div class="p-4 rounded-xl bg-indigo-50/50 border border-indigo-200 space-y-3">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span class="text-xs font-extrabold uppercase text-indigo-950">Pilih Butir Soal untuk Paket Ujian Ini:</span>
              <div id="info-soal-terpilih" class="text-xs font-bold text-indigo-700 mt-0.5">
                Terpilih: 0 dari 0 soal &bull; Total Bobot: 0
              </div>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <select id="filter-soal-paket-tingkat" class="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-bold">
                <option value="">Semua Tingkat Kelas</option>
              </select>
              <input type="text" id="search-soal-paket" placeholder="Cari soal..."
                class="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs" />
              <button type="button" id="btn-pilih-semua-soal" class="px-3 py-1.5 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold">
                Pilih Semua (Tampil)
              </button>
              <button type="button" id="btn-batal-semua-soal" class="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold">
                Kosongkan
              </button>
            </div>
          </div>

          <div id="box-checklist-soal" class="max-h-80 overflow-y-auto bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
            <p class="p-4 text-xs text-slate-400 text-center">Memuat daftar butir soal...</p>
          </div>
        </div>

        <div class="flex gap-2 pt-1">
          <button type="submit" id="btn-save-paket" class="px-6 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm shadow">
            Simpan Paket Ujian
          </button>
          <button type="button" id="btn-reset-paket" class="px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-sm">
            Batal / Paket Baru
          </button>
        </div>
      </form>

      <!-- Tabel Daftar Paket Ujian -->
      <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-slate-50 text-xs uppercase text-slate-500 border-b">
              <tr>
                <th class="p-3.5">Mapel &amp; Paket Ujian</th>
                <th class="p-3.5">Token</th>
                <th class="p-3.5">Kelas &amp; Soal</th>
                <th class="p-3.5">Durasi &amp; Jadwal</th>
                <th class="p-3.5">Status</th>
                <th class="p-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody id="tbody-paket" class="divide-y divide-slate-100"></tbody>
          </table>
        </div>
      </div>
    `;

    document.getElementById("paket-token").value = CBTUtils.generateToken(6);
    document.getElementById("btn-gen-token").addEventListener("click", () => {
      document.getElementById("paket-token").value = CBTUtils.generateToken(6);
    });
    document.getElementById("btn-reset-paket").addEventListener("click", () => this.resetForm());
    document.getElementById("btn-pilih-semua-kelas").addEventListener("click", () => {
      const boxes = Array.from(document.querySelectorAll('input[name="paket_kelas_ids"]'));
      const allChecked = boxes.every((b) => b.checked);
      boxes.forEach((b) => (b.checked = !allChecked));
    });

    document.getElementById("paket-mapel-id").addEventListener("change", async () => {
      this.selectedSoalIds.clear();
      await this.loadSoalForSelectedMapel();
    });
    document.getElementById("filter-soal-paket-tingkat").addEventListener("change", () => this.renderSoalChecklist());
    document.getElementById("search-soal-paket").addEventListener("input", () => this.renderSoalChecklist());

    document.getElementById("btn-pilih-semua-soal").addEventListener("click", () => {
      const visibleIds = this.getFilteredSoalBank().map((s) => s.id);
      visibleIds.forEach((id) => this.selectedSoalIds.add(id));
      this.renderSoalChecklist();
    });
    document.getElementById("btn-batal-semua-soal").addEventListener("click", () => {
      this.selectedSoalIds.clear();
      this.renderSoalChecklist();
    });

    document.getElementById("form-paket").addEventListener("submit", (e) => this.handleSave(e));

    await Promise.all([this.loadData(), this.loadSoalForSelectedMapel()]);
  },

  async resetForm() {
    document.getElementById("form-paket").reset();
    document.getElementById("paket-id").value = "";
    document.getElementById("paket-token").value = CBTUtils.generateToken(6);
    document.querySelectorAll('input[name="paket_kelas_ids"]').forEach((cb) => (cb.checked = false));
    this.selectedSoalIds.clear();
    await this.loadSoalForSelectedMapel();
  },

  async loadSoalForSelectedMapel() {
    const mapelId = document.getElementById("paket-mapel-id")?.value;
    const box = document.getElementById("box-checklist-soal");
    if (!mapelId || !box) {
      this.soalBankMapel = [];
      this.updateSoalCounter();
      return;
    }

    box.innerHTML = '<p class="p-4 text-xs text-slate-400 text-center">Memuat soal dari bank soal...</p>';

    const { data, error } = await window.SB
      .from("bank_soal")
      .select("id, tipe_soal, tingkat_kelas, pertanyaan, kunci_jawaban, bobot_skor")
      .eq("mapel_id", mapelId)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true });

    if (error) {
      box.innerHTML = `<p class="p-4 text-xs text-red-600 text-center">Gagal memuat soal: ${CBTUtils.escapeHtml(error.message)}</p>`;
      return;
    }

    this.soalBankMapel = data || [];

    const tingkatSelect = document.getElementById("filter-soal-paket-tingkat");
    const distinctTingkat = [...new Set(this.soalBankMapel.map((s) => s.tingkat_kelas).filter(Boolean))].sort();
    tingkatSelect.innerHTML =
      '<option value="">Semua Tingkat Kelas</option>' +
      distinctTingkat.map((t) => `<option value="${CBTUtils.escapeHtml(t)}">Kelas ${CBTUtils.escapeHtml(t)}</option>`).join("");

    this.renderSoalChecklist();
  },

  getFilteredSoalBank() {
    const filterTingkat = document.getElementById("filter-soal-paket-tingkat")?.value || "";
    const query = (document.getElementById("search-soal-paket")?.value || "").trim().toLowerCase();

    return this.soalBankMapel
      .map((s, idx) => ({ ...s, _noUrut: idx + 1 }))
      .filter((s) => {
        if (filterTingkat && (s.tingkat_kelas || "") !== filterTingkat) return false;
        if (query && !(s.pertanyaan || "").toLowerCase().includes(query)) return false;
        return true;
      });
  },

  updateSoalCounter() {
    const infoEl = document.getElementById("info-soal-terpilih");
    if (!infoEl) return;
    let totalBobot = 0;
    this.soalBankMapel.forEach((s) => {
      if (this.selectedSoalIds.has(s.id)) {
        totalBobot += Number(s.bobot_skor || 1);
      }
    });
    infoEl.textContent = `Terpilih: ${this.selectedSoalIds.size} dari ${this.soalBankMapel.length} soal • Total Bobot: ${totalBobot}`;
  },

  renderSoalChecklist() {
    const box = document.getElementById("box-checklist-soal");
    if (!box) return;

    const list = this.getFilteredSoalBank();
    this.updateSoalCounter();

    if (list.length === 0) {
      box.innerHTML =
        '<p class="p-4 text-xs text-slate-400 text-center">Tidak ada butir soal pada mata pelajaran / filter tingkat kelas ini.</p>';
      return;
    }

    box.innerHTML = list
      .map((s) => {
        const checked = this.selectedSoalIds.has(s.id) ? "checked" : "";
        let kunciRingkas = "";
        if (s.tipe_soal === "pg") kunciRingkas = s.kunci_jawaban?.jawaban || "";
        else if (s.tipe_soal === "pgk_mcma" && Array.isArray(s.kunci_jawaban?.jawaban)) {
          kunciRingkas = s.kunci_jawaban.jawaban.join(",");
        }

        return `
          <label class="flex items-start gap-3 p-3 cursor-pointer hover:bg-indigo-50/40 transition ${
            checked ? "bg-indigo-50/30" : ""
          }">
            <input type="checkbox" value="${s.id}" ${checked} class="cb-pilih-soal mt-1 w-4 h-4 accent-indigo-700 shrink-0" />
            <div class="min-w-0 flex-1 space-y-1">
              <div class="flex flex-wrap items-center gap-1.5">
                <span class="px-2 py-0.5 rounded bg-slate-800 text-white text-[11px] font-bold">#${s._noUrut}</span>
                <span class="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[11px] font-bold">${CBTUtils.escapeHtml(s.tipe_soal)}</span>
                ${
                  s.tingkat_kelas
                    ? `<span class="px-2 py-0.5 rounded bg-purple-100 text-purple-800 text-[11px] font-bold">Kelas ${CBTUtils.escapeHtml(s.tingkat_kelas)}</span>`
                    : ""
                }
                <span class="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 text-[11px] font-bold">Bobot: ${s.bobot_skor}</span>
                ${
                  kunciRingkas
                    ? `<span class="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-300 text-emerald-800 text-[11px] font-bold">Kunci: ${CBTUtils.escapeHtml(kunciRingkas)}</span>`
                    : ""
                }
              </div>
              <div class="text-xs text-slate-800 line-clamp-2">${CBTUtils.escapeHtml(s.pertanyaan)}</div>
            </div>
          </label>
        `;
      })
      .join("");

    box.querySelectorAll(".cb-pilih-soal").forEach((cb) => {
      cb.addEventListener("change", () => {
        if (cb.checked) this.selectedSoalIds.add(cb.value);
        else this.selectedSoalIds.delete(cb.value);
        this.updateSoalCounter();
      });
    });
  },

  async loadData() {
    const { data, error } = await window.SB
      .from("paket_ujian")
      .select("*, mapel(nama_mapel, kode_mapel), paket_kelas(kelas_id, kelas(nama_kelas))")
      .order("created_at", { ascending: false });

    if (error) {
      CBTUtils.showToast("Gagal memuat daftar paket ujian: " + error.message, "error");
      return;
    }

    this.paketList = data || [];
    window.AdminApp.cache.paket = this.paketList;

    const tbody = document.getElementById("tbody-paket");
    tbody.innerHTML =
      this.paketList
        .map((p) => {
          const kelasBadges = (p.paket_kelas || [])
            .map((pk) => pk.kelas?.nama_kelas)
            .filter(Boolean)
            .map((nm) => `<span class="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-bold">${CBTUtils.escapeHtml(nm)}</span>`)
            .join(" ");

          const jmlSoalTerpilih = Array.isArray(p.soal_ids) && p.soal_ids.length > 0 ? p.soal_ids.length : 0;

          return `
            <tr>
              <td class="p-3.5">
                <span class="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[11px] font-bold">${CBTUtils.escapeHtml(p.jenis_ujian || "Ujian")}</span>
                <div class="font-extrabold text-slate-900 mt-0.5">${CBTUtils.escapeHtml(p.mapel?.nama_mapel || "-")}</div>
                <div class="text-xs text-slate-500">${CBTUtils.escapeHtml(p.judul_ujian)}</div>
              </td>
              <td class="p-3.5">
                <button type="button" data-copy-token="${CBTUtils.escapeHtml(p.token_plain)}" title="Klik untuk menyalin token"
                  class="btn-copy-token px-2.5 py-1 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-900 font-mono font-extrabold text-sm tracking-wider">
                  ${CBTUtils.escapeHtml(p.token_plain)}
                </button>
              </td>
              <td class="p-3.5 max-w-xs space-y-1.5">
                <div class="flex flex-wrap gap-1">${kelasBadges || '<span class="text-xs text-red-500 font-semibold">Belum ada kelas</span>'}</div>
                <div>
                  <span class="inline-block px-2 py-0.5 rounded bg-indigo-100 text-indigo-900 text-[11px] font-extrabold">
                    ${jmlSoalTerpilih > 0 ? `${jmlSoalTerpilih} Butir Soal Terpilih` : "Semua Soal Mapel"}
                  </span>
                </div>
              </td>
              <td class="p-3.5 text-xs space-y-0.5">
                <div>Durasi: <strong>${p.durasi_menit} menit</strong></div>
                <div class="text-slate-500">Buka: ${p.waktu_buka ? CBTUtils.formatWaktuIndo(p.waktu_buka) : "Langsung"}</div>
                <div class="text-red-700 font-semibold">Deadline: ${p.batas_akhir_pengerjaan ? CBTUtils.formatWaktuIndo(p.batas_akhir_pengerjaan) : "-"}</div>
              </td>
              <td class="p-3.5 space-y-1">
                <div>
                  <span class="px-2 py-0.5 rounded-full text-xs font-bold ${p.status_aktif ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}">
                    ${p.status_aktif ? "Aktif" : "Nonaktif"}
                  </span>
                </div>
                ${p.tampilkan_nilai ? '<div class="text-[11px] text-indigo-600 font-semibold">Tampil Skor PG</div>' : ""}
              </td>
              <td class="p-3.5 text-right space-x-2">
                <button type="button" data-edit-paket="${p.id}" class="btn-edit-paket text-blue-600 font-bold text-xs hover:underline">Edit</button>
                <button type="button" data-del-paket="${p.id}" class="btn-del-paket text-red-600 font-bold text-xs hover:underline">Hapus</button>
              </td>
            </tr>
          `;
        })
        .join("") || '<tr><td colspan="6" class="p-5 text-center text-slate-400">Belum ada paket ujian dibuat.</td></tr>';

    tbody.querySelectorAll(".btn-copy-token").forEach((btn) => {
      btn.onclick = () => {
        navigator.clipboard?.writeText(btn.dataset.copyToken);
        CBTUtils.showToast(`Token ${btn.dataset.copyToken} disalin!`, "success");
      };
    });

    tbody.querySelectorAll(".btn-edit-paket").forEach((btn) => {
      btn.onclick = async () => {
        const p = this.paketList.find((x) => x.id === btn.dataset.editPaket);
        if (!p) return;
        document.getElementById("paket-id").value = p.id;
        document.getElementById("paket-mapel-id").value = p.mapel_id;
        document.getElementById("paket-jenis").value = p.jenis_ujian || "";
        document.getElementById("paket-judul").value = p.judul_ujian;
        document.getElementById("paket-token").value = p.token_plain;
        document.getElementById("paket-durasi").value = p.durasi_menit;
        document.getElementById("paket-batas").value = p.batas_pelanggaran;
        document.getElementById("paket-waktu-buka").value = CBTUtils.toLocalDatetimeInput(p.waktu_buka);
        document.getElementById("paket-deadline").value = CBTUtils.toLocalDatetimeInput(p.batas_akhir_pengerjaan);
        document.getElementById("paket-acak-soal").checked = p.acak_soal;
        document.getElementById("paket-acak-opsi").checked = p.acak_opsi;
        document.getElementById("paket-tampil-nilai").checked = p.tampilkan_nilai;
        document.getElementById("paket-aktif").checked = p.status_aktif;

        const assignedIds = new Set((p.paket_kelas || []).map((pk) => pk.kelas_id));
        document.querySelectorAll('input[name="paket_kelas_ids"]').forEach((cb) => {
          cb.checked = assignedIds.has(cb.value);
        });

        this.selectedSoalIds = new Set(Array.isArray(p.soal_ids) ? p.soal_ids : []);
        await this.loadSoalForSelectedMapel();

        window.scrollTo({ top: 0, behavior: "smooth" });
      };
    });

    tbody.querySelectorAll(".btn-del-paket").forEach((btn) => {
      btn.onclick = () => {
        CBTUtils.confirmDialog(
          "Hapus Paket Ujian?",
          "Paket ujian beserta seluruh data sesi dan nilai siswa pada paket ini akan dihapus.",
          async () => {
            await window.SB.from("paket_ujian").delete().eq("id", btn.dataset.delPaket);
            CBTUtils.showToast("Paket ujian dihapus.", "success");
            await this.loadData();
          },
          "Ya, Hapus",
          "bg-red-600 text-white"
        );
      };
    });
  },

  async handleSave(e) {
    e.preventDefault();
    const id = document.getElementById("paket-id").value;
    const mapelId = document.getElementById("paket-mapel-id").value;
    if (!mapelId) {
      CBTUtils.showToast("Pilih mata pelajaran terlebih dahulu.", "warning");
      return;
    }

    const selectedKelas = Array.from(document.querySelectorAll('input[name="paket_kelas_ids"]:checked')).map(
      (cb) => cb.value
    );
    if (selectedKelas.length === 0) {
      CBTUtils.showToast("Pilih minimal satu kelas peserta ujian!", "warning");
      return;
    }

    if (this.soalBankMapel.length > 0 && this.selectedSoalIds.size === 0) {
      CBTUtils.showToast("Pilih minimal satu butir soal untuk paket ujian ini!", "warning");
      return;
    }

    // Simpan ID soal sesuai urutan tampil di bank soal
    const orderedSelectedIds = this.soalBankMapel
      .filter((s) => this.selectedSoalIds.has(s.id))
      .map((s) => s.id);

    const tokenPlain = document.getElementById("paket-token").value.trim().toUpperCase();
    const tokenHash = await CBTUtils.sha256Hex(tokenPlain);
    const bukaRaw = document.getElementById("paket-waktu-buka").value;
    const deadlineRaw = document.getElementById("paket-deadline").value;

    const payload = {
      mapel_id: mapelId,
      jenis_ujian: document.getElementById("paket-jenis").value.trim(),
      judul_ujian: document.getElementById("paket-judul").value.trim(),
      token_plain: tokenPlain,
      token_hash: tokenHash,
      durasi_menit: parseInt(document.getElementById("paket-durasi").value, 10) || 60,
      batas_pelanggaran: parseInt(document.getElementById("paket-batas").value, 10) || 3,
      waktu_buka: bukaRaw ? new Date(bukaRaw).toISOString() : null,
      batas_akhir_pengerjaan: deadlineRaw ? new Date(deadlineRaw).toISOString() : null,
      acak_soal: document.getElementById("paket-acak-soal").checked,
      acak_opsi: document.getElementById("paket-acak-opsi").checked,
      tampilkan_nilai: document.getElementById("paket-tampil-nilai").checked,
      status_aktif: document.getElementById("paket-aktif").checked,
      soal_ids: orderedSelectedIds
    };

    let paketId = id;
    if (id) {
      const { error } = await window.SB.from("paket_ujian").update(payload).eq("id", id);
      if (error) {
        CBTUtils.showToast("Gagal memperbarui paket: " + error.message, "error");
        return;
      }
    } else {
      const { data: insData, error } = await window.SB.from("paket_ujian").insert(payload).select("id").single();
      if (error) {
        CBTUtils.showToast("Gagal membuat paket: " + error.message, "error");
        return;
      }
      paketId = insData.id;
    }

    await window.SB.from("paket_kelas").delete().eq("paket_id", paketId);
    const junctionRows = selectedKelas.map((kelasId) => ({
      paket_id: paketId,
      kelas_id: kelasId
    }));
    const { error: errJunc } = await window.SB.from("paket_kelas").insert(junctionRows);

    if (errJunc) {
      CBTUtils.showToast("Paket tersimpan, namun gagal menyimpan kelas: " + errJunc.message, "error");
    } else {
      CBTUtils.showToast("Paket ujian, kelas & daftar soal berhasil disimpan!", "success");
      await this.resetForm();
      await this.loadData();
    }
  }
};