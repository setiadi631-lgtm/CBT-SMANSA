// ============================================================================
// MENU 2: CRUD MATA PELAJARAN (mapel)
// ============================================================================

window.AdminMapel = {
  list: [],

  async mount() {
    const container = document.getElementById("tab-mapel");
    container.innerHTML = `
      <div>
        <h2 class="text-xl font-extrabold text-slate-900">Data Mata Pelajaran</h2>
        <p class="text-xs text-slate-500">Kelola daftar mata pelajaran yang digunakan pada Bank Soal dan Jadwal Ujian.</p>
      </div>

      <form id="form-mapel" class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <input type="hidden" id="mapel-id" />
        <div>
          <label class="block text-xs font-bold text-slate-600 mb-1">Kode Mata Pelajaran</label>
          <input type="text" id="mapel-kode" required placeholder="Contoh: MTK-W"
            class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono font-bold uppercase" />
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-600 mb-1">Nama Mata Pelajaran</label>
          <input type="text" id="mapel-nama" required placeholder="Contoh: Matematika Wajib"
            class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold" />
        </div>
        <div class="flex gap-2">
          <button type="submit" id="btn-save-mapel" class="px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm">
            Simpan Mapel
          </button>
          <button type="button" id="btn-reset-mapel" class="px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-sm">
            Reset
          </button>
        </div>
      </form>

      <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-slate-50 text-xs uppercase text-slate-500 border-b">
              <tr>
                <th class="p-3.5 w-40">Kode Mapel</th>
                <th class="p-3.5">Nama Mata Pelajaran</th>
                <th class="p-3.5 text-right w-40">Aksi</th>
              </tr>
            </thead>
            <tbody id="tbody-mapel" class="divide-y divide-slate-100"></tbody>
          </table>
        </div>
      </div>
    `;

    document.getElementById("form-mapel").addEventListener("submit", (e) => this.handleSave(e));
    document.getElementById("btn-reset-mapel").addEventListener("click", () => this.resetForm());
    await this.loadData();
  },

  resetForm() {
    document.getElementById("form-mapel").reset();
    document.getElementById("mapel-id").value = "";
  },

  async loadData() {
    const { data, error } = await window.SB.from("mapel").select("*").order("nama_mapel", { ascending: true });
    if (error) {
      CBTUtils.showToast("Gagal memuat mata pelajaran: " + error.message, "error");
      return;
    }
    this.list = data || [];
    window.AdminApp.cache.mapel = this.list;

    const tbody = document.getElementById("tbody-mapel");
    tbody.innerHTML =
      this.list
        .map(
          (m) => `
          <tr>
            <td class="p-3.5 font-mono font-bold text-blue-800">${CBTUtils.escapeHtml(m.kode_mapel || "-")}</td>
            <td class="p-3.5 font-semibold text-slate-900">${CBTUtils.escapeHtml(m.nama_mapel)}</td>
            <td class="p-3.5 text-right space-x-2">
              <button type="button" data-edit="${m.id}" class="btn-edit-mapel text-blue-600 hover:underline font-bold text-xs">Edit</button>
              <button type="button" data-del="${m.id}" class="btn-del-mapel text-red-600 hover:underline font-bold text-xs">Hapus</button>
            </td>
          </tr>
        `
        )
        .join("") || '<tr><td colspan="3" class="p-5 text-center text-slate-400">Belum ada data mata pelajaran.</td></tr>';

    tbody.querySelectorAll(".btn-edit-mapel").forEach((btn) => {
      btn.onclick = () => {
        const item = this.list.find((x) => x.id === btn.dataset.edit);
        if (!item) return;
        document.getElementById("mapel-id").value = item.id;
        document.getElementById("mapel-kode").value = item.kode_mapel || "";
        document.getElementById("mapel-nama").value = item.nama_mapel;
      };
    });

    tbody.querySelectorAll(".btn-del-mapel").forEach((btn) => {
      btn.onclick = () => {
        CBTUtils.confirmDialog(
          "Hapus Mata Pelajaran?",
          "Menghapus mata pelajaran juga akan menghapus bank soal dan paket ujian yang terkait.",
          async () => {
            const { error: delErr } = await window.SB.from("mapel").delete().eq("id", btn.dataset.del);
            if (delErr) CBTUtils.showToast("Gagal menghapus: " + delErr.message, "error");
            else {
              CBTUtils.showToast("Mata pelajaran dihapus.", "success");
              await this.loadData();
            }
          },
          "Ya, Hapus",
          "bg-red-600 hover:bg-red-700 text-white"
        );
      };
    });
  },

  async handleSave(e) {
    e.preventDefault();
    const id = document.getElementById("mapel-id").value;
    const payload = {
      kode_mapel: document.getElementById("mapel-kode").value.trim().toUpperCase(),
      nama_mapel: document.getElementById("mapel-nama").value.trim()
    };

    const res = id
      ? await window.SB.from("mapel").update(payload).eq("id", id)
      : await window.SB.from("mapel").insert(payload);

    if (res.error) {
      CBTUtils.showToast("Gagal menyimpan mapel: " + res.error.message, "error");
    } else {
      CBTUtils.showToast("Mata pelajaran berhasil disimpan!", "success");
      this.resetForm();
      await this.loadData();
    }
  }
};
