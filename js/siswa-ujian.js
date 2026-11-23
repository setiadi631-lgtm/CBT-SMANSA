// ============================================================================
// LOGIKA RUANG UJIAN SISWA (ujian.html)
// - Logo Sekolah di Header Ruang Ujian
// - Stimulus Berdampingan (Side-by-Side) dengan Butir Soal
// - Pop-Up Navigasi Nomor Soal
// - Tombol Selesai Ujian Khusus pada Nomor Terakhir
// - 7 Tipe Soal + Autosave Sequential Promise Queue + Proteksi Anti-Curang
// ============================================================================

(function () {
  const rawState = sessionStorage.getItem("cbt_state");
  if (!rawState || !window.SB) {
    window.location.href = "index.html";
    return;
  }

  let parsedState = null;
  try {
    parsedState = JSON.parse(rawState);
  } catch (_) {
    sessionStorage.removeItem("cbt_state");
    window.location.href = "index.html";
    return;
  }

  const stateSesi = parsedState.sesi;
  const stateSiswa = parsedState.siswa;
  const statePaket = parsedState.paket;
  const stateSekolah = parsedState.sekolah || {};
  const stateSoalList = Array.isArray(parsedState.soal_list) ? parsedState.soal_list : [];

  if (!stateSesi || !stateSiswa || !statePaket || stateSoalList.length === 0) {
    sessionStorage.removeItem("cbt_state");
    window.location.href = "index.html";
    return;
  }

  let currentIndex = 0;
  let jawabanMap = stateSesi.jawaban_siswa && typeof stateSesi.jawaban_siswa === "object"
    ? { ...stateSesi.jawaban_siswa }
    : {};
  let sisaDetik = Number(parsedState.sisa_detik || 0);
  let timerInterval = null;
  let ujianSedangBerlangsung = true;
  let lastBlurTime = 0;
  let selectedLeftJodoh = null;

  // Queue Promise berurutan untuk autosave
  let saveQueue = Promise.resolve();
  let debounceTimer = null;

  const HURUF_TETAP = ["A", "B", "C", "D", "E", "F"];
  const WARNA_PASANGAN = [
    { bg: "bg-blue-100", border: "border-blue-500", text: "text-blue-800", badge: "bg-blue-600 text-white" },
    { bg: "bg-emerald-100", border: "border-emerald-500", text: "text-emerald-800", badge: "bg-emerald-600 text-white" },
    { bg: "bg-purple-100", border: "border-purple-500", text: "text-purple-800", badge: "bg-purple-600 text-white" },
    { bg: "bg-amber-100", border: "border-amber-500", text: "text-amber-800", badge: "bg-amber-600 text-white" },
    { bg: "bg-rose-100", border: "border-rose-500", text: "text-rose-800", badge: "bg-rose-600 text-white" },
    { bg: "bg-cyan-100", border: "border-cyan-500", text: "text-cyan-800", badge: "bg-cyan-600 text-white" }
  ];

  // ==========================================================================
  // LOGO SEKOLAH DI HEADER
  // ==========================================================================
  function applyHeaderLogo(logoUrl) {
    const imgEl = document.getElementById("hdr-logo-sekolah");
    const fbEl = document.getElementById("hdr-logo-fallback");
    if (!imgEl || !fbEl) return;

    if (logoUrl) {
      imgEl.onerror = () => {
        imgEl.classList.add("hidden");
        fbEl.classList.remove("hidden");
      };
      imgEl.src = logoUrl;
      imgEl.classList.remove("hidden");
      fbEl.classList.add("hidden");
    } else {
      imgEl.classList.add("hidden");
      fbEl.classList.remove("hidden");
    }
  }

  async function ensureSchoolLogo() {
    if (stateSekolah.logo_sekolah_url) {
      applyHeaderLogo(stateSekolah.logo_sekolah_url);
      return;
    }
    try {
      const { data } = await window.SB
        .from("identitas_sekolah")
        .select("logo_sekolah_url")
        .order("id", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (data?.logo_sekolah_url) {
        applyHeaderLogo(data.logo_sekolah_url);
      }
    } catch (_) {}
  }

  // ==========================================================================
  // INISIALISASI HEADER & TAMPILAN AWAL
  // ==========================================================================
  function initRuangUjian() {
    document.getElementById("hdr-jenis-ujian").textContent = statePaket.jenis_ujian || "UJIAN";
    document.getElementById("hdr-mapel").textContent = `${statePaket.nama_mapel} — ${statePaket.judul_ujian}`;
    document.getElementById("hdr-nama-peserta").textContent = stateSiswa.nama_lengkap;
    document.getElementById("hdr-no-peserta").textContent = stateSiswa.no_peserta;
    document.getElementById("hdr-kelas").textContent = stateSiswa.nama_kelas || "-";
    document.getElementById("val-pelanggaran").textContent = stateSesi.jumlah_pelanggaran || 0;
    document.getElementById("val-batas-pelanggaran").textContent = statePaket.batas_pelanggaran || 3;

    ensureSchoolLogo();

    document.getElementById("btn-prev-soal").onclick = () => pindahSoal(currentIndex - 1);
    document.getElementById("btn-ragu").onclick = toggleRaguRagu;

    // Kontrol Pop-Up Navigasi Nomor Soal
    document.getElementById("btn-buka-nav-soal").onclick = bukaPopupNavSoal;
    document.getElementById("btn-close-nav-soal").onclick = tutupPopupNavSoal;
    document.getElementById("modal-navigasi-soal").onclick = (e) => {
      if (e.target.id === "modal-navigasi-soal") tutupPopupNavSoal();
    };
    document.getElementById("btn-ke-soal-terakhir").onclick = () => {
      tutupPopupNavSoal();
      pindahSoal(stateSoalList.length - 1);
    };

    document.getElementById("stimulus-img").onclick = function () {
      CBTUtils.openZoomModal(this.src);
    };
    document.getElementById("q-gambar").onclick = function () {
      CBTUtils.openZoomModal(this.src);
    };

    if (sisaDetik <= 0) {
      kumpulkanUjianOtomatis("Waktu pengerjaan ujian telah habis.");
      return;
    }

    mulaiTimerUjian();
    renderNavigasiNomor();
    pindahSoal(0);

    // Minta fullscreen jika belum aktif
    if (!document.fullscreenElement) {
      CBTUtils.showModal({
        type: "info",
        title: "Mode Layar Penuh Ujian",
        body: "Klik tombol di bawah untuk mengaktifkan mode layar penuh dan mulai mengerjakan soal.",
        buttons: [
          {
            label: "Mulai Kerjakan (Layar Penuh)",
            kelas: "bg-blue-700 hover:bg-blue-800 text-white",
            aksi: () => {
              CBTUtils.closeModal();
              masukModeFullscreen();
            }
          }
        ]
      });
    }
  }

  // ==========================================================================
  // POP-UP NAVIGASI NOMOR SOAL
  // ==========================================================================
  function bukaPopupNavSoal() {
    renderNavigasiNomor();
    const modal = document.getElementById("modal-navigasi-soal");
    modal.classList.remove("hidden");
    modal.classList.add("flex");
  }

  function tutupPopupNavSoal() {
    const modal = document.getElementById("modal-navigasi-soal");
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  }

  // ==========================================================================
  // TIMER COUNTDOWN (1 DETIK)
  // ==========================================================================
  function mulaiTimerUjian() {
    updateTampilanTimer();
    timerInterval = setInterval(() => {
      sisaDetik--;
      updateTampilanTimer();
      if (sisaDetik <= 0) {
        clearInterval(timerInterval);
        kumpulkanUjianOtomatis("Waktu pengerjaan atau batas akhir ujian telah habis.");
      }
    }, 1000);
  }

  function updateTampilanTimer() {
    const s = Math.max(0, sisaDetik);
    const jam = String(Math.floor(s / 3600)).padStart(2, "0");
    const mnt = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
    const dtk = String(s % 60).padStart(2, "0");
    const box = document.getElementById("timer-box");
    box.textContent = `${jam}:${mnt}:${dtk}`;
    if (s <= 300) {
      box.classList.remove("text-emerald-400");
      box.classList.add("text-red-400", "animate-pulse");
    }
  }

  // ==========================================================================
  // RENDER SOAL & 7 TIPE JAWABAN
  // ==========================================================================
  function labelTipeSoal(tipe) {
    const map = {
      pg: "Pilihan Ganda",
      pgk_mcma: "PG Kompleks (Multi-Jawaban)",
      pgk_kategori_bs: "PG Kompleks Kategori (Benar / Salah)",
      pgk_kategori_sesuai: "PG Kompleks Kategori (Sesuai / Tidak Sesuai)",
      menjodohkan: "Menjodohkan Pasangan",
      isian_singkat: "Isian Singkat",
      uraian: "Uraian"
    };
    return map[tipe] || tipe;
  }

  function getOpsiTerurut(soal) {
    const rawOpsi = soal.opsi_dan_struktur?.opsi || [];
    const orderCodes = stateSesi?.urutan_opsi?.[soal.id];
    if (!Array.isArray(orderCodes) || orderCodes.length === 0) {
      return rawOpsi;
    }
    const byCode = {};
    rawOpsi.forEach((o) => {
      byCode[o.kode] = o;
    });
    const ordered = orderCodes.map((c) => byCode[c]).filter(Boolean);
    rawOpsi.forEach((o) => {
      if (!ordered.find((x) => x.kode === o.kode)) ordered.push(o);
    });
    return ordered;
  }

  function pindahSoal(idx) {
    if (idx < 0 || idx >= stateSoalList.length) return;
    currentIndex = idx;
    selectedLeftJodoh = null;

    const soal = stateSoalList[idx];
    document.getElementById("q-nomor-tampil").textContent = `${idx + 1} dari ${stateSoalList.length}`;
    document.getElementById("q-tipe-label").textContent = labelTipeSoal(soal.tipe_soal);
    document.getElementById("q-pertanyaan").textContent = soal.pertanyaan;

    // Gambar pertanyaan
    const qImg = document.getElementById("q-gambar");
    if (soal.gambar_pertanyaan_url) {
      qImg.src = soal.gambar_pertanyaan_url;
      qImg.classList.remove("hidden");
    } else {
      qImg.classList.add("hidden");
    }

    // Stimulus Berdampingan di Sisi Kiri
    const stimBox = document.getElementById("stimulus-box");
    const soalCol = document.getElementById("soal-col-container");
    if (soal.stimulus) {
      stimBox.classList.remove("hidden");
      soalCol.classList.remove("lg:col-span-12");
      soalCol.classList.add("lg:col-span-7");

      document.getElementById("stimulus-judul").textContent = soal.stimulus.judul || "";
      document.getElementById("stimulus-teks").textContent = soal.stimulus.konten_teks || "";
      const sImg = document.getElementById("stimulus-img");
      if (soal.stimulus.gambar_url) {
        sImg.src = soal.stimulus.gambar_url;
        sImg.classList.remove("hidden");
      } else {
        sImg.classList.add("hidden");
      }
    } else {
      stimBox.classList.add("hidden");
      soalCol.classList.remove("lg:col-span-7");
      soalCol.classList.add("lg:col-span-12");
    }

    // Tombol Navigasi Bawah (Tombol Selesai Ujian hanya di nomor terakhir)
    document.getElementById("btn-prev-soal").disabled = idx === 0;
    const btnNext = document.getElementById("btn-next-soal");
    if (idx === stateSoalList.length - 1) {
      btnNext.textContent = "Selesai & Kumpulkan Ujian ✓";
      btnNext.className = "px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow";
      btnNext.onclick = konfirmasiSelesaiUjian;
    } else {
      btnNext.textContent = "Selanjutnya →";
      btnNext.className = "px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm";
      btnNext.onclick = () => pindahSoal(currentIndex + 1);
    }

    // Status Ragu-Ragu
    const isRagu = Boolean(jawabanMap[soal.id]?.ragu);
    const iconRagu = document.getElementById("icon-ragu");
    iconRagu.className = isRagu
      ? "w-3.5 h-3.5 rounded-sm bg-amber-500 border border-amber-700 inline-block"
      : "w-3.5 h-3.5 rounded-sm border border-amber-600 inline-block";

    renderAreaJawaban(soal);
    renderNavigasiNomor();
  }

  function renderAreaJawaban(soal) {
    const area = document.getElementById("q-jawaban-area");
    const saved = jawabanMap[soal.id]?.jawaban;

    // 1. PILIHAN GANDA (PG)
    if (soal.tipe_soal === "pg") {
      const opsiList = getOpsiTerurut(soal);
      area.innerHTML = `<div class="space-y-2.5">
        ${opsiList
          .map((opt, idx) => {
            const hurufTampil = HURUF_TETAP[idx] || opt.kode;
            const terpilih = saved === opt.kode;
            return `
              <div role="button" tabindex="0" data-kode="${opt.kode}"
                class="pg-opt-btn opt-card cursor-pointer p-3.5 rounded-xl border-2 flex items-start gap-3.5 ${
                  terpilih ? "border-blue-600 bg-blue-50/80 shadow-sm" : "border-slate-200 bg-white hover:border-blue-300"
                }">
                <div class="w-8 h-8 rounded-lg flex items-center justify-center font-extrabold text-sm shrink-0 ${
                  terpilih ? "bg-blue-700 text-white" : "bg-slate-100 text-slate-700"
                }">
                  ${hurufTampil}
                </div>
                <div class="flex-1 pt-1 space-y-2">
                  ${opt.teks ? `<div class="text-sm sm:text-base text-slate-900">${CBTUtils.escapeHtml(opt.teks)}</div>` : ""}
                  ${
                    opt.gambar
                      ? `<img src="${opt.gambar}" class="zoomable-opt-img max-h-40 rounded-lg border bg-white p-1 cursor-zoom-in" />`
                      : ""
                  }
                </div>
              </div>
            `;
          })
          .join("")}
      </div>`;

      area.querySelectorAll(".pg-opt-btn").forEach((el) => {
        el.onclick = () => pilihPG(soal.id, el.dataset.kode);
      });
      area.querySelectorAll(".zoomable-opt-img").forEach((img) => {
        img.onclick = (e) => {
          e.stopPropagation();
          CBTUtils.openZoomModal(img.src);
        };
      });
    }

    // 2. PG KOMPLEKS MULTI-JAWABAN (MCMA)
    else if (soal.tipe_soal === "pgk_mcma") {
      const opsiList = getOpsiTerurut(soal);
      const arrTerpilih = Array.isArray(saved) ? saved : [];
      area.innerHTML = `
        <div class="text-xs font-bold text-blue-700 mb-2.5">Pilih satu atau lebih jawaban yang benar:</div>
        <div class="space-y-2.5">
          ${opsiList
            .map((opt, idx) => {
              const hurufTampil = HURUF_TETAP[idx] || opt.kode;
              const checked = arrTerpilih.includes(opt.kode);
              return `
                <div role="checkbox" aria-checked="${checked}" tabindex="0" data-kode="${opt.kode}"
                  class="mcma-opt-btn opt-card cursor-pointer p-3.5 rounded-xl border-2 flex items-start gap-3.5 ${
                    checked ? "border-emerald-600 bg-emerald-50/70 shadow-sm" : "border-slate-200 bg-white hover:border-emerald-300"
                  }">
                  <div class="w-7 h-7 rounded-lg border-2 flex items-center justify-center font-black text-sm shrink-0 mt-0.5 ${
                    checked ? "bg-emerald-600 border-emerald-600 text-white" : "bg-white border-slate-300 text-transparent"
                  }">
                    &#10003;
                  </div>
                  <div class="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-extrabold text-xs shrink-0 mt-0.5">
                    ${hurufTampil}
                  </div>
                  <div class="flex-1 pt-0.5 space-y-2">
                    ${opt.teks ? `<div class="text-sm sm:text-base text-slate-900">${CBTUtils.escapeHtml(opt.teks)}</div>` : ""}
                    ${
                      opt.gambar
                        ? `<img src="${opt.gambar}" class="zoomable-opt-img max-h-40 rounded-lg border bg-white p-1 cursor-zoom-in" />`
                        : ""
                    }
                  </div>
                </div>
              `;
            })
            .join("")}
        </div>
      `;

      area.querySelectorAll(".mcma-opt-btn").forEach((el) => {
        el.onclick = () => toggleMCMA(soal.id, el.dataset.kode);
      });
      area.querySelectorAll(".zoomable-opt-img").forEach((img) => {
        img.onclick = (e) => {
          e.stopPropagation();
          CBTUtils.openZoomModal(img.src);
        };
      });
    }

    // 3 & 4. PG KOMPLEKS KATEGORI (BENAR/SALAH & SESUAI/TIDAK SESUAI)
    else if (soal.tipe_soal === "pgk_kategori_bs" || soal.tipe_soal === "pgk_kategori_sesuai") {
      const pernyataanList = soal.opsi_dan_struktur?.pernyataan || [];
      const colA = soal.tipe_soal === "pgk_kategori_bs" ? "Benar" : "Sesuai";
      const colB = soal.tipe_soal === "pgk_kategori_bs" ? "Salah" : "Tidak Sesuai";
      const arrJwb = Array.isArray(saved) ? saved : [];

      area.innerHTML = `
        <div class="overflow-x-auto rounded-xl border border-slate-200">
          <table class="w-full text-sm text-left">
            <thead class="bg-slate-100 text-slate-700 text-xs uppercase border-b">
              <tr>
                <th class="p-3">Pernyataan</th>
                <th class="p-3 text-center w-28">${colA}</th>
                <th class="p-3 text-center w-32">${colB}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
              ${pernyataanList
                .map((teks, rowIdx) => {
                  const val = arrJwb[rowIdx] || "";
                  return `
                    <tr class="bg-white">
                      <td class="p-3.5 text-slate-900 font-medium">${CBTUtils.escapeHtml(teks)}</td>
                      <td class="p-3 text-center">
                        <button type="button" data-row="${rowIdx}" data-val="${colA}"
                          class="kat-btn px-3 py-1.5 rounded-lg text-xs font-extrabold border-2 transition ${
                            val === colA
                              ? "bg-blue-700 border-blue-700 text-white"
                              : "bg-white border-slate-300 text-slate-600 hover:border-blue-400"
                          }">
                          ${colA}
                        </button>
                      </td>
                      <td class="p-3 text-center">
                        <button type="button" data-row="${rowIdx}" data-val="${colB}"
                          class="kat-btn px-3 py-1.5 rounded-lg text-xs font-extrabold border-2 transition ${
                            val === colB
                              ? "bg-blue-700 border-blue-700 text-white"
                              : "bg-white border-slate-300 text-slate-600 hover:border-blue-400"
                          }">
                          ${colB}
                        </button>
                      </td>
                    </tr>
                  `;
                })
                .join("")}
            </tbody>
          </table>
        </div>
      `;

      area.querySelectorAll(".kat-btn").forEach((btn) => {
        btn.onclick = () =>
          pilihKategoriRow(soal.id, Number(btn.dataset.row), btn.dataset.val, pernyataanList.length);
      });
    }

    // 5. MENJODOHKAN (KLIK KIRI -> KLIK KANAN)
    else if (soal.tipe_soal === "menjodohkan") {
      const kiriList = soal.opsi_dan_struktur?.kiri || [];
      const kananList = soal.opsi_dan_struktur?.kanan || [];
      const pasanganObj = saved && typeof saved === "object" && !Array.isArray(saved) ? saved : {};

      const pairMetaByLeft = {};
      const pairMetaByRight = {};
      let pairCounter = 0;

      kiriList.forEach((itemKiri) => {
        const rightId = pasanganObj[itemKiri.id];
        if (rightId) {
          const warna = WARNA_PASANGAN[pairCounter % WARNA_PASANGAN.length];
          pairCounter++;
          const rightObj = kananList.find((r) => r.id === rightId);
          const meta = {
            nomor: pairCounter,
            warna,
            leftId: itemKiri.id,
            rightId,
            rightTeks: rightObj?.teks || ""
          };
          pairMetaByLeft[itemKiri.id] = meta;
          pairMetaByRight[rightId] = meta;
        }
      });

      area.innerHTML = `
        <div class="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 mb-3">
          <strong>Cara Menjodohkan:</strong> Klik satu kartu di <strong>Kolom Kiri</strong>, lalu klik pasangannya di <strong>Kolom Kanan</strong>. Klik tombol <strong>&times;</strong> untuk menghapus pasangan.
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-2.5">
            <div class="text-xs font-extrabold uppercase text-slate-500">Kolom Kiri (Premis)</div>
            ${kiriList
              .map((item) => {
                const isSelected = selectedLeftJodoh === item.id;
                const meta = pairMetaByLeft[item.id];
                let cardStyle = "border-slate-200 bg-white hover:border-blue-400";
                if (isSelected) cardStyle = "border-blue-600 bg-blue-50 ring-2 ring-blue-400";
                else if (meta) cardStyle = `${meta.warna.border} ${meta.warna.bg}`;

                return `
                  <div data-left="${item.id}" class="jodoh-kiri-card cursor-pointer p-3.5 rounded-xl border-2 transition space-y-2 ${cardStyle}">
                    <div class="text-sm font-semibold text-slate-900">${CBTUtils.escapeHtml(item.teks)}</div>
                    ${
                      meta
                        ? `
                      <div class="flex items-center justify-between gap-2 pt-1 border-t border-black/10 text-xs">
                        <span class="px-2 py-0.5 rounded font-bold ${meta.warna.badge}">Pasangan #${meta.nomor}</span>
                        <span class="truncate font-medium ${meta.warna.text}">&rarr; ${CBTUtils.escapeHtml(meta.rightTeks)}</span>
                        <button type="button" data-del-left="${item.id}"
                          class="del-jodoh-btn px-2 py-0.5 rounded bg-red-600 text-white font-bold hover:bg-red-700 shrink-0" title="Hapus pasangan">&times;</button>
                      </div>
                    `
                        : isSelected
                        ? `<div class="text-[11px] font-bold text-blue-700">Klik pasangan yang sesuai di kolom kanan...</div>`
                        : ""
                    }
                  </div>
                `;
              })
              .join("")}
          </div>

          <div class="space-y-2.5">
            <div class="text-xs font-extrabold uppercase text-slate-500">Kolom Kanan (Pasangan)</div>
            ${kananList
              .map((item) => {
                const meta = pairMetaByRight[item.id];
                const cardStyle = meta
                  ? `${meta.warna.border} ${meta.warna.bg}`
                  : selectedLeftJodoh
                  ? "border-blue-300 bg-white hover:bg-blue-50/60"
                  : "border-slate-200 bg-white";

                return `
                  <div data-right="${item.id}" class="jodoh-kanan-card cursor-pointer p-3.5 rounded-xl border-2 transition flex items-center justify-between gap-2 ${cardStyle}">
                    <span class="text-sm font-semibold text-slate-900">${CBTUtils.escapeHtml(item.teks)}</span>
                    ${
                      meta
                        ? `<span class="px-2 py-0.5 rounded text-xs font-bold shrink-0 ${meta.warna.badge}">Pasangan #${meta.nomor}</span>`
                        : ""
                    }
                  </div>
                `;
              })
              .join("")}
          </div>
        </div>
      `;

      area.querySelectorAll(".jodoh-kiri-card").forEach((el) => {
        el.onclick = () => klikJodohKiri(el.dataset.left);
      });
      area.querySelectorAll(".jodoh-kanan-card").forEach((el) => {
        el.onclick = () => klikJodohKanan(soal.id, el.dataset.right);
      });
      area.querySelectorAll(".del-jodoh-btn").forEach((btn) => {
        btn.onclick = (e) => {
          e.stopPropagation();
          hapusPasanganJodoh(soal.id, btn.dataset.delLeft);
        };
      });
    }

    // 6. ISIAN SINGKAT
    else if (soal.tipe_soal === "isian_singkat") {
      const val = typeof saved === "string" ? saved : "";
      area.innerHTML = `
        <div class="space-y-2">
          <label class="block text-xs font-bold uppercase text-slate-600">Ketik Jawaban Singkat Anda:</label>
          <input type="text" id="input-isian-singkat" value="${CBTUtils.escapeHtml(val)}"
            placeholder="Tuliskan jawaban singkat di sini..."
            class="w-full max-w-lg px-4 py-3 rounded-xl border-2 border-slate-300 focus:border-blue-600 text-base font-semibold outline-none" />
        </div>
      `;
      document.getElementById("input-isian-singkat").oninput = function () {
        inputTeksJawaban(soal.id, this.value);
      };
    }

    // 7. URAIAN
    else if (soal.tipe_soal === "uraian") {
      const val = typeof saved === "string" ? saved : "";
      area.innerHTML = `
        <div class="space-y-2">
          <label class="block text-xs font-bold uppercase text-slate-600">Tuliskan Jawaban Uraian Lengkap Anda:</label>
          <textarea id="input-uraian-teks" rows="6"
            placeholder="Ketik penjelasan atau langkah penyelesaian Anda di sini..."
            class="w-full p-4 rounded-xl border-2 border-slate-300 focus:border-blue-600 text-sm sm:text-base leading-relaxed outline-none">${CBTUtils.escapeHtml(val)}</textarea>
        </div>
      `;
      document.getElementById("input-uraian-teks").oninput = function () {
        inputTeksJawaban(soal.id, this.value);
      };
    }
  }

  // ==========================================================================
  // INTERAKSI JAWABAN & AUTOSAVE SEQUENTIAL PROMISE QUEUE
  // ==========================================================================
  function pilihPG(soalId, kode) {
    const prevRagu = Boolean(jawabanMap[soalId]?.ragu);
    jawabanMap[soalId] = { jawaban: kode, ragu: prevRagu };
    renderAreaJawaban(stateSoalList[currentIndex]);
    renderNavigasiNomor();
    enqueueAutosave();
  }

  function toggleMCMA(soalId, kode) {
    const prevRagu = Boolean(jawabanMap[soalId]?.ragu);
    const curr = Array.isArray(jawabanMap[soalId]?.jawaban) ? [...jawabanMap[soalId].jawaban] : [];
    const pos = curr.indexOf(kode);
    if (pos >= 0) curr.splice(pos, 1);
    else curr.push(kode);

    jawabanMap[soalId] = { jawaban: curr, ragu: prevRagu };
    renderAreaJawaban(stateSoalList[currentIndex]);
    renderNavigasiNomor();
    enqueueAutosave();
  }

  function pilihKategoriRow(soalId, rowIdx, nilai, totalRows) {
    const prevRagu = Boolean(jawabanMap[soalId]?.ragu);
    const curr = Array.isArray(jawabanMap[soalId]?.jawaban)
      ? [...jawabanMap[soalId].jawaban]
      : Array(totalRows).fill("");
    curr[rowIdx] = nilai;

    jawabanMap[soalId] = { jawaban: curr, ragu: prevRagu };
    renderAreaJawaban(stateSoalList[currentIndex]);
    renderNavigasiNomor();
    enqueueAutosave();
  }

  function klikJodohKiri(leftId) {
    selectedLeftJodoh = selectedLeftJodoh === leftId ? null : leftId;
    renderAreaJawaban(stateSoalList[currentIndex]);
  }

  function klikJodohKanan(soalId, rightId) {
    if (!selectedLeftJodoh) {
      CBTUtils.showToast("Pilih item di Kolom Kiri terlebih dahulu.", "warning");
      return;
    }
    const prevRagu = Boolean(jawabanMap[soalId]?.ragu);
    const curr =
      jawabanMap[soalId]?.jawaban && typeof jawabanMap[soalId].jawaban === "object" && !Array.isArray(jawabanMap[soalId].jawaban)
        ? { ...jawabanMap[soalId].jawaban }
        : {};

    Object.keys(curr).forEach((k) => {
      if (curr[k] === rightId) delete curr[k];
    });
    curr[selectedLeftJodoh] = rightId;
    selectedLeftJodoh = null;

    jawabanMap[soalId] = { jawaban: curr, ragu: prevRagu };
    renderAreaJawaban(stateSoalList[currentIndex]);
    renderNavigasiNomor();
    enqueueAutosave();
  }

  function hapusPasanganJodoh(soalId, leftId) {
    const prevRagu = Boolean(jawabanMap[soalId]?.ragu);
    const curr = { ...(jawabanMap[soalId]?.jawaban || {}) };
    delete curr[leftId];
    jawabanMap[soalId] = { jawaban: curr, ragu: prevRagu };
    renderAreaJawaban(stateSoalList[currentIndex]);
    renderNavigasiNomor();
    enqueueAutosave();
  }

  function inputTeksJawaban(soalId, teks) {
    const prevRagu = Boolean(jawabanMap[soalId]?.ragu);
    jawabanMap[soalId] = { jawaban: teks, ragu: prevRagu };
    renderNavigasiNomor();
    enqueueAutosave(500);
  }

  function toggleRaguRagu() {
    const soal = stateSoalList[currentIndex];
    const curr = jawabanMap[soal.id] || { jawaban: null, ragu: false };
    curr.ragu = !curr.ragu;
    jawabanMap[soal.id] = curr;
    pindahSoal(currentIndex);
    enqueueAutosave();
  }

  function cekApakahSoalTerjawab(soal) {
    const item = jawabanMap[soal.id];
    if (!item || item.jawaban === null || item.jawaban === undefined) return false;
    const j = item.jawaban;
    if (typeof j === "string") return j.trim().length > 0;
    if (Array.isArray(j)) return j.some((x) => x !== "" && x !== null && x !== undefined);
    if (typeof j === "object") return Object.keys(j).length > 0;
    return false;
  }

  function renderNavigasiNomor() {
    let jmlTerjawab = 0;
    let jmlRagu = 0;

    const grid = document.getElementById("grid-nomor-soal");
    grid.innerHTML = stateSoalList
      .map((s, idx) => {
        const terjawab = cekApakahSoalTerjawab(s);
        const ragu = Boolean(jawabanMap[s.id]?.ragu);
        const aktif = idx === currentIndex;

        if (terjawab) jmlTerjawab++;
        if (ragu) jmlRagu++;

        let warna = "bg-slate-100 text-slate-700 border-slate-300";
        if (ragu) warna = "bg-amber-400 text-slate-900 border-amber-500";
        else if (terjawab) warna = "bg-emerald-600 text-white border-emerald-700";

        const ring = aktif ? "ring-2 ring-blue-600 ring-offset-1" : "";
        return `
          <button type="button" data-idx="${idx}"
            class="nav-num-btn h-10 rounded-xl border font-extrabold text-xs transition ${warna} ${ring}">
            ${idx + 1}
          </button>
        `;
      })
      .join("");

    const badgeProgres = document.getElementById("badge-progres-soal");
    if (badgeProgres) {
      badgeProgres.textContent = `${jmlTerjawab}/${stateSoalList.length}`;
    }

    const ringkasanEl = document.getElementById("nav-ringkasan-status");
    if (ringkasanEl) {
      const belum = stateSoalList.length - jmlTerjawab;
      ringkasanEl.textContent = `Dijawab: ${jmlTerjawab} • Ragu: ${jmlRagu} • Belum: ${belum}`;
    }

    grid.querySelectorAll(".nav-num-btn").forEach((btn) => {
      btn.onclick = () => {
        pindahSoal(Number(btn.dataset.idx));
        tutupPopupNavSoal();
      };
    });
  }

  function enqueueAutosave(delayMs = 150) {
    try {
      const st = JSON.parse(sessionStorage.getItem("cbt_state") || "{}");
      if (st.sesi) {
        st.sesi.jawaban_siswa = jawabanMap;
        sessionStorage.setItem("cbt_state", JSON.stringify(st));
      }
    } catch (_) {}

    const statusEl = document.getElementById("q-status-simpan");
    statusEl.textContent = "Menyimpan...";
    statusEl.className = "text-xs text-amber-600 font-semibold";

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const snapshotJawaban = JSON.parse(JSON.stringify(jawabanMap));
      saveQueue = saveQueue
        .then(async () => {
          if (!ujianSedangBerlangsung) return;
          const { data, error } = await window.SB.rpc("simpan_jawaban_sesi", {
            p_sesi_id: stateSesi.id,
            p_jawaban: snapshotJawaban
          });

          if (error) {
            statusEl.textContent = "Gangguan simpan (mencoba ulang)...";
            statusEl.className = "text-xs text-red-600 font-semibold";
            return;
          }

          if (data && data.status === "terkunci") {
            kunciLayarPeserta();
            return;
          }

          statusEl.textContent = "Tersimpan ✓";
          statusEl.className = "text-xs text-emerald-600 font-semibold";
        })
        .catch(() => {
          statusEl.textContent = "Menunggu koneksi...";
          statusEl.className = "text-xs text-red-600 font-semibold";
        });
    }, delayMs);
  }

  // ==========================================================================
  // SELESAI & KUMPULKAN UJIAN
  // ==========================================================================
  function konfirmasiSelesaiUjian() {
    const belumDijawab = stateSoalList.filter((s) => !cekApakahSoalTerjawab(s)).length;
    const pesan =
      belumDijawab > 0
        ? `Masih ada ${belumDijawab} soal yang belum dijawab.\nApakah Anda yakin ingin mengumpulkan ujian sekarang?`
        : "Semua soal telah dijawab.\nApakah Anda yakin ingin mengakhiri dan mengumpulkan ujian sekarang?";

    CBTUtils.confirmDialog(
      "Konfirmasi Kumpulkan Ujian",
      pesan,
      () => kumpulkanUjianOtomatis("Ujian berhasil dikumpulkan."),
      "Ya, Kumpulkan Sekarang",
      "bg-emerald-600 hover:bg-emerald-700 text-white"
    );
  }

  async function kumpulkanUjianOtomatis(alasan) {
    ujianSedangBerlangsung = false;
    clearInterval(timerInterval);
    clearTimeout(debounceTimer);

    CBTUtils.showModal({
      type: "info",
      title: "Menyimpan & Menghitung Nilai...",
      body: "Mohon tunggu sebentar, jawaban Anda sedang diproses ke server."
    });

    try {
      await saveQueue;
      const { data, error } = await window.SB.rpc("selesaikan_ujian", {
        p_sesi_id: stateSesi.id,
        p_jawaban: jawabanMap
      });

      if (error) throw error;

      sessionStorage.removeItem("cbt_state");

      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }

      let pesanHasil = `${alasan}\nTerima kasih telah mengikuti ujian mata pelajaran ${statePaket.nama_mapel}.`;
      const adaUraian = stateSoalList.some((s) => s.tipe_soal === "uraian");

      if (statePaket.tampilkan_nilai && data) {
        pesanHasil += `\n\nSkor Otomatis (PG/Objektif): ${data.nilai_pg ?? 0}`;
        if (adaUraian) {
          pesanHasil += "\n(Nilai akhir final menunggu koreksi soal uraian oleh guru)";
        } else {
          pesanHasil += `\nNilai Akhir: ${data.nilai_akhir ?? 0}`;
        }
      }

      CBTUtils.showModal({
        type: "success",
        title: "Ujian Telah Selesai",
        body: pesanHasil,
        buttons: [
          {
            label: "Kembali ke Login",
            kelas: "bg-blue-700 hover:bg-blue-800 text-white",
            aksi: () => {
              window.location.href = "index.html";
            }
          }
        ]
      });
    } catch (err) {
      CBTUtils.showModal({
        type: "danger",
        title: "Gagal Mengirim Jawaban",
        body: "Periksa koneksi internet Anda lalu coba kirim ulang:\n" + err.message,
        buttons: [
          {
            label: "Coba Kirim Ulang",
            kelas: "bg-blue-700 hover:bg-blue-800 text-white",
            aksi: () => kumpulkanUjianOtomatis(alasan)
          }
        ]
      });
    }
  }

  // ==========================================================================
  // ANTI-KECURANGAN (VISIBILITY, BLUR, FULLSCREEN, SPLIT-SCREEN, COPY/F12)
  // ==========================================================================
  function masukModeFullscreen() {
    const el = document.documentElement;
    if (el.requestFullscreen) {
      el.requestFullscreen().catch(() => {});
    }
  }

  async function laporkanPelanggaran(jenis, keterangan) {
    if (!ujianSedangBerlangsung || !stateSesi) return;

    try {
      const { data } = await window.SB.rpc("catat_pelanggaran", {
        p_sesi_id: stateSesi.id,
        p_jenis: jenis,
        p_keterangan: keterangan
      });

      if (!data || !data.ok) return;

      document.getElementById("val-pelanggaran").textContent = data.jumlah_pelanggaran;

      if (data.terkunci) {
        kunciLayarPeserta();
      } else {
        CBTUtils.showModal({
          type: "warning",
          title: `Peringatan Pelanggaran (${data.jumlah_pelanggaran}/${data.batas_pelanggaran})`,
          body: `${keterangan}.\nJika pelanggaran mencapai batas maksimal (${data.batas_pelanggaran}x), sesi ujian Anda akan terkunci otomatis.`,
          buttons: [
            {
              label: "Saya Mengerti & Kembali ke Ujian",
              kelas: "bg-blue-700 hover:bg-blue-800 text-white",
              aksi: () => {
                CBTUtils.closeModal();
                masukModeFullscreen();
              }
            }
          ]
        });
      }
    } catch (_) {}
  }

  function kunciLayarPeserta() {
    ujianSedangBerlangsung = false;
    clearInterval(timerInterval);
    clearTimeout(debounceTimer);
    sessionStorage.removeItem("cbt_state");

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }

    CBTUtils.showModal({
      type: "danger",
      title: "SESI UJIAN TERKUNCI",
      body: "Sesi Anda telah dikunci otomatis karena melampaui batas toleransi pelanggaran.\nSilakan segera hubungi pengawas ruang untuk membuka kunci sesi Anda, kemudian login kembali.",
      buttons: [
        {
          label: "Kembali ke Halaman Login",
          kelas: "bg-slate-800 hover:bg-slate-900 text-white",
          aksi: () => {
            window.location.href = "index.html";
          }
        }
      ]
    });
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && ujianSedangBerlangsung) {
      lastBlurTime = Date.now();
      laporkanPelanggaran("PINDAH_TAB", "Peserta berpindah tab atau meminimalkan peramban");
    }
  });

  window.addEventListener("blur", () => {
    if (!ujianSedangBerlangsung) return;
    if (Date.now() - lastBlurTime < 1500) return;
    lastBlurTime = Date.now();
    laporkanPelanggaran("KELUAR_FOKUS", "Jendela ujian kehilangan fokus (membuka aplikasi atau jendela lain)");
  });

  document.addEventListener("fullscreenchange", () => {
    if (!document.fullscreenElement && ujianSedangBerlangsung) {
      laporkanPelanggaran("KELUAR_FULLSCREEN", "Peserta keluar dari mode layar penuh (Fullscreen)");
    }
  });

  window.addEventListener("resize", () => {
    if (!ujianSedangBerlangsung) return;
    const activeTag = document.activeElement?.tagName;
    if (activeTag === "INPUT" || activeTag === "TEXTAREA") return;

    const rasioLebar = window.innerWidth / window.screen.width;
    const rasioTinggi = window.innerHeight / window.screen.height;
    if (rasioLebar < 0.72 || rasioTinggi < 0.62) {
      laporkanPelanggaran("SPLIT_SCREEN", "Terdeteksi mode layar terbagi (split-screen) atau ukuran jendela diperkecil");
    }
  });

  ["copy", "cut", "paste", "contextmenu"].forEach((evt) => {
    document.addEventListener(evt, (e) => {
      if (ujianSedangBerlangsung) e.preventDefault();
    });
  });

  document.addEventListener("keydown", (e) => {
    if (!ujianSedangBerlangsung) return;
    const keyUpper = e.key.toUpperCase();
    if (
      e.key === "F12" ||
      (e.ctrlKey && e.shiftKey && ["I", "J", "C"].includes(keyUpper)) ||
      (e.ctrlKey && ["U", "S", "P"].includes(keyUpper))
    ) {
      e.preventDefault();
    }
  });

  initRuangUjian();
})();