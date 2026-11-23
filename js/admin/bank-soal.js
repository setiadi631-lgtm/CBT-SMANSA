// ============================================================================
// MENU 4: BANK SOAL, STIMULUS, 7 TIPE SOAL, EDIT SOAL & IMPOR/EKSPOR CSV
// ============================================================================

window.AdminBankSoal = {
  soalList: [],
  stimulusList: [],
  parsedImport: [],

  async mount() {
    const container = document.getElementById("tab-soal");
    const mapelList = window.AdminApp.cache.mapel || [];
    const paketList = window.AdminApp.cache.paket || [];
    const kelasList = window.AdminApp.cache.kelas || [];

    const tingkatSet = new Set(["X", "XI", "XII", "VII", "VIII", "IX"]);
    kelasList.forEach((k) => {
      if (k.tingkat) tingkatSet.add(String(k.tingkat).trim());
    });
    const datalistTingkatHtml = Array.from(tingkatSet)
      .map((t) => `<option value="${CBTUtils.escapeHtml(t)}"></option>`)
      .join("");

    container.innerHTML = `
      <datalist id="datalist-tingkat-soal">${datalistTingkatHtml}</datalist>

      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-xl font-extrabold text-slate-900">Bank Soal &amp; Stimulus Wacana</h2>
          <p class="text-xs text-slate-500">Nomor soal diurutkan otomatis sesuai tampilan. Kelola stimulus, tingkat kelas, edit soal, dan impor CSV.</p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <select id="filter-paket-jump" class="px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-xs font-semibold">
            <option value="">-- Filter Cepat via Paket Ujian --</option>
            ${paketList
              .map(
                (p) =>
                  `<option value="${p.mapel_id}">Paket: ${CBTUtils.escapeHtml(p.judul_ujian)} (${CBTUtils.escapeHtml(p.mapel?.nama_mapel || "")})</option>`
              )
              .join("")}
          </select>
          <select id="filter-mapel-soal" class="px-3.5 py-2 rounded-xl border-2 border-blue-600 bg-white text-sm font-bold text-slate-900">
            ${
              mapelList.length > 0
                ? mapelList
                    .map(
                      (m) =>
                        `<option value="${m.id}">${CBTUtils.escapeHtml(m.nama_mapel)} (${CBTUtils.escapeHtml(m.kode_mapel || "")})</option>`
                    )
                    .join("")
                : '<option value="">-- Buat Mata Pelajaran Dulu --</option>'
            }
          </select>
        </div>
      </div>

      <!-- PANEL IMPOR & EKSPOR CSV BANK SOAL -->
      <div class="bg-white p-5 rounded-2xl border border-indigo-200 shadow-sm space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 class="font-extrabold text-sm text-indigo-900">Impor &amp; Ekspor Bank Soal Massal (CSV Semicolon)</h3>
            <p class="text-xs text-slate-500">Format: tingkat_kelas;tipe_soal;pertanyaan;opsi_a;opsi_b;opsi_c;opsi_d;opsi_e;kunci_jawaban;bobot_skor;pembahasan</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <button type="button" id="btn-tmpl-soal" class="px-3.5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold">
              Unduh Template CSV
            </button>
            <label class="px-3.5 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold cursor-pointer">
              Impor CSV Soal
              <input type="file" id="file-csv-soal" accept=".csv,.txt" class="hidden" />
            </label>
            <button type="button" id="btn-ekspor-soal" class="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold">
              Ekspor CSV Soal
            </button>
          </div>
        </div>

        <!-- Pratinjau Impor CSV Sebelum Simpan -->
        <div id="preview-impor-box" class="hidden border-t pt-4 space-y-3">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <span class="text-xs font-bold text-indigo-800">
              Pratinjau Impor Soal (<span id="jumlah-preview-soal">0</span> butir siap disimpan ke mata pelajaran terpilih):
            </span>
            <div class="flex gap-2">
              <button type="button" id="btn-batal-impor" class="px-3 py-1.5 rounded-lg bg-slate-200 text-xs font-bold">Batal</button>
              <button type="button" id="btn-simpan-impor" class="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow">
                Simpan Semua ke Bank Soal
              </button>
            </div>
          </div>
          <div class="max-h-60 overflow-y-auto border rounded-xl">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-100 font-bold text-slate-600 border-b">
                <tr>
                  <th class="p-2">No</th>
                  <th class="p-2">Kelas</th>
                  <th class="p-2">Tipe</th>
                  <th class="p-2">Pertanyaan</th>
                  <th class="p-2">Kunci</th>
                  <th class="p-2">Bobot</th>
                </tr>
              </thead>
              <tbody id="tbody-preview-impor" class="divide-y"></tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- PANEL A: STIMULUS -->
      <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 class="font-bold text-sm text-blue-900 border-b pb-2">A. Tambah Stimulus Wacana / Gambar (Opsional)</h3>
        <form id="form-stimulus" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold text-slate-600 mb-1">Judul Stimulus</label>
            <input type="text" id="stim-judul" required placeholder="Contoh: Wacana 1 — Perubahan Iklim"
              class="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm" />
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-600 mb-1">Gambar / Grafik Stimulus (Opsional)</label>
            <input type="file" id="file-stim-img" accept="image/*" class="text-xs w-full" />
            <input type="hidden" id="stim-gambar-url" />
            <img id="stim-preview" alt="Preview Stimulus" class="hidden h-20 mt-2 rounded border" />
          </div>
          <div class="md:col-span-2">
            <label class="block text-xs font-bold text-slate-600 mb-1">Konten Teks Wacana</label>
            <textarea id="stim-teks" rows="3" placeholder="Tuliskan teks bacaan stimulus di sini..."
              class="w-full p-3 rounded-xl border border-slate-300 text-sm"></textarea>
          </div>
          <div>
            <button type="submit" class="px-4 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold">
              Simpan Stimulus
            </button>
          </div>
        </form>
      </div>

      <!-- PANEL B: TAMBAH SOAL MANUAL (7 TIPE) -->
      <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 class="font-bold text-sm text-blue-900 border-b pb-2">B. Tambah Butir Soal Manual (7 Tipe Soal)</h3>
        <form id="form-soal" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label class="block text-xs font-bold text-slate-600 mb-1">Tipe Soal</label>
              <select id="soal-tipe" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-semibold bg-blue-50">
                <option value="pg">1. Pilihan Ganda (pg)</option>
                <option value="pgk_mcma">2. PGK Multi-Jawaban (pgk_mcma)</option>
                <option value="pgk_kategori_bs">3. PGK Benar/Salah (pgk_kategori_bs)</option>
                <option value="pgk_kategori_sesuai">4. PGK Sesuai/Tidak (pgk_kategori_sesuai)</option>
                <option value="menjodohkan">5. Menjodohkan (menjodohkan)</option>
                <option value="isian_singkat">6. Isian Singkat (isian_singkat)</option>
                <option value="uraian">7. Uraian (uraian)</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-600 mb-1">Tingkat Kelas (Opsional)</label>
              <input type="text" id="soal-tingkat" list="datalist-tingkat-soal" placeholder="Cth: X, XI, XII"
                class="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-semibold" />
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-600 mb-1">Stimulus (Opsional)</label>
              <select id="soal-stimulus-id" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm">
                <option value="">-- Tanpa Stimulus --</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-600 mb-1">Bobot Skor</label>
              <input type="number" id="soal-bobot" value="1" step="0.5" min="0.5" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold" />
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="md:col-span-2">
              <label class="block text-xs font-bold text-slate-600 mb-1">Pertanyaan</label>
              <textarea id="soal-pertanyaan" rows="3" required placeholder="Tuliskan teks pertanyaan di sini..."
                class="w-full p-3 rounded-xl border border-slate-300 text-sm"></textarea>
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-600 mb-1">Gambar Pertanyaan (Opsional)</label>
              <input type="file" id="file-soal-img" accept="image/*" class="text-xs w-full" />
              <input type="hidden" id="soal-gambar-url" />
              <img id="soal-gambar-preview" alt="Preview Soal" class="hidden h-24 mt-2 rounded border" />
            </div>
          </div>

          <div id="dynamic-soal-fields" class="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3"></div>

          <div>
            <label class="block text-xs font-bold text-slate-600 mb-1">Pembahasan / Rubrik Koreksi (Opsional)</label>
            <input type="text" id="soal-pembahasan" placeholder="Catatan kunci jawaban atau pedoman penskoran uraian..."
              class="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm" />
          </div>

          <button type="submit" class="px-6 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm shadow">
            Simpan Soal ke Bank Soal
          </button>
        </form>
      </div>

      <!-- DAFTAR BANK SOAL MAPEL TERPILIH -->
      <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div class="px-5 py-3.5 bg-slate-50 border-b flex flex-wrap items-center justify-between gap-2">
          <div class="font-bold text-sm text-slate-800">
            Daftar Butir Soal (<span id="count-soal-mapel">0</span> soal)
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <select id="filter-tingkat-bank" class="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-bold">
              <option value="">Semua Tingkat Kelas</option>
            </select>
            <input type="text" id="search-bank-soal" placeholder="Cari teks soal..."
              class="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs" />
            <button type="button" id="btn-hapus-semua-soal" class="text-xs text-red-600 hover:underline font-bold ml-2">
              Hapus Semua Soal Mapel Ini
            </button>
          </div>
        </div>
        <div id="list-bank-soal" class="divide-y divide-slate-200"></div>
      </div>

      <!-- MODAL EDIT SOAL -->
      <div id="modal-edit-soal" class="fixed inset-0 bg-slate-950/75 z-50 hidden items-center justify-center p-4 no-print">
        <div class="bg-white max-w-3xl w-full rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
          <div class="flex justify-between items-center border-b pb-3">
            <div>
              <h3 class="font-extrabold text-lg text-slate-900">Edit Butir Soal</h3>
              <p class="text-xs text-slate-500">Ubah pertanyaan, tingkat kelas, pilihan jawaban, kunci jawaban, atau bobot skor.</p>
            </div>
            <button type="button" id="btn-close-edit-soal" class="text-slate-500 hover:text-slate-800 font-bold text-2xl leading-none">&times;</button>
          </div>

          <form id="form-edit-soal" class="space-y-4">
            <input type="hidden" id="edit-soal-id" />
            <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label class="block text-xs font-bold text-slate-600 mb-1">Tipe Soal</label>
                <select id="edit-soal-tipe" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-semibold bg-blue-50">
                  <option value="pg">1. Pilihan Ganda (pg)</option>
                  <option value="pgk_mcma">2. PGK Multi-Jawaban (pgk_mcma)</option>
                  <option value="pgk_kategori_bs">3. PGK Benar/Salah (pgk_kategori_bs)</option>
                  <option value="pgk_kategori_sesuai">4. PGK Sesuai/Tidak (pgk_kategori_sesuai)</option>
                  <option value="menjodohkan">5. Menjodohkan (menjodohkan)</option>
                  <option value="isian_singkat">6. Isian Singkat (isian_singkat)</option>
                  <option value="uraian">7. Uraian (uraian)</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-600 mb-1">Tingkat Kelas</label>
                <input type="text" id="edit-soal-tingkat" list="datalist-tingkat-soal" placeholder="Cth: X, XI, XII"
                  class="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-semibold" />
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-600 mb-1">Stimulus (Opsional)</label>
                <select id="edit-soal-stimulus-id" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm">
                  <option value="">-- Tanpa Stimulus --</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-600 mb-1">Bobot Skor</label>
                <input type="number" id="edit-soal-bobot" value="1" step="0.5" min="0.5"
                  class="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold" />
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="md:col-span-2">
                <label class="block text-xs font-bold text-slate-600 mb-1">Pertanyaan</label>
                <textarea id="edit-soal-pertanyaan" rows="3" required
                  class="w-full p-3 rounded-xl border border-slate-300 text-sm"></textarea>
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-600 mb-1">Gambar Pertanyaan</label>
                <input type="file" id="edit-file-soal-img" accept="image/*" class="text-xs w-full" />
                <input type="hidden" id="edit-soal-gambar-url" />
                <img id="edit-soal-gambar-preview" alt="Preview Edit Soal" class="hidden h-24 mt-2 rounded border" />
              </div>
            </div>

            <div id="edit-dynamic-soal-fields" class="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3"></div>

            <div>
              <label class="block text-xs font-bold text-slate-600 mb-1">Pembahasan / Rubrik Koreksi (Opsional)</label>
              <input type="text" id="edit-soal-pembahasan"
                class="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm" />
            </div>

            <div class="flex justify-end gap-2 pt-2 border-t">
              <button type="button" id="btn-batal-edit-soal" class="px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-sm">
                Batal
              </button>
              <button type="submit" class="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow">
                Simpan Perubahan Soal
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    // Bind events
    document.getElementById("filter-paket-jump").addEventListener("change", (e) => {
      if (e.target.value) {
        document.getElementById("filter-mapel-soal").value = e.target.value;
        this.loadData();
      }
    });
    document.getElementById("filter-mapel-soal").addEventListener("change", () => this.loadData());
    document.getElementById("filter-tingkat-bank").addEventListener("change", () => this.renderSoalList());
    document.getElementById("search-bank-soal").addEventListener("input", () => this.renderSoalList());

    document.getElementById("soal-tipe").addEventListener("change", () =>
      this.renderDynamicFields("soal", document.getElementById("soal-tipe").value, null)
    );
    document.getElementById("edit-soal-tipe").addEventListener("change", () =>
      this.renderDynamicFields("edit-soal", document.getElementById("edit-soal-tipe").value, null)
    );

    document.getElementById("file-stim-img").addEventListener("change", (e) =>
      this.uploadImageField(e.target, "stim-gambar-url", "stim-preview")
    );
    document.getElementById("file-soal-img").addEventListener("change", (e) =>
      this.uploadImageField(e.target, "soal-gambar-url", "soal-gambar-preview")
    );
    document.getElementById("edit-file-soal-img").addEventListener("change", (e) =>
      this.uploadImageField(e.target, "edit-soal-gambar-url", "edit-soal-gambar-preview")
    );

    document.getElementById("form-stimulus").addEventListener("submit", (e) => this.saveStimulus(e));
    document.getElementById("form-soal").addEventListener("submit", (e) => this.saveSoalManual(e));
    document.getElementById("form-edit-soal").addEventListener("submit", (e) => this.updateSoalManual(e));

    document.getElementById("btn-close-edit-soal").addEventListener("click", () => this.closeEditModal());
    document.getElementById("btn-batal-edit-soal").addEventListener("click", () => this.closeEditModal());

    document.getElementById("btn-tmpl-soal").addEventListener("click", () => this.downloadTemplateCSV());
    document.getElementById("file-csv-soal").addEventListener("change", (e) => this.previewCSVSoal(e.target));
    document.getElementById("btn-batal-impor").addEventListener("click", () => this.cancelImport());
    document.getElementById("btn-simpan-impor").addEventListener("click", () => this.commitImport());
    document.getElementById("btn-ekspor-soal").addEventListener("click", () => this.exportCSVSoal());
    document.getElementById("btn-hapus-semua-soal").addEventListener("click", () => this.deleteAllSoalMapel());

    this.renderDynamicFields("soal", "pg", null);
    await this.loadData();
  },

  async uploadImageField(inputEl, hiddenId, previewId) {
    const file = inputEl.files[0];
    if (!file) return;
    try {
      CBTUtils.showToast("Mengunggah gambar...", "info");
      const url = await CBTUtils.uploadImageToBucket(file, "soal");
      document.getElementById(hiddenId).value = url;
      if (previewId) {
        const img = document.getElementById(previewId);
        img.src = url;
        img.classList.remove("hidden");
      }
      CBTUtils.showToast("Gambar berhasil diunggah!", "success");
    } catch (err) {
      CBTUtils.showToast("Gagal unggah gambar: " + err.message, "error");
    }
  },

  renderDynamicFields(prefix, tipe, existingSoal) {
    const isEdit = prefix === "edit-soal";
    const box = document.getElementById(isEdit ? "edit-dynamic-soal-fields" : "dynamic-soal-fields");
    const radioName = isEdit ? "edit_kunci_pg" : "kunci_pg";
    const opsiPrefix = isEdit ? "edit-opsi" : "opsi";
    const matPrefix = isEdit ? "edit-mat" : "mat";
    const jodohPrefix = isEdit ? "edit-jodoh" : "jodoh";
    const isianId = isEdit ? "edit-kunci-isian" : "kunci-isian";

    const struktur = existingSoal?.opsi_dan_struktur || {};
    const kunci = existingSoal?.kunci_jawaban || {};

    if (tipe === "pg" || tipe === "pgk_mcma") {
      const huruf = ["A", "B", "C", "D", "E"];
      const isMulti = tipe === "pgk_mcma";
      const existingOpsiMap = {};
      (struktur.opsi || []).forEach((o) => {
        existingOpsiMap[String(o.kode || "").toUpperCase()] = o;
      });
      const kunciArr = Array.isArray(kunci.jawaban)
        ? kunci.jawaban.map((x) => String(x).toUpperCase())
        : kunci.jawaban
        ? [String(kunci.jawaban).toUpperCase()]
        : [];

      box.innerHTML = `
        <div class="text-xs font-bold text-slate-700 mb-2">Pilihan Jawaban (${isMulti ? "Centang semua jawaban benar" : "Pilih satu kunci benar"})</div>
        ${huruf
          .map((h) => {
            const item = existingOpsiMap[h] || {};
            const isChecked = kunciArr.includes(h) ? "checked" : "";
            return `
              <div class="grid grid-cols-1 md:grid-cols-12 gap-2 items-center bg-white p-2.5 rounded-lg border">
                <div class="md:col-span-1 flex items-center gap-1.5 font-bold text-sm">
                  <input type="${isMulti ? "checkbox" : "radio"}" name="${radioName}" value="${h}" ${isChecked} class="w-4 h-4 accent-emerald-600" />
                  <span>${h}</span>
                </div>
                <div class="md:col-span-7">
                  <input type="text" id="${opsiPrefix}-teks-${h}" value="${CBTUtils.escapeHtml(item.teks || "")}" placeholder="Teks pilihan ${h}" class="w-full px-3 py-1.5 rounded border text-sm" />
                </div>
                <div class="md:col-span-4 flex items-center gap-2">
                  <input type="file" accept="image/*" data-opt-h="${h}" class="opt-img-input text-xs w-full" />
                  <input type="hidden" id="${opsiPrefix}-img-${h}" value="${CBTUtils.escapeHtml(item.gambar || "")}" />
                  <img id="${opsiPrefix}-prev-${h}" src="${CBTUtils.escapeHtml(item.gambar || "")}" class="h-8 w-8 object-cover rounded ${item.gambar ? "" : "hidden"}" />
                </div>
              </div>
            `;
          })
          .join("")}
      `;
      box.querySelectorAll(".opt-img-input").forEach((inp) => {
        inp.onchange = () => {
          const h = inp.dataset.optH;
          this.uploadImageField(inp, `${opsiPrefix}-img-${h}`, `${opsiPrefix}-prev-${h}`);
        };
      });
    } else if (tipe === "pgk_kategori_bs" || tipe === "pgk_kategori_sesuai") {
      const colA = tipe === "pgk_kategori_bs" ? "Benar" : "Sesuai";
      const colB = tipe === "pgk_kategori_bs" ? "Salah" : "Tidak Sesuai";
      const pernyArr = struktur.pernyataan || [];
      const jwbArr = kunci.jawaban || [];

      box.innerHTML = `
        <div class="text-xs font-bold text-slate-700 mb-2">Pernyataan &amp; Kunci Kategori (${colA} / ${colB})</div>
        ${[0, 1, 2, 3]
          .map((i) => {
            const teksVal = pernyArr[i] || "";
            const kunciVal = jwbArr[i] || colA;
            return `
              <div class="flex flex-wrap md:flex-nowrap items-center gap-2 bg-white p-2.5 rounded-lg border">
                <input type="text" id="${matPrefix}-teks-${i}" value="${CBTUtils.escapeHtml(teksVal)}" placeholder="Pernyataan ke-${i + 1} (kosongkan jika tidak digunakan)" class="flex-1 px-3 py-1.5 rounded border text-sm" />
                <select id="${matPrefix}-kunci-${i}" class="px-3 py-1.5 rounded border text-xs font-bold bg-emerald-50">
                  <option value="${colA}" ${kunciVal === colA ? "selected" : ""}>${colA}</option>
                  <option value="${colB}" ${kunciVal === colB ? "selected" : ""}>${colB}</option>
                </select>
              </div>
            `;
          })
          .join("")}
      `;
    } else if (tipe === "menjodohkan") {
      const kiriArr = struktur.kiri || [];
      const kananArr = struktur.kanan || [];
      const pasMap = kunci.pasangan || {};

      box.innerHTML = `
        <div class="text-xs font-bold text-slate-700 mb-2">Pasangan Kiri &amp; Kanan (Isi berpasangan sejajar; sistem mengacak kolom kanan otomatis)</div>
        ${[1, 2, 3, 4]
          .map((i) => {
            const kObj = kiriArr[i - 1];
            const rId = kObj ? pasMap[kObj.id] : null;
            const rObj = rId ? kananArr.find((x) => x.id === rId) : null;
            return `
              <div class="grid grid-cols-1 md:grid-cols-2 gap-2 bg-white p-2.5 rounded-lg border">
                <input type="text" id="${jodohPrefix}-kiri-${i}" value="${CBTUtils.escapeHtml(kObj?.teks || "")}" placeholder="Premis Kiri ${i}" class="px-3 py-1.5 rounded border text-sm" />
                <input type="text" id="${jodohPrefix}-kanan-${i}" value="${CBTUtils.escapeHtml(rObj?.teks || "")}" placeholder="Pasangan Kanan ${i}" class="px-3 py-1.5 rounded border text-sm bg-emerald-50/50" />
              </div>
            `;
          })
          .join("")}
      `;
    } else if (tipe === "isian_singkat") {
      const jwbStr = Array.isArray(kunci.jawaban) ? kunci.jawaban.join(", ") : kunci.jawaban || "";
      box.innerHTML = `
        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">Kunci Jawaban Sah (Pisahkan koma untuk variasi jawaban, cth: 60, enam puluh)</label>
          <input type="text" id="${isianId}" value="${CBTUtils.escapeHtml(jwbStr)}" required placeholder="Contoh: Soekarno, Ir. Soekarno"
            class="w-full px-3.5 py-2 rounded-lg border bg-white text-sm font-semibold" />
        </div>
      `;
    } else if (tipe === "uraian") {
      box.innerHTML = `
        <div class="text-xs text-amber-800 bg-amber-50 p-3 rounded-lg border border-amber-200">
          Soal <strong>Uraian</strong> dinilai secara manual oleh guru pada menu <strong>Rekap Nilai &amp; Uraian</strong>. Isi rubrik penskoran pada kolom Pembahasan di bawah.
        </div>
      `;
    }
  },

  collectStrukturAndKunci(prefix, tipe) {
    const isEdit = prefix === "edit-soal";
    const radioName = isEdit ? "edit_kunci_pg" : "kunci_pg";
    const opsiPrefix = isEdit ? "edit-opsi" : "opsi";
    const matPrefix = isEdit ? "edit-mat" : "mat";
    const jodohPrefix = isEdit ? "edit-jodoh" : "jodoh";
    const isianId = isEdit ? "edit-kunci-isian" : "kunci-isian";

    let struktur = {};
    let kunci = {};

    if (tipe === "pg" || tipe === "pgk_mcma") {
      const opsi = [];
      ["A", "B", "C", "D", "E"].forEach((h) => {
        const teks = document.getElementById(`${opsiPrefix}-teks-${h}`).value.trim();
        const gambar = document.getElementById(`${opsiPrefix}-img-${h}`).value;
        if (teks || gambar) opsi.push({ kode: h, teks, gambar });
      });
      if (opsi.length < 2) {
        CBTUtils.showToast("Minimal harus ada 2 pilihan jawaban.", "warning");
        return null;
      }
      struktur = { opsi };

      if (tipe === "pg") {
        const checked = document.querySelector(`input[name="${radioName}"]:checked`);
        if (!checked) {
          CBTUtils.showToast("Pilih satu kunci jawaban benar.", "warning");
          return null;
        }
        kunci = { jawaban: checked.value };
      } else {
        const checkedAll = Array.from(document.querySelectorAll(`input[name="${radioName}"]:checked`)).map(
          (el) => el.value
        );
        if (checkedAll.length === 0) {
          CBTUtils.showToast("Centang minimal satu kunci jawaban benar.", "warning");
          return null;
        }
        kunci = { jawaban: checkedAll };
      }
    } else if (tipe === "pgk_kategori_bs" || tipe === "pgk_kategori_sesuai") {
      const pernyataan = [];
      const jawaban = [];
      for (let i = 0; i < 4; i++) {
        const t = document.getElementById(`${matPrefix}-teks-${i}`).value.trim();
        if (t) {
          pernyataan.push(t);
          jawaban.push(document.getElementById(`${matPrefix}-kunci-${i}`).value);
        }
      }
      if (pernyataan.length === 0) {
        CBTUtils.showToast("Isi minimal satu pernyataan.", "warning");
        return null;
      }
      struktur = { pernyataan };
      kunci = { jawaban };
    } else if (tipe === "menjodohkan") {
      const kiri = [];
      const kanan = [];
      const pasangan = {};
      for (let i = 1; i <= 4; i++) {
        const k = document.getElementById(`${jodohPrefix}-kiri-${i}`).value.trim();
        const n = document.getElementById(`${jodohPrefix}-kanan-${i}`).value.trim();
        if (k && n) {
          kiri.push({ id: `L${i}`, teks: k });
          kanan.push({ id: `R${i}`, teks: n });
          pasangan[`L${i}`] = `R${i}`;
        }
      }
      if (kiri.length < 2) {
        CBTUtils.showToast("Isi minimal 2 pasang pernyataan menjodohkan.", "warning");
        return null;
      }
      kanan.sort(() => Math.random() - 0.5);
      struktur = { kiri, kanan };
      kunci = { pasangan };
    } else if (tipe === "isian_singkat") {
      const raw = document
        .getElementById(isianId)
        .value.split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (raw.length === 0) {
        CBTUtils.showToast("Isi kunci jawaban singkat.", "warning");
        return null;
      }
      kunci = { jawaban: raw };
    }

    return { struktur, kunci };
  },

  async loadData() {
    const mapelId = document.getElementById("filter-mapel-soal").value;
    if (!mapelId) return;

    const [stimRes, soalRes] = await Promise.all([
      window.SB.from("stimulus").select("*").eq("mapel_id", mapelId).order("created_at", { ascending: true }),
      window.SB
        .from("bank_soal")
        .select("*, stimulus(judul)")
        .eq("mapel_id", mapelId)
        .order("created_at", { ascending: true })
        .order("id", { ascending: true })
    ]);

    this.stimulusList = stimRes.data || [];
    this.soalList = soalRes.data || [];

    const stimOpts =
      '<option value="">-- Tanpa Stimulus --</option>' +
      this.stimulusList.map((s) => `<option value="${s.id}">${CBTUtils.escapeHtml(s.judul)}</option>`).join("");
    document.getElementById("soal-stimulus-id").innerHTML = stimOpts;
    document.getElementById("edit-soal-stimulus-id").innerHTML = stimOpts;

    // Populate filter tingkat kelas dari soal yang ada
    const tingkatFilter = document.getElementById("filter-tingkat-bank");
    const prevTingkat = tingkatFilter.value;
    const distinctTingkat = [...new Set(this.soalList.map((s) => s.tingkat_kelas).filter(Boolean))].sort();
    tingkatFilter.innerHTML =
      '<option value="">Semua Tingkat Kelas</option>' +
      distinctTingkat.map((t) => `<option value="${CBTUtils.escapeHtml(t)}">Kelas ${CBTUtils.escapeHtml(t)}</option>`).join("");
    if (distinctTingkat.includes(prevTingkat)) {
      tingkatFilter.value = prevTingkat;
    }

    this.renderSoalList();
  },

  renderSoalDetailPreview(s) {
    const tipe = s.tipe_soal;
    const struktur = s.opsi_dan_struktur || {};
    const kunci = s.kunci_jawaban || {};

    if (tipe === "pg" || tipe === "pgk_mcma") {
      const opsiArr = struktur.opsi || [];
      const kunciSet = Array.isArray(kunci.jawaban)
        ? kunci.jawaban.map((x) => String(x).toUpperCase())
        : kunci.jawaban
        ? [String(kunci.jawaban).toUpperCase()]
        : [];

      if (opsiArr.length === 0) return "";
      return `
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-2">
          ${opsiArr
            .map((o) => {
              const kd = String(o.kode || "").toUpperCase();
              const isTrue = kunciSet.includes(kd);
              return `
                <div class="px-2.5 py-1.5 rounded-lg border text-xs flex items-center justify-between gap-2 ${
                  isTrue
                    ? "bg-emerald-50 border-emerald-400 text-emerald-950 font-bold"
                    : "bg-slate-50 border-slate-200 text-slate-700"
                }">
                  <span class="truncate"><strong>${kd}.</strong> ${CBTUtils.escapeHtml(o.teks || (o.gambar ? "[Gambar]" : "-"))}</span>
                  ${isTrue ? '<span class="px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[10px] shrink-0">✓ Kunci</span>' : ""}
                </div>
              `;
            })
            .join("")}
        </div>
      `;
    }

    if (tipe === "pgk_kategori_bs" || tipe === "pgk_kategori_sesuai") {
      const perny = struktur.pernyataan || [];
      const jwb = kunci.jawaban || [];
      return `
        <div class="space-y-1 pt-2">
          ${perny
            .map(
              (p, idx) => `
              <div class="px-2.5 py-1 rounded bg-slate-50 border border-slate-200 text-xs flex items-center justify-between gap-2">
                <span class="text-slate-700">${idx + 1}. ${CBTUtils.escapeHtml(p)}</span>
                <span class="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-bold text-[11px] shrink-0">✓ ${CBTUtils.escapeHtml(jwb[idx] || "-")}</span>
              </div>
            `
            )
            .join("")}
        </div>
      `;
    }

    if (tipe === "menjodohkan") {
      const kiri = struktur.kiri || [];
      const kanan = struktur.kanan || [];
      const pas = kunci.pasangan || {};
      return `
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-2">
          ${kiri
            .map((k) => {
              const rObj = kanan.find((r) => r.id === pas[k.id]);
              return `
                <div class="px-2.5 py-1 rounded bg-emerald-50/70 border border-emerald-200 text-xs text-slate-800">
                  <strong>${CBTUtils.escapeHtml(k.teks)}</strong> &rarr; <span class="text-emerald-800 font-bold">${CBTUtils.escapeHtml(rObj?.teks || "-")}</span>
                </div>
              `;
            })
            .join("")}
        </div>
      `;
    }

    if (tipe === "isian_singkat") {
      const jwb = Array.isArray(kunci.jawaban) ? kunci.jawaban.join(" / ") : kunci.jawaban || "-";
      return `
        <div class="pt-1.5">
          <span class="inline-block px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold">
            ✓ Kunci Jawaban: ${CBTUtils.escapeHtml(jwb)}
          </span>
        </div>
      `;
    }

    if (tipe === "uraian" && s.pembahasan) {
      return `
        <div class="pt-1.5">
          <span class="inline-block px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs">
            <strong>Rubrik:</strong> ${CBTUtils.escapeHtml(s.pembahasan)}
          </span>
        </div>
      `;
    }

    return "";
  },

  renderSoalList() {
    const filterTingkat = document.getElementById("filter-tingkat-bank")?.value || "";
    const query = (document.getElementById("search-bank-soal")?.value || "").trim().toLowerCase();

    const filtered = this.soalList.filter((s) => {
      if (filterTingkat && (s.tingkat_kelas || "") !== filterTingkat) return false;
      if (query && !(s.pertanyaan || "").toLowerCase().includes(query)) return false;
      return true;
    });

    document.getElementById("count-soal-mapel").textContent = filtered.length;

    const listBox = document.getElementById("list-bank-soal");
    listBox.innerHTML =
      filtered
        .map(
          (s, idx) => `
          <div class="p-4 flex items-start justify-between gap-4 hover:bg-slate-50/60 transition">
            <div class="space-y-1.5 min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <span class="px-2.5 py-0.5 rounded-lg bg-slate-900 text-white text-xs font-extrabold">#${idx + 1}</span>
                <span class="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-xs font-bold">${CBTUtils.escapeHtml(s.tipe_soal)}</span>
                ${
                  s.tingkat_kelas
                    ? `<span class="px-2 py-0.5 rounded bg-purple-100 text-purple-800 text-xs font-bold">Kelas ${CBTUtils.escapeHtml(s.tingkat_kelas)}</span>`
                    : ""
                }
                ${
                  s.stimulus
                    ? `<span class="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-xs font-semibold">Stimulus: ${CBTUtils.escapeHtml(s.stimulus.judul)}</span>`
                    : ""
                }
                <span class="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 text-xs font-extrabold">Bobot: ${s.bobot_skor}</span>
              </div>
              <p class="text-sm text-slate-900 font-semibold whitespace-pre-line">${CBTUtils.escapeHtml(s.pertanyaan)}</p>
              ${this.renderSoalDetailPreview(s)}
            </div>
            <div class="flex flex-col sm:flex-row items-end sm:items-center gap-1.5 shrink-0">
              <button type="button" data-edit-soal="${s.id}"
                class="btn-edit-soal px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold">
                Edit
              </button>
              <button type="button" data-del-soal="${s.id}"
                class="btn-del-soal px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold">
                Hapus
              </button>
            </div>
          </div>
        `
        )
        .join("") || '<p class="p-5 text-center text-slate-400 text-sm">Belum ada soal yang sesuai filter pada mata pelajaran ini.</p>';

    listBox.querySelectorAll(".btn-edit-soal").forEach((b) => {
      b.onclick = () => this.openEditModal(b.dataset.editSoal);
    });

    listBox.querySelectorAll(".btn-del-soal").forEach((b) => {
      b.onclick = () => {
        CBTUtils.confirmDialog(
          "Hapus Butir Soal?",
          "Butir soal ini akan dihapus permanen dari bank soal.",
          async () => {
            await window.SB.from("bank_soal").delete().eq("id", b.dataset.delSoal);
            CBTUtils.showToast("Butir soal dihapus.", "success");
            await this.loadData();
          },
          "Hapus",
          "bg-red-600 text-white"
        );
      };
    });
  },

  openEditModal(soalId) {
    const soal = this.soalList.find((x) => x.id === soalId);
    if (!soal) return;

    document.getElementById("edit-soal-id").value = soal.id;
    document.getElementById("edit-soal-tipe").value = soal.tipe_soal;
    document.getElementById("edit-soal-tingkat").value = soal.tingkat_kelas || "";
    document.getElementById("edit-soal-stimulus-id").value = soal.stimulus_id || "";
    document.getElementById("edit-soal-bobot").value = soal.bobot_skor ?? 1;
    document.getElementById("edit-soal-pertanyaan").value = soal.pertanyaan || "";
    document.getElementById("edit-soal-pembahasan").value = soal.pembahasan || "";

    const imgUrl = soal.gambar_pertanyaan_url || "";
    document.getElementById("edit-soal-gambar-url").value = imgUrl;
    const prevImg = document.getElementById("edit-soal-gambar-preview");
    if (imgUrl) {
      prevImg.src = imgUrl;
      prevImg.classList.remove("hidden");
    } else {
      prevImg.classList.add("hidden");
    }

    this.renderDynamicFields("edit-soal", soal.tipe_soal, soal);

    const modal = document.getElementById("modal-edit-soal");
    modal.classList.remove("hidden");
    modal.classList.add("flex");
  },

  closeEditModal() {
    const modal = document.getElementById("modal-edit-soal");
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  },

  async saveStimulus(e) {
    e.preventDefault();
    const mapelId = document.getElementById("filter-mapel-soal").value;
    if (!mapelId) {
      CBTUtils.showToast("Pilih mata pelajaran terlebih dahulu.", "warning");
      return;
    }

    const { error } = await window.SB.from("stimulus").insert({
      mapel_id: mapelId,
      judul: document.getElementById("stim-judul").value.trim(),
      konten_teks: document.getElementById("stim-teks").value,
      gambar_url: document.getElementById("stim-gambar-url").value || null
    });

    if (error) CBTUtils.showToast("Gagal menyimpan stimulus: " + error.message, "error");
    else {
      CBTUtils.showToast("Stimulus berhasil ditambahkan!", "success");
      document.getElementById("form-stimulus").reset();
      document.getElementById("stim-gambar-url").value = "";
      document.getElementById("stim-preview").classList.add("hidden");
      await this.loadData();
    }
  },

  async saveSoalManual(e) {
    e.preventDefault();
    const mapelId = document.getElementById("filter-mapel-soal").value;
    if (!mapelId) {
      CBTUtils.showToast("Pilih mata pelajaran terlebih dahulu.", "warning");
      return;
    }

    const tipe = document.getElementById("soal-tipe").value;
    const parsed = this.collectStrukturAndKunci("soal", tipe);
    if (!parsed) return;

    const { error } = await window.SB.from("bank_soal").insert({
      mapel_id: mapelId,
      stimulus_id: document.getElementById("soal-stimulus-id").value || null,
      tingkat_kelas: document.getElementById("soal-tingkat").value.trim() || null,
      tipe_soal: tipe,
      pertanyaan: document.getElementById("soal-pertanyaan").value.trim(),
      gambar_pertanyaan_url: document.getElementById("soal-gambar-url").value || null,
      opsi_dan_struktur: parsed.struktur,
      kunci_jawaban: parsed.kunci,
      bobot_skor: parseFloat(document.getElementById("soal-bobot").value) || 1,
      pembahasan: document.getElementById("soal-pembahasan").value.trim() || null
    });

    if (error) CBTUtils.showToast("Gagal menyimpan soal: " + error.message, "error");
    else {
      CBTUtils.showToast("Soal berhasil disimpan!", "success");
      document.getElementById("soal-pertanyaan").value = "";
      document.getElementById("soal-gambar-url").value = "";
      document.getElementById("soal-gambar-preview").classList.add("hidden");
      document.getElementById("soal-pembahasan").value = "";
      this.renderDynamicFields("soal", tipe, null);
      await this.loadData();
    }
  },

  async updateSoalManual(e) {
    e.preventDefault();
    const soalId = document.getElementById("edit-soal-id").value;
    if (!soalId) return;

    const tipe = document.getElementById("edit-soal-tipe").value;
    const parsed = this.collectStrukturAndKunci("edit-soal", tipe);
    if (!parsed) return;

    const { error } = await window.SB.from("bank_soal")
      .update({
        stimulus_id: document.getElementById("edit-soal-stimulus-id").value || null,
        tingkat_kelas: document.getElementById("edit-soal-tingkat").value.trim() || null,
        tipe_soal: tipe,
        pertanyaan: document.getElementById("edit-soal-pertanyaan").value.trim(),
        gambar_pertanyaan_url: document.getElementById("edit-soal-gambar-url").value || null,
        opsi_dan_struktur: parsed.struktur,
        kunci_jawaban: parsed.kunci,
        bobot_skor: parseFloat(document.getElementById("edit-soal-bobot").value) || 1,
        pembahasan: document.getElementById("edit-soal-pembahasan").value.trim() || null
      })
      .eq("id", soalId);

    if (error) {
      CBTUtils.showToast("Gagal memperbarui soal: " + error.message, "error");
    } else {
      CBTUtils.showToast("Perubahan soal berhasil disimpan!", "success");
      this.closeEditModal();
      await this.loadData();
    }
  },

  downloadTemplateCSV() {
    const rows = [
      "tingkat_kelas;tipe_soal;pertanyaan;opsi_a;opsi_b;opsi_c;opsi_d;opsi_e;kunci_jawaban;bobot_skor;pembahasan",
      "X;pg;Ibu kota provinsi Jawa Barat adalah...;Jakarta;Bandung;Surabaya;Semarang;Medan;B;1;Bandung adalah ibu kota Jawa Barat",
      "X;pgk_mcma;Manakah yang termasuk bilangan prima?;2;4;5;9;11;A,C,E;2;Bilangan prima adalah 2, 5, dan 11",
      "XI;pgk_kategori_bs;Tentukan Benar atau Salah pernyataan berikut!;Air mendidih pada 100 derajat Celcius;Matahari terbit dari barat;Indonesia merdeka tahun 1945;;;Benar,Salah,Benar;2;Evaluasi pernyataan dasar",
      "XI;menjodohkan;Pasangkan provinsi dengan ibu kotanya!;Jawa Timur :: Surabaya;Jawa Tengah :: Semarang;Bali :: Denpasar;;;OTOMATIS;2;Pasangan wilayah",
      "XII;isian_singkat;Hasil dari 15 x 4 adalah...;;;;;;60,enam puluh;1;15 dikali 4 sama dengan 60",
      "XII;uraian;Jelaskan proses terjadinya fotosintesis pada tumbuhan hijau!;;;;;;;5;Rubrik: cahaya, klorofil, CO2, H2O menghasilkan glukosa dan O2"
    ];
    CBTUtils.downloadFile("\uFEFF" + rows.join("\n"), "template_bank_soal_cbt.csv");
  },

  previewCSVSoal(inputEl) {
    const file = inputEl.files[0];
    if (!file) return;
    const mapelId = document.getElementById("filter-mapel-soal").value;
    if (!mapelId) {
      CBTUtils.showToast("Pilih mata pelajaran terlebih dahulu!", "warning");
      inputEl.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result.replace(/^\uFEFF/, "");
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length < 2) {
        CBTUtils.showToast("File CSV kosong atau tidak memiliki data soal.", "error");
        return;
      }

      const delimiter = lines[0].includes(";") ? ";" : ",";
      const validTypes = [
        "pg",
        "pgk_mcma",
        "pgk_kategori_bs",
        "pgk_kategori_sesuai",
        "menjodohkan",
        "isian_singkat",
        "uraian"
      ];

      this.parsedImport = [];

      for (let i = 1; i < lines.length; i++) {
        const cols = CBTUtils.parseCSVLine(lines[i], delimiter);
        if (cols.length < 3 || !cols[2]) continue;

        const col0 = (cols[0] || "").trim();
        const tingkatKelas = /^\d+$/.test(col0) ? null : col0 || null;
        const tipe = validTypes.includes((cols[1] || "").toLowerCase().trim())
          ? cols[1].toLowerCase().trim()
          : "pg";
        const pertanyaan = cols[2];
        const rawOps = [cols[3] || "", cols[4] || "", cols[5] || "", cols[6] || "", cols[7] || ""];
        const kunciRaw = cols[8] || "";
        const bobot = parseFloat(cols[9]) || 1;
        const pembahasan = cols[10] || null;

        let struktur = {};
        let kunci = {};

        if (tipe === "pg" || tipe === "pgk_mcma") {
          const huruf = ["A", "B", "C", "D", "E"];
          const opsi = [];
          rawOps.forEach((teks, idx) => {
            if (teks) opsi.push({ kode: huruf[idx], teks, gambar: "" });
          });
          struktur = { opsi };
          if (tipe === "pg") {
            kunci = { jawaban: kunciRaw.toUpperCase().trim() };
          } else {
            kunci = {
              jawaban: kunciRaw
                .split(",")
                .map((s) => s.toUpperCase().trim())
                .filter(Boolean)
            };
          }
        } else if (tipe === "pgk_kategori_bs" || tipe === "pgk_kategori_sesuai") {
          const pernyataan = rawOps.filter(Boolean);
          const jawaban = kunciRaw
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
          struktur = { pernyataan };
          kunci = { jawaban };
        } else if (tipe === "menjodohkan") {
          const kiri = [];
          const kanan = [];
          const pasangan = {};
          rawOps.filter(Boolean).forEach((pairStr, idx) => {
            const parts = pairStr.split("::");
            if (parts.length >= 2) {
              const lId = `L${idx + 1}`;
              const rId = `R${idx + 1}`;
              kiri.push({ id: lId, teks: parts[0].trim() });
              kanan.push({ id: rId, teks: parts[1].trim() });
              pasangan[lId] = rId;
            }
          });
          kanan.sort(() => Math.random() - 0.5);
          struktur = { kiri, kanan };
          kunci = { pasangan };
        } else if (tipe === "isian_singkat") {
          kunci = {
            jawaban: kunciRaw
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          };
        }

        this.parsedImport.push({
          mapel_id: mapelId,
          tingkat_kelas: tingkatKelas,
          tipe_soal: tipe,
          pertanyaan,
          opsi_dan_struktur: struktur,
          kunci_jawaban: kunci,
          bobot_skor: bobot,
          pembahasan,
          _kunciPreview: kunciRaw || "-"
        });
      }

      if (this.parsedImport.length === 0) {
        CBTUtils.showToast("Tidak ada soal valid yang terbaca dari CSV.", "error");
        return;
      }

      document.getElementById("jumlah-preview-soal").textContent = this.parsedImport.length;
      document.getElementById("tbody-preview-impor").innerHTML = this.parsedImport
        .map(
          (s, idx) => `
          <tr>
            <td class="p-2 font-bold">${idx + 1}</td>
            <td class="p-2 font-semibold text-purple-700">${CBTUtils.escapeHtml(s.tingkat_kelas || "-")}</td>
            <td class="p-2"><span class="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold">${CBTUtils.escapeHtml(s.tipe_soal)}</span></td>
            <td class="p-2">${CBTUtils.escapeHtml(s.pertanyaan)}</td>
            <td class="p-2 font-mono font-bold text-emerald-700">${CBTUtils.escapeHtml(s._kunciPreview)}</td>
            <td class="p-2">${s.bobot_skor}</td>
          </tr>
        `
        )
        .join("");
      document.getElementById("preview-impor-box").classList.remove("hidden");
      inputEl.value = "";
    };
    reader.readAsText(file, "UTF-8");
  },

  cancelImport() {
    this.parsedImport = [];
    document.getElementById("preview-impor-box").classList.add("hidden");
  },

  async commitImport() {
    if (this.parsedImport.length === 0) return;
    const payload = this.parsedImport.map(({ _kunciPreview, ...rest }) => rest);
    const { error } = await window.SB.from("bank_soal").insert(payload);
    if (error) {
      CBTUtils.showToast("Gagal menyimpan impor soal: " + error.message, "error");
    } else {
      CBTUtils.showToast(`Berhasil mengimpor ${payload.length} soal!`, "success");
      this.cancelImport();
      await this.loadData();
    }
  },

  exportCSVSoal() {
    if (this.soalList.length === 0) {
      CBTUtils.showToast("Belum ada soal untuk diekspor.", "warning");
      return;
    }

    const esc = (val) => `"${String(val ?? "").replace(/"/g, '""')}"`;
    const header = "tingkat_kelas;tipe_soal;pertanyaan;opsi_a;opsi_b;opsi_c;opsi_d;opsi_e;kunci_jawaban;bobot_skor;pembahasan";

    const rows = this.soalList.map((s) => {
      const ops = ["", "", "", "", ""];
      let kunciStr = "";

      if (s.tipe_soal === "pg" || s.tipe_soal === "pgk_mcma") {
        (s.opsi_dan_struktur?.opsi || []).forEach((o, i) => {
          if (i < 5) ops[i] = o.teks || "";
        });
        kunciStr = Array.isArray(s.kunci_jawaban?.jawaban)
          ? s.kunci_jawaban.jawaban.join(",")
          : s.kunci_jawaban?.jawaban || "";
      } else if (s.tipe_soal === "pgk_kategori_bs" || s.tipe_soal === "pgk_kategori_sesuai") {
        (s.opsi_dan_struktur?.pernyataan || []).forEach((t, i) => {
          if (i < 5) ops[i] = t;
        });
        kunciStr = (s.kunci_jawaban?.jawaban || []).join(",");
      } else if (s.tipe_soal === "menjodohkan") {
        const kiri = s.opsi_dan_struktur?.kiri || [];
        const kanan = s.opsi_dan_struktur?.kanan || [];
        const pas = s.kunci_jawaban?.pasangan || {};
        kiri.forEach((k, i) => {
          if (i < 5) {
            const rObj = kanan.find((r) => r.id === pas[k.id]);
            ops[i] = `${k.teks} :: ${rObj?.teks || ""}`;
          }
        });
        kunciStr = "OTOMATIS";
      } else if (s.tipe_soal === "isian_singkat") {
        kunciStr = (s.kunci_jawaban?.jawaban || []).join(",");
      }

      return [
        esc(s.tingkat_kelas || ""),
        s.tipe_soal,
        esc(s.pertanyaan),
        esc(ops[0]),
        esc(ops[1]),
        esc(ops[2]),
        esc(ops[3]),
        esc(ops[4]),
        esc(kunciStr),
        s.bobot_skor,
        esc(s.pembahasan || "")
      ].join(";");
    });

    CBTUtils.downloadFile("\uFEFF" + [header, ...rows].join("\n"), "ekspor_bank_soal_cbt.csv");
  },

  deleteAllSoalMapel() {
    const mapelId = document.getElementById("filter-mapel-soal").value;
    if (!mapelId || this.soalList.length === 0) return;
    CBTUtils.confirmDialog(
      "Hapus Semua Soal?",
      `Seluruh ${this.soalList.length} soal pada mata pelajaran ini akan dihapus permanen.`,
      async () => {
        await window.SB.from("bank_soal").delete().eq("mapel_id", mapelId);
        CBTUtils.showToast("Semua soal mapel ini berhasil dihapus.", "success");
        await this.loadData();
      },
      "Ya, Kosongkan",
      "bg-red-600 text-white"
    );
  }
};