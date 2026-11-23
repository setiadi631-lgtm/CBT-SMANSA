// ============================================================================
// MENU 5: RUANG PENGAWAS (MONITORING LIVE, LOG PELANGGARAN, BUKA KUNCI & RESET)
// ============================================================================

window.AdminPengawas = {
  autoRefreshTimer: null,

  async mount() {
    clearInterval(this.autoRefreshTimer);
    const container = document.getElementById("tab-pengawas");
    const paketList = window.AdminApp.cache.paket || [];

    container.innerHTML = `
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-xl font-extrabold text-slate-900">Ruang Pengawas &amp; Pantauan Langsung</h2>
          <p class="text-xs text-slate-500">Pantau progres pengerjaan peserta, log pelanggaran, buka kunci sesi, dan reset sesi.</p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <select id="filter-paket-pengawas" class="px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-sm font-bold">
            ${
              paketList.length > 0
                ? paketList
                    .map(
                      (p) =>
                        `<option value="${p.id}">[${CBTUtils.escapeHtml(p.jenis_ujian)}] ${CBTUtils.escapeHtml(p.mapel?.nama_mapel || "")} — ${CBTUtils.escapeHtml(p.judul_ujian)}</option>`
                    )
                    .join("")
                : '<option value="">-- Belum ada paket ujian --</option>'
            }
          </select>
          <button type="button" id="btn-refresh-pengawas" class="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-sm font-bold">
            Muat Ulang
          </button>
        </div>
      </div>

      <!-- 4 Kartu Statistik -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div class="text-xs text-slate-500 font-semibold">Total Peserta Masuk</div>
          <div id="stat-total-sesi" class="text-2xl font-black text-slate-900 mt-1">0</div>
        </div>
        <div class="bg-white p-4 rounded-2xl border border-blue-200 shadow-sm">
          <div class="text-xs text-blue-600 font-semibold">Sedang Mengerjakan</div>
          <div id="stat-mengerjakan" class="text-2xl font-black text-blue-700 mt-1">0</div>
        </div>
        <div class="bg-white p-4 rounded-2xl border border-emerald-200 shadow-sm">
          <div class="text-xs text-emerald-600 font-semibold">Sudah Selesai</div>
          <div id="stat-selesai" class="text-2xl font-black text-emerald-700 mt-1">0</div>
        </div>
        <div class="bg-white p-4 rounded-2xl border border-red-200 shadow-sm">
          <div class="text-xs text-red-600 font-semibold">Terkunci Pelanggaran</div>
          <div id="stat-terkunci" class="text-2xl font-black text-red-600 mt-1">0</div>
        </div>
      </div>

      <!-- Tabel Progres Peserta -->
      <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div class="px-5 py-3 bg-slate-50 border-b font-bold text-sm text-slate-700">
          Daftar Sesi Peserta pada Paket Terpilih
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-slate-50 text-xs uppercase text-slate-500 border-b">
              <tr>
                <th class="p-3">Peserta</th>
                <th class="p-3">Progres Jawaban</th>
                <th class="p-3">Pelanggaran</th>
                <th class="p-3">Status Sesi</th>
                <th class="p-3 text-right">Tindakan Pengawas</th>
              </tr>
            </thead>
            <tbody id="tbody-pengawas" class="divide-y divide-slate-100"></tbody>
          </table>
        </div>
      </div>

      <!-- Log Pelanggaran Terbaru -->
      <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div class="px-5 py-3 bg-red-50 border-b border-red-100 font-bold text-sm text-red-800">
          Log Pelanggaran Peserta (Paket Terpilih)
        </div>
        <div id="list-log-pelanggaran" class="divide-y divide-slate-100 max-h-72 overflow-y-auto p-3 text-xs"></div>
      </div>
    `;

    document.getElementById("filter-paket-pengawas").addEventListener("change", () => this.loadData());
    document.getElementById("btn-refresh-pengawas").addEventListener("click", () => this.loadData());

    await this.loadData();

    // Auto refresh ringan setiap 15 detik selama tab pengawas terbuka
    this.autoRefreshTimer = setInterval(() => {
      const sec = document.getElementById("tab-pengawas");
      if (sec && !sec.classList.contains("hidden")) {
        this.loadData();
      }
    }, 15000);
  },

  countAnswered(jawabanObj) {
    if (!jawabanObj || typeof jawabanObj !== "object") return 0;
    let count = 0;
    Object.values(jawabanObj).forEach((entry) => {
      const val = entry && typeof entry === "object" && "jawaban" in entry ? entry.jawaban : entry;
      if (val === null || val === undefined) return;
      if (typeof val === "string" && val.trim().length > 0) count++;
      else if (Array.isArray(val) && val.some((x) => x !== "" && x !== null)) count++;
      else if (typeof val === "object" && !Array.isArray(val) && Object.keys(val).length > 0) count++;
    });
    return count;
  },

  async loadData() {
    const paketId = document.getElementById("filter-paket-pengawas")?.value;
    if (!paketId) return;

    const { data: sesiList, error } = await window.SB
      .from("sesi_ujian")
      .select("*, siswa(no_peserta, nama_lengkap, kelas(nama_kelas))")
      .eq("paket_id", paketId)
      .order("mulai_at", { ascending: false });

    if (error) {
      CBTUtils.showToast("Gagal memuat pantauan: " + error.message, "error");
      return;
    }

    const rows = sesiList || [];
    document.getElementById("stat-total-sesi").textContent = rows.length;
    document.getElementById("stat-mengerjakan").textContent = rows.filter((r) => r.status_sesi === "mengerjakan").length;
    document.getElementById("stat-selesai").textContent = rows.filter((r) => r.status_sesi === "selesai").length;
    document.getElementById("stat-terkunci").textContent = rows.filter((r) => r.status_sesi === "terkunci").length;

    const tbody = document.getElementById("tbody-pengawas");
    tbody.innerHTML =
      rows
        .map((r) => {
          const jmlJwb = this.countAnswered(r.jawaban_siswa);
          const totSoal = Array.isArray(r.urutan_soal) ? r.urutan_soal.length : 0;

          let badge = '<span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">Mengerjakan</span>';
          if (r.status_sesi === "selesai") {
            badge = '<span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">Selesai</span>';
          } else if (r.status_sesi === "terkunci") {
            badge = '<span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 animate-pulse">TERKUNCI</span>';
          }

          return `
            <tr>
              <td class="p-3">
                <div class="font-bold text-slate-900">${CBTUtils.escapeHtml(r.siswa?.nama_lengkap || "-")}</div>
                <div class="text-xs text-slate-500 font-mono">${CBTUtils.escapeHtml(r.siswa?.no_peserta || "-")} &bull; ${CBTUtils.escapeHtml(r.siswa?.kelas?.nama_kelas || "-")}</div>
              </td>
              <td class="p-3 font-semibold">${jmlJwb} / ${totSoal} soal</td>
              <td class="p-3">
                <span class="font-bold ${r.jumlah_pelanggaran > 0 ? "text-red-600" : "text-slate-600"}">${r.jumlah_pelanggaran}x</span>
              </td>
              <td class="p-3">${badge}</td>
              <td class="p-3 text-right space-x-1.5">
                ${
                  r.status_sesi === "terkunci"
                    ? `<button type="button" data-unlock="${r.id}" class="btn-unlock px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold">Buka Kunci</button>`
                    : ""
                }
                <button type="button" data-reset="${r.id}" class="btn-reset-sesi px-3 py-1 rounded-lg bg-slate-200 hover:bg-red-600 text-slate-700 hover:text-white text-xs font-bold transition">
                  Reset Sesi
                </button>
              </td>
            </tr>
          `;
        })
        .join("") || '<tr><td colspan="5" class="p-5 text-center text-slate-400">Belum ada peserta masuk pada paket ujian ini.</td></tr>';

    tbody.querySelectorAll(".btn-unlock").forEach((btn) => {
      btn.onclick = async () => {
        const { error: rpcErr } = await window.SB.rpc("buka_kunci_sesi", {
          p_sesi_id: btn.dataset.unlock
        });
        if (rpcErr) CBTUtils.showToast("Gagal membuka kunci: " + rpcErr.message, "error");
        else {
          CBTUtils.showToast("Sesi peserta berhasil dibuka kuncinya!", "success");
          await this.loadData();
        }
      };
    });

    tbody.querySelectorAll(".btn-reset-sesi").forEach((btn) => {
      btn.onclick = () => {
        CBTUtils.confirmDialog(
          "Reset Sesi Ujian Siswa?",
          "Jawaban dan riwayat sesi peserta ini akan dihapus sehingga peserta dapat login ulang dari awal.",
          async () => {
            const { error: delErr } = await window.SB.from("sesi_ujian").delete().eq("id", btn.dataset.reset);
            if (delErr) CBTUtils.showToast("Gagal mereset sesi: " + delErr.message, "error");
            else {
              CBTUtils.showToast("Sesi peserta berhasil direset.", "success");
              await this.loadData();
            }
          },
          "Ya, Reset Sesi",
          "bg-red-600 text-white"
        );
      };
    });

    // Muat log pelanggaran khusus sesi-sesi di paket ini
    const sesiIds = rows.map((r) => r.id);
    const logBox = document.getElementById("list-log-pelanggaran");

    if (sesiIds.length === 0) {
      logBox.innerHTML = '<p class="text-slate-400 text-center py-3">Belum ada catatan pelanggaran.</p>';
      return;
    }

    const { data: logs } = await window.SB
      .from("log_pelanggaran")
      .select("*, sesi_ujian(siswa(nama_lengkap, no_peserta, kelas(nama_kelas)))")
      .in("sesi_id", sesiIds)
      .order("waktu_kejadian", { ascending: false })
      .limit(30);

    logBox.innerHTML =
      (logs || [])
        .map(
          (l) => `
          <div class="py-2 flex items-start justify-between gap-2">
            <div>
              <span class="font-bold text-red-700">[${CBTUtils.escapeHtml(l.jenis)}]</span>
              <span class="font-semibold text-slate-800">${CBTUtils.escapeHtml(l.sesi_ujian?.siswa?.nama_lengkap || "-")} (${CBTUtils.escapeHtml(l.sesi_ujian?.siswa?.kelas?.nama_kelas || "-")})</span>
              <span class="text-slate-500">&mdash; ${CBTUtils.escapeHtml(l.keterangan || "")}</span>
            </div>
            <span class="text-slate-400 shrink-0">${new Date(l.waktu_kejadian).toLocaleTimeString("id-ID")}</span>
          </div>
        `
        )
        .join("") || '<p class="text-slate-400 text-center py-3">Belum ada catatan pelanggaran.</p>';
  }
};
