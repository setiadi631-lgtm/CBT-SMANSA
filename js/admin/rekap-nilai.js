// ============================================================================
// MENU 7: REKAP NILAI, KOREKSI URAIAN, ANALISIS BUTIR SOAL & EKSPOR CSV
// ============================================================================

window.AdminRekapNilai = {
  rekapList: [],
  analisisList: [],
  activeSubTab: "nilai",

  async mount() {
    const container = document.getElementById("tab-nilai");
    let paketList = window.AdminApp?.cache?.paket || [];

    if (paketList.length === 0 && window.SB) {
      const { data } = await window.SB
        .from("paket_ujian")
        .select("*, mapel(nama_mapel)")
        .order("created_at", { ascending: false });
      if (data) {
        paketList = data;
        if (window.AdminApp?.cache) {
          window.AdminApp.cache.paket = data;
        }
      }
    }

    container.innerHTML = `
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-xl font-extrabold text-slate-900">Rekap Nilai, Koreksi Uraian &amp; Analisis Butir Soal</h2>
          <p class="text-xs text-slate-500">Kelola nilai akhir peserta, koreksi jawaban uraian, dan evaluasi kualitas butir soal.</p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <select id="filter-paket-nilai" class="px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-sm font-bold">
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
          <button type="button" id="btn-recalc-all" class="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold">
            Hitung Ulang Semua
          </button>
          <button type="button" id="btn-ekspor-nilai" class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow">
            Ekspor CSV Nilai
          </button>
        </div>
      </div>

      <!-- Navigasi Sub-Tab -->
      <div class="flex items-center gap-2 border-b border-slate-200 pt-1">
        <button type="button" id="subtab-btn-nilai"
          class="px-4 py-2.5 text-xs font-extrabold border-b-2 border-blue-700 text-blue-700 transition">
          Daftar Nilai &amp; Koreksi Uraian
        </button>
        <button type="button" id="subtab-btn-analisis"
          class="px-4 py-2.5 text-xs font-extrabold border-b-2 border-transparent text-slate-500 hover:text-slate-800 transition">
          Analisis Butir Soal
        </button>
      </div>

      <!-- Konten Sub-Tab 1: Daftar Nilai -->
      <div id="panel-subtab-nilai" class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-slate-50 text-xs uppercase text-slate-500 border-b">
              <tr>
                <th class="p-3.5">No. Peserta</th>
                <th class="p-3.5">Nama &amp; Kelas</th>
                <th class="p-3.5">Status</th>
                <th class="p-3.5">Pelanggaran</th>
                <th class="p-3.5">Nilai PG</th>
                <th class="p-3.5">Nilai Akhir</th>
                <th class="p-3.5 text-right">Aksi &amp; Koreksi</th>
              </tr>
            </thead>
            <tbody id="tbody-nilai" class="divide-y divide-slate-100"></tbody>
          </table>
        </div>
      </div>

      <!-- Konten Sub-Tab 2: Analisis Butir Soal -->
      <div id="panel-subtab-analisis" class="hidden space-y-4">
        <div class="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
          <div id="ringkasan-analisis-box" class="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-600">
            Memuat ringkasan analisis...
          </div>
          <button type="button" id="btn-ekspor-analisis"
            class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow">
            Ekspor CSV Analisis Soal
          </button>
        </div>

        <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead class="bg-slate-50 text-xs uppercase text-slate-500 border-b">
                <tr>
                  <th class="p-3.5 w-14">No.</th>
                  <th class="p-3.5">Butir Soal &amp; Tipe</th>
                  <th class="p-3.5 text-center">Benar / Peserta</th>
                  <th class="p-3.5">Tingkat Kesukaran (P)</th>
                  <th class="p-3.5">Daya Pembeda (D)</th>
                  <th class="p-3.5">Sebaran Jawaban / Pengecoh</th>
                  <th class="p-3.5">Status Butir</th>
                </tr>
              </thead>
              <tbody id="tbody-analisis-soal" class="divide-y divide-slate-100"></tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Modal Koreksi Uraian -->
      <div id="modal-koreksi-uraian" class="fixed inset-0 bg-slate-950/75 z-50 hidden items-center justify-center p-4 no-print">
        <div class="bg-white max-w-2xl w-full rounded-2xl p-6 shadow-2xl max-h-[88vh] overflow-y-auto space-y-4">
          <div class="flex justify-between items-center border-b pb-3">
            <div>
              <h3 class="font-extrabold text-lg text-slate-900">Koreksi Jawaban Uraian Siswa</h3>
              <p id="modal-koreksi-sub" class="text-xs text-slate-500"></p>
            </div>
            <button type="button" id="btn-close-koreksi" class="text-slate-500 hover:text-slate-800 font-bold text-2xl leading-none">&times;</button>
          </div>
          <div id="konten-modal-koreksi" class="space-y-4"></div>
        </div>
      </div>
    `;

    document.getElementById("filter-paket-nilai").addEventListener("change", () => this.loadData());
    document.getElementById("btn-recalc-all").addEventListener("click", () => this.recalculateAll());
    document.getElementById("btn-ekspor-nilai").addEventListener("click", () => this.exportCSV());
    document.getElementById("btn-ekspor-analisis").addEventListener("click", () => this.exportAnalisisCSV());
    document.getElementById("btn-close-koreksi").addEventListener("click", () => this.closeModalKoreksi());

    document.getElementById("subtab-btn-nilai").addEventListener("click", () => this.switchSubTab("nilai"));
    document.getElementById("subtab-btn-analisis").addEventListener("click", () => this.switchSubTab("analisis"));

    await this.loadData();
  },

  switchSubTab(tabName) {
    this.activeSubTab = tabName;
    const btnNilai = document.getElementById("subtab-btn-nilai");
    const btnAnalisis = document.getElementById("subtab-btn-analisis");
    const panelNilai = document.getElementById("panel-subtab-nilai");
    const panelAnalisis = document.getElementById("panel-subtab-analisis");

    if (tabName === "analisis") {
      btnAnalisis.className = "px-4 py-2.5 text-xs font-extrabold border-b-2 border-indigo-700 text-indigo-700 transition";
      btnNilai.className = "px-4 py-2.5 text-xs font-extrabold border-b-2 border-transparent text-slate-500 hover:text-slate-800 transition";
      panelNilai.classList.add("hidden");
      panelAnalisis.classList.remove("hidden");
      this.renderAnalisisButir();
    } else {
      btnNilai.className = "px-4 py-2.5 text-xs font-extrabold border-b-2 border-blue-700 text-blue-700 transition";
      btnAnalisis.className = "px-4 py-2.5 text-xs font-extrabold border-b-2 border-transparent text-slate-500 hover:text-slate-800 transition";
      panelAnalisis.classList.add("hidden");
      panelNilai.classList.remove("hidden");
    }
  },

  async loadData() {
    const paketId = document.getElementById("filter-paket-nilai")?.value;
    const tbody = document.getElementById("tbody-nilai");
    if (!paketId) {
      if (tbody) {
        tbody.innerHTML = '<tr><td colspan="7" class="p-5 text-center text-slate-400">Belum ada paket ujian yang dipilih.</td></tr>';
      }
      return;
    }

    const { data, error } = await window.SB
      .from("sesi_ujian")
      .select("*, siswa(no_peserta, nama_lengkap, kelas(nama_kelas))")
      .eq("paket_id", paketId)
      .order("nilai_akhir", { ascending: false });

    if (error) {
      CBTUtils.showToast("Gagal memuat rekap nilai: " + error.message, "error");
      return;
    }

    this.rekapList = data || [];

    tbody.innerHTML =
      this.rekapList
        .map(
          (r) => `
          <tr>
            <td class="p-3.5 font-mono font-bold">${CBTUtils.escapeHtml(r.siswa?.no_peserta || "-")}</td>
            <td class="p-3.5">
              <div class="font-bold text-slate-900">${CBTUtils.escapeHtml(r.siswa?.nama_lengkap || "-")}</div>
              <div class="text-xs text-slate-500">${CBTUtils.escapeHtml(r.siswa?.kelas?.nama_kelas || "-")}</div>
            </td>
            <td class="p-3.5 text-xs font-bold uppercase">${CBTUtils.escapeHtml(r.status_sesi)}</td>
            <td class="p-3.5 text-xs">${r.jumlah_pelanggaran}x</td>
            <td class="p-3.5 font-semibold text-slate-700">${Number(r.nilai_pg ?? 0).toFixed(2)}</td>
            <td class="p-3.5 font-black text-base text-blue-800">${Number(r.nilai_akhir ?? 0).toFixed(2)}</td>
            <td class="p-3.5 text-right space-x-1.5">
              <button type="button" data-koreksi="${r.id}" class="btn-koreksi px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold">
                Koreksi Uraian
              </button>
              <button type="button" data-recalc="${r.id}" class="btn-recalc-one px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-amber-100 text-slate-700 text-xs font-bold" title="Hitung Ulang Nilai">
                Hitung Ulang
              </button>
            </td>
          </tr>
        `
        )
        .join("") || '<tr><td colspan="7" class="p-5 text-center text-slate-400">Belum ada data sesi ujian pada paket ini.</td></tr>';

    tbody.querySelectorAll(".btn-koreksi").forEach((btn) => {
      btn.onclick = () => this.openKoreksiModal(btn.dataset.koreksi);
    });

    tbody.querySelectorAll(".btn-recalc-one").forEach((btn) => {
      btn.onclick = async () => {
        const { error: rpcErr } = await window.SB.rpc("hitung_ulang_nilai", {
          p_sesi_id: btn.dataset.recalc
        });
        if (rpcErr) CBTUtils.showToast("Gagal hitung ulang: " + rpcErr.message, "error");
        else {
          CBTUtils.showToast("Nilai berhasil dihitung ulang!", "success");
          await this.loadData();
        }
      };
    });

    if (this.activeSubTab === "analisis") {
      await this.renderAnalisisButir();
    }
  },

  async fetchSoalForPaket(paket) {
    const mapelId = paket?.mapel_id;
    if (!mapelId) return [];

    const { data } = await window.SB
      .from("bank_soal")
      .select("*")
      .eq("mapel_id", mapelId)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true });

    const allSoal = (data || []).filter((s) => s.aktif !== false);
    if (Array.isArray(paket?.soal_ids) && paket.soal_ids.length > 0) {
      const soalMap = new Map(allSoal.map((s) => [s.id, s]));
      return paket.soal_ids.map((id) => soalMap.get(id)).filter(Boolean);
    }
    return allSoal;
  },

  extractKunciSoal(soal) {
    let raw = soal.kunci_jawaban;
    if (raw === null || raw === undefined) {
      raw = soal.opsi_dan_struktur?.kunci ?? soal.opsi_dan_struktur?.kunci_jawaban;
    }
    if (raw && typeof raw === "object" && !Array.isArray(raw) && soal.tipe_soal !== "menjodohkan") {
      if ("kunci" in raw) return raw.kunci;
      if ("jawaban" in raw) return raw.jawaban;
    }
    return raw;
  },

  evaluasiSkorButir(soal, rawEntry, uraianMap, sesiId) {
    const jwb =
      rawEntry && typeof rawEntry === "object" && "jawaban" in rawEntry
        ? rawEntry.jawaban
        : rawEntry;

    if (soal.tipe_soal === "uraian") {
      const skor = Number(uraianMap[`${sesiId}_${soal.id}`] ?? 0);
      const maks = Number(soal.bobot_skor || 1);
      return maks > 0 ? Math.min(1, Math.max(0, skor / maks)) : 0;
    }

    if (jwb === null || jwb === undefined || jwb === "") return 0;

    const kunci = this.extractKunciSoal(soal);
    if (kunci === null || kunci === undefined) return 0;

    if (soal.tipe_soal === "pg") {
      return String(jwb).trim().toUpperCase() === String(kunci).trim().toUpperCase() ? 1 : 0;
    }

    if (soal.tipe_soal === "pgk_mcma") {
      if (!Array.isArray(jwb) || !Array.isArray(kunci)) return 0;
      const a = [...new Set(jwb.map((x) => String(x).trim().toUpperCase()))].sort();
      const b = [...new Set(kunci.map((x) => String(x).trim().toUpperCase()))].sort();
      return a.length === b.length && a.every((v, i) => v === b[i]) ? 1 : 0;
    }

    if (soal.tipe_soal === "pgk_kategori_bs" || soal.tipe_soal === "pgk_kategori_sesuai") {
      if (!Array.isArray(jwb) || !Array.isArray(kunci) || kunci.length === 0) return 0;
      const cocok = kunci.every(
        (val, idx) => String(jwb[idx] || "").trim().toLowerCase() === String(val || "").trim().toLowerCase()
      );
      return cocok ? 1 : 0;
    }

    if (soal.tipe_soal === "menjodohkan") {
      if (typeof jwb !== "object" || typeof kunci !== "object") return 0;
      const keys = Object.keys(kunci);
      if (keys.length === 0) return 0;
      const cocok = keys.every((k) => String(jwb[k] || "") === String(kunci[k] || ""));
      return cocok ? 1 : 0;
    }

    if (soal.tipe_soal === "isian_singkat") {
      const ans = String(jwb).trim().toLowerCase();
      if (Array.isArray(kunci)) {
        return kunci.some((k) => String(k).trim().toLowerCase() === ans) ? 1 : 0;
      }
      return ans === String(kunci).trim().toLowerCase() ? 1 : 0;
    }

    return 0;
  },

  async renderAnalisisButir() {
    const tbody = document.getElementById("tbody-analisis-soal");
    const ringkasanBox = document.getElementById("ringkasan-analisis-box");
    const paketId = document.getElementById("filter-paket-nilai")?.value;
    if (!tbody || !paketId) return;

    const paket = (window.AdminApp?.cache?.paket || []).find((p) => p.id === paketId);
    if (!paket?.mapel_id) {
      tbody.innerHTML = '<tr><td colspan="7" class="p-5 text-center text-slate-400">Data mata pelajaran paket tidak ditemukan.</td></tr>';
      return;
    }

    tbody.innerHTML = '<tr><td colspan="7" class="p-5 text-center text-slate-400">Menghitung analisis butir soal...</td></tr>';

    const sesiIds = this.rekapList.map((r) => r.id);
    const [soalList, uraianRes] = await Promise.all([
      this.fetchSoalForPaket(paket),
      sesiIds.length > 0
        ? window.SB.from("jawaban_uraian").select("sesi_id, soal_id, skor").in("sesi_id", sesiIds)
        : Promise.resolve({ data: [] })
    ]);

    const uraianMap = {};
    (uraianRes.data || []).forEach((u) => {
      uraianMap[`${u.sesi_id}_${u.soal_id}`] = u.skor;
    });

    if (soalList.length === 0) {
      this.analisisList = [];
      ringkasanBox.textContent = "Belum ada butir soal pada paket ujian ini.";
      tbody.innerHTML = '<tr><td colspan="7" class="p-5 text-center text-slate-400">Belum ada butir soal untuk dianalisis.</td></tr>';
      return;
    }

    const sortedPeserta = [...this.rekapList].sort(
      (a, b) => Number(b.nilai_akhir ?? 0) - Number(a.nilai_akhir ?? 0)
    );
    const totalPeserta = sortedPeserta.length;
    const rasioKelompok = totalPeserta >= 20 ? 0.27 : 0.5;
    const nKelompok = totalPeserta >= 2 ? Math.max(1, Math.floor(totalPeserta * rasioKelompok)) : 0;
    const kelompokAtas = nKelompok > 0 ? sortedPeserta.slice(0, nKelompok) : [];
    const kelompokBawah = nKelompok > 0 ? sortedPeserta.slice(-nKelompok) : [];

    let jmlLayak = 0;
    let jmlRevisi = 0;
    let jmlDitolak = 0;

    this.analisisList = soalList.map((soal, index) => {
      let totalSkor = 0;
      let jmlBenarPenuh = 0;
      const distOpsi = {};

      sortedPeserta.forEach((sesi) => {
        const rawEntry = sesi.jawaban_siswa ? sesi.jawaban_siswa[soal.id] : null;
        const jwb =
          rawEntry && typeof rawEntry === "object" && "jawaban" in rawEntry
            ? rawEntry.jawaban
            : rawEntry;

        const rasio = this.evaluasiSkorButir(soal, rawEntry, uraianMap, sesi.id);
        totalSkor += rasio;
        if (rasio >= 0.999) jmlBenarPenuh++;

        if (soal.tipe_soal === "pg" && jwb) {
          const kode = String(jwb).trim().toUpperCase();
          distOpsi[kode] = (distOpsi[kode] || 0) + 1;
        } else if (soal.tipe_soal === "pgk_mcma" && Array.isArray(jwb)) {
          jwb.forEach((k) => {
            const kode = String(k).trim().toUpperCase();
            distOpsi[kode] = (distOpsi[kode] || 0) + 1;
          });
        }
      });

      const pVal = totalPeserta > 0 ? totalSkor / totalPeserta : 0;
      let katKesukaran = "Belum Ada Data";
      let badgeKesukaran = "bg-slate-100 text-slate-600";
      if (totalPeserta > 0) {
        if (pVal > 0.7) {
          katKesukaran = "Mudah";
          badgeKesukaran = "bg-sky-100 text-sky-800";
        } else if (pVal >= 0.3) {
          katKesukaran = "Sedang";
          badgeKesukaran = "bg-emerald-100 text-emerald-800";
        } else {
          katKesukaran = "Sukar";
          badgeKesukaran = "bg-amber-100 text-amber-800";
        }
      }

      let dVal = 0;
      let katDaya = "N < 2";
      let badgeDaya = "bg-slate-100 text-slate-600";
      if (nKelompok > 0) {
        const skorAtas = kelompokAtas.reduce(
          (acc, s) => acc + this.evaluasiSkorButir(soal, s.jawaban_siswa?.[soal.id], uraianMap, s.id),
          0
        );
        const skorBawah = kelompokBawah.reduce(
          (acc, s) => acc + this.evaluasiSkorButir(soal, s.jawaban_siswa?.[soal.id], uraianMap, s.id),
          0
        );
        dVal = skorAtas / nKelompok - skorBawah / nKelompok;

        if (dVal >= 0.4) {
          katDaya = "Sangat Baik";
          badgeDaya = "bg-emerald-100 text-emerald-800";
        } else if (dVal >= 0.3) {
          katDaya = "Baik";
          badgeDaya = "bg-blue-100 text-blue-800";
        } else if (dVal >= 0.2) {
          katDaya = "Cukup";
          badgeDaya = "bg-amber-100 text-amber-800";
        } else {
          katDaya = "Jelek";
          badgeDaya = "bg-red-100 text-red-800";
        }
      }

      let statusButir = "Menunggu Peserta";
      let badgeStatus = "bg-slate-100 text-slate-600";
      if (totalPeserta > 0) {
        if (nKelompok === 0) {
          statusButir = "Sampel Terbatas";
          badgeStatus = "bg-slate-100 text-slate-700";
        } else if (dVal >= 0.2 && pVal >= 0.2 && pVal <= 0.85) {
          statusButir = "Layak Digunakan";
          badgeStatus = "bg-emerald-600 text-white";
          jmlLayak++;
        } else if (dVal >= 0.1) {
          statusButir = "Perlu Revisi";
          badgeStatus = "bg-amber-500 text-white";
          jmlRevisi++;
        } else {
          statusButir = "Ditolak / Ganti";
          badgeStatus = "bg-red-600 text-white";
          jmlDitolak++;
        }
      }

      let teksSebaran = "-";
      let htmlSebaran = '<span class="text-xs text-slate-400">-</span>';
      if (totalPeserta > 0 && (soal.tipe_soal === "pg" || soal.tipe_soal === "pgk_mcma")) {
        const opsiArr = soal.opsi_dan_struktur?.opsi || [];
        const kunciRaw = this.extractKunciSoal(soal);
        const kunciSet = Array.isArray(kunciRaw)
          ? kunciRaw.map((x) => String(x).toUpperCase())
          : [String(kunciRaw || "").toUpperCase()];

        const items = opsiArr.map((o) => {
          const kd = String(o.kode || "").toUpperCase();
          const cnt = distOpsi[kd] || 0;
          const pct = Math.round((cnt / totalPeserta) * 100);
          const isKunci = kunciSet.includes(kd);
          return { kd, cnt, pct, isKunci };
        });

        teksSebaran = items.map((it) => `${it.kd}${it.isKunci ? "*" : ""}:${it.cnt}(${it.pct}%)`).join(" | ");
        htmlSebaran = `<div class="flex flex-wrap gap-1">
          ${items
            .map((it) => {
              const cls = it.isKunci
                ? "bg-emerald-100 text-emerald-900 border-emerald-300 font-extrabold"
                : it.pct < 5 && totalPeserta >= 5
                ? "bg-red-50 text-red-700 border-red-200"
                : "bg-slate-100 text-slate-700 border-slate-200";
              return `<span class="px-1.5 py-0.5 rounded border text-[11px] ${cls}">${it.kd}${it.isKunci ? "✓" : ""}: ${it.cnt} (${it.pct}%)</span>`;
            })
            .join("")}
        </div>`;
      } else if (soal.tipe_soal === "uraian" && totalPeserta > 0) {
        const rataSkor = (pVal * Number(soal.bobot_skor || 1)).toFixed(2);
        teksSebaran = `Rata-rata skor: ${rataSkor} / ${soal.bobot_skor}`;
        htmlSebaran = `<span class="text-xs font-semibold text-slate-700">${teksSebaran}</span>`;
      } else if (totalPeserta > 0) {
        const pctBenar = Math.round(pVal * 100);
        teksSebaran = `Tuntas penuh: ${pctBenar}% peserta`;
        htmlSebaran = `<span class="text-xs text-slate-600">${teksSebaran}</span>`;
      }

      return {
        nomor: index + 1,
        tipe_soal: soal.tipe_soal,
        pertanyaan: soal.pertanyaan || "",
        jmlBenarPenuh,
        totalPeserta,
        pVal,
        katKesukaran,
        badgeKesukaran,
        dVal,
        katDaya,
        badgeDaya,
        teksSebaran,
        htmlSebaran,
        statusButir,
        badgeStatus
      };
    });

    ringkasanBox.innerHTML = `
      <span class="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800">Total Peserta: ${totalPeserta}</span>
      <span class="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800">Total Soal: ${soalList.length}</span>
      <span class="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800">Layak: ${jmlLayak}</span>
      <span class="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800">Revisi: ${jmlRevisi}</span>
      <span class="px-2.5 py-1 rounded-lg bg-red-100 text-red-800">Ditolak: ${jmlDitolak}</span>
    `;

    tbody.innerHTML = this.analisisList
      .map(
        (item) => `
        <tr class="align-top">
          <td class="p-3.5 font-mono font-extrabold text-slate-800">${item.nomor}</td>
          <td class="p-3.5 max-w-xs">
            <span class="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-bold uppercase mb-1">
              ${CBTUtils.escapeHtml(item.tipe_soal)}
            </span>
            <div class="text-xs text-slate-800 line-clamp-2">${CBTUtils.escapeHtml(item.pertanyaan)}</div>
          </td>
          <td class="p-3.5 text-center font-bold text-xs text-slate-700">
            ${item.jmlBenarPenuh} / ${item.totalPeserta}
          </td>
          <td class="p-3.5">
            <div class="font-mono font-bold text-xs text-slate-900">${item.pVal.toFixed(2)}</div>
            <span class="inline-block mt-1 px-2 py-0.5 rounded text-[11px] font-bold ${item.badgeKesukaran}">
              ${item.katKesukaran}
            </span>
          </td>
          <td class="p-3.5">
            <div class="font-mono font-bold text-xs text-slate-900">${item.dVal.toFixed(2)}</div>
            <span class="inline-block mt-1 px-2 py-0.5 rounded text-[11px] font-bold ${item.badgeDaya}">
              ${item.katDaya}
            </span>
          </td>
          <td class="p-3.5">${item.htmlSebaran}</td>
          <td class="p-3.5">
            <span class="inline-block px-2.5 py-1 rounded-lg text-[11px] font-extrabold ${item.badgeStatus}">
              ${item.statusButir}
            </span>
          </td>
        </tr>
      `
      )
      .join("");
  },

  exportAnalisisCSV() {
    if (this.analisisList.length === 0) {
      CBTUtils.showToast("Belum ada data analisis butir soal untuk diekspor.", "warning");
      return;
    }

    const header =
      "no_soal;tipe_soal;pertanyaan;benar_penuh;total_peserta;indeks_kesukaran_P;kategori_kesukaran;daya_pembeda_D;kategori_daya_pembeda;sebaran_jawaban;status_butir";
    const rows = this.analisisList.map((item) =>
      [
        item.nomor,
        `"${item.tipe_soal}"`,
        `"${item.pertanyaan.replace(/\r?\n/g, " ").replace(/"/g, '""')}"`,
        item.jmlBenarPenuh,
        item.totalPeserta,
        item.pVal.toFixed(2),
        `"${item.katKesukaran}"`,
        item.dVal.toFixed(2),
        `"${item.katDaya}"`,
        `"${item.teksSebaran.replace(/"/g, '""')}"`,
        `"${item.statusButir}"`
      ].join(";")
    );

    CBTUtils.downloadFile("\uFEFF" + [header, ...rows].join("\n"), "analisis_butir_soal_cbt.csv");
  },

  async recalculateAll() {
    if (this.rekapList.length === 0) return;
    CBTUtils.showToast("Menghitung ulang seluruh nilai peserta...", "info");
    for (const sesi of this.rekapList) {
      await window.SB.rpc("hitung_ulang_nilai", { p_sesi_id: sesi.id });
    }
    CBTUtils.showToast("Semua nilai berhasil diperbarui!", "success");
    await this.loadData();
  },

  async openKoreksiModal(sesiId) {
    const sesi = this.rekapList.find((r) => r.id === sesiId);
    if (!sesi) return;

    const paket = (window.AdminApp?.cache?.paket || []).find((p) => p.id === sesi.paket_id);
    if (!paket?.mapel_id) return;

    const [allPaketSoal, uraianRes] = await Promise.all([
      this.fetchSoalForPaket(paket),
      window.SB.from("jawaban_uraian").select("*").eq("sesi_id", sesiId)
    ]);

    const soalUraian = allPaketSoal
      .map((s, idx) => ({ ...s, _noTampil: idx + 1 }))
      .filter((s) => s.tipe_soal === "uraian");

    const existingUraianMap = {};
    (uraianRes.data || []).forEach((u) => {
      existingUraianMap[u.soal_id] = u;
    });

    document.getElementById("modal-koreksi-sub").textContent =
      `Peserta: ${sesi.siswa?.nama_lengkap || "-"} (${sesi.siswa?.no_peserta || "-"})`;

    const konten = document.getElementById("konten-modal-koreksi");

    if (soalUraian.length === 0) {
      konten.innerHTML =
        '<p class="text-sm text-slate-600 p-4 rounded-xl bg-slate-50 border">Paket ujian ini tidak memiliki soal bertipe <strong>Uraian</strong>. Seluruh skor telah dihitung otomatis.</p>';
    } else {
      konten.innerHTML = `
        <div class="space-y-4">
          ${soalUraian
            .map((s, idx) => {
              const rawEntry = sesi.jawaban_siswa ? sesi.jawaban_siswa[s.id] : null;
              const jwbTeks =
                rawEntry && typeof rawEntry === "object" && "jawaban" in rawEntry
                  ? rawEntry.jawaban
                  : rawEntry || "(Tidak dijawab)";
              const savedKor = existingUraianMap[s.id] || {};

              return `
                <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5" data-soal-id="${s.id}">
                  <div class="flex items-center justify-between">
                    <span class="font-extrabold text-sm text-slate-900">Soal Uraian #${idx + 1} (Urutan Soal #${s._noTampil})</span>
                    <span class="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-xs font-bold">Bobot Maks: ${s.bobot_skor}</span>
                  </div>
                  <p class="text-xs text-slate-700 whitespace-pre-line">${CBTUtils.escapeHtml(s.pertanyaan)}</p>
                  ${
                    s.pembahasan
                      ? `<div class="text-[11px] text-emerald-800 bg-emerald-50 px-2.5 py-1.5 rounded border border-emerald-200"><strong>Rubrik:</strong> ${CBTUtils.escapeHtml(s.pembahasan)}</div>`
                      : ""
                  }
                  <div>
                    <div class="text-[11px] font-bold uppercase text-slate-500 mb-1">Jawaban Peserta:</div>
                    <div class="p-3 rounded-lg bg-white border text-sm text-slate-900 whitespace-pre-line">${CBTUtils.escapeHtml(jwbTeks || "(Kosong)")}</div>
                  </div>
                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                    <div>
                      <label class="block text-[11px] font-bold text-slate-600 mb-1">Skor (0 - ${s.bobot_skor})</label>
                      <input type="number" step="0.5" min="0" max="${s.bobot_skor}" value="${savedKor.skor ?? 0}"
                        class="inp-skor-uraian w-full px-3 py-1.5 rounded-lg border border-slate-300 text-sm font-bold bg-white" />
                    </div>
                    <div class="sm:col-span-2">
                      <label class="block text-[11px] font-bold text-slate-600 mb-1">Catatan Koreksi (Opsional)</label>
                      <input type="text" value="${CBTUtils.escapeHtml(savedKor.catatan_koreksi || "")}" placeholder="Catatan guru..."
                        class="inp-catatan-uraian w-full px-3 py-1.5 rounded-lg border border-slate-300 text-sm bg-white" />
                    </div>
                  </div>
                </div>
              `;
            })
            .join("")}
        </div>
        <button type="button" id="btn-simpan-semua-uraian"
          class="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow">
          Simpan Koreksi &amp; Hitung Ulang Nilai Akhir
        </button>
      `;

      document.getElementById("btn-simpan-semua-uraian").onclick = async () => {
        const cards = Array.from(konten.querySelectorAll("[data-soal-id]"));
        const korektor = window.AdminApp?.user?.email || "Admin";

        for (const card of cards) {
          const soalId = card.dataset.soalId;
          const skor = parseFloat(card.querySelector(".inp-skor-uraian").value) || 0;
          const catatan = card.querySelector(".inp-catatan-uraian").value.trim();

          const { error } = await window.SB.rpc("simpan_koreksi_uraian", {
            p_sesi_id: sesiId,
            p_soal_id: soalId,
            p_skor: skor,
            p_catatan: catatan,
            p_oleh: korektor
          });

          if (error) {
            CBTUtils.showToast("Gagal menyimpan koreksi: " + error.message, "error");
            return;
          }
        }

        await window.SB.rpc("hitung_ulang_nilai", { p_sesi_id: sesiId });
        CBTUtils.showToast("Koreksi uraian disimpan & nilai akhir diperbarui!", "success");
        this.closeModalKoreksi();
        await this.loadData();
      };
    }

    const modal = document.getElementById("modal-koreksi-uraian");
    modal.classList.remove("hidden");
    modal.classList.add("flex");
  },

  closeModalKoreksi() {
    const modal = document.getElementById("modal-koreksi-uraian");
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  },

  exportCSV() {
    if (this.rekapList.length === 0) {
      CBTUtils.showToast("Belum ada data nilai untuk diekspor.", "warning");
      return;
    }

    const header = "no_peserta;nama_lengkap;kelas;status_sesi;jumlah_pelanggaran;nilai_pg;nilai_akhir";
    const rows = this.rekapList.map((r) =>
      [
        `"${r.siswa?.no_peserta || ""}"`,
        `"${(r.siswa?.nama_lengkap || "").replace(/"/g, '""')}"`,
        `"${r.siswa?.kelas?.nama_kelas || ""}"`,
        r.status_sesi,
        r.jumlah_pelanggaran,
        Number(r.nilai_pg ?? 0).toFixed(2),
        Number(r.nilai_akhir ?? 0).toFixed(2)
      ].join(";")
    );

    CBTUtils.downloadFile("\uFEFF" + [header, ...rows].join("\n"), "rekap_nilai_cbt.csv");
  }
};