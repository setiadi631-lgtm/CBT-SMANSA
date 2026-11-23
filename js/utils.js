// ============================================================================
// UTILITAS BERSAMA: MODAL INTERNAL, TOAST, HASH SHA-256, CSV & STORAGE
// ============================================================================

window.CBTUtils = {
  escapeHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  },

  formatWaktuIndo(isoStr) {
    if (!isoStr) return "Tidak dibatasi";
    const d = new Date(isoStr);
    if (Number.isNaN(d.getTime())) return "-";
    return (
      d.toLocaleString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }) + " WIB"
    );
  },

  toLocalDatetimeInput(isoStr) {
    if (!isoStr) return "";
    const d = new Date(isoStr);
    if (Number.isNaN(d.getTime())) return "";
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
  },

  // Toast Notification (auto-hilang 3 detik)
  showToast(message, type = "info") {
    let container = document.getElementById("cbt-toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "cbt-toast-container";
      container.className = "fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0 no-print";
      document.body.appendChild(container);
    }

    const palette = {
      success: "bg-emerald-700 text-white border-emerald-800",
      error: "bg-red-700 text-white border-red-800",
      warning: "bg-amber-500 text-slate-950 border-amber-600",
      info: "bg-slate-900 text-white border-slate-700"
    };

    const el = document.createElement("div");
    el.className = `toast-item pointer-events-auto px-4 py-3 rounded-xl shadow-lg border text-xs sm:text-sm font-semibold flex items-center justify-between gap-3 ${palette[type] || palette.info}`;
    el.innerHTML = `<span>${this.escapeHtml(message)}</span>`;
    container.appendChild(el);

    setTimeout(() => {
      el.style.opacity = "0";
      el.style.transition = "opacity 0.25s ease";
      setTimeout(() => el.remove(), 260);
    }, 3000);
  },

  // Modal Internal (pengganti alert / confirm)
  showModal({ type = "info", title = "", body = "", buttons = [] }) {
    let modal = document.getElementById("internal-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "internal-modal";
      modal.className = "fixed inset-0 bg-slate-950/75 z-50 hidden items-center justify-center p-4 no-print";
      modal.innerHTML = `
        <div class="bg-white max-w-md w-full rounded-2xl p-6 shadow-2xl space-y-4 text-center">
          <div id="modal-icon" class="w-12 h-12 rounded-full mx-auto flex items-center justify-center font-black text-xl"></div>
          <h3 id="modal-title" class="text-lg font-extrabold text-slate-900"></h3>
          <p id="modal-body" class="text-sm text-slate-600 leading-relaxed whitespace-pre-line"></p>
          <div id="modal-actions" class="pt-2 flex flex-wrap items-center justify-center gap-3"></div>
        </div>
      `;
      document.body.appendChild(modal);
    }

    const styles = {
      info: { bg: "bg-blue-100 text-blue-700", sym: "i" },
      warning: { bg: "bg-amber-100 text-amber-700", sym: "!" },
      danger: { bg: "bg-red-100 text-red-700", sym: "&#10005;" },
      success: { bg: "bg-emerald-100 text-emerald-700", sym: "&#10003;" },
      confirm: { bg: "bg-blue-100 text-blue-700", sym: "?" }
    };
    const st = styles[type] || styles.info;

    const icon = document.getElementById("modal-icon");
    icon.className = `w-12 h-12 rounded-full mx-auto flex items-center justify-center font-black text-xl ${st.bg}`;
    icon.innerHTML = st.sym;

    document.getElementById("modal-title").textContent = title;
    document.getElementById("modal-body").textContent = body;

    const actBox = document.getElementById("modal-actions");
    actBox.innerHTML = "";

    const btnList =
      buttons.length > 0
        ? buttons
        : [{ label: "Tutup", kelas: "bg-blue-700 hover:bg-blue-800 text-white", aksi: () => this.closeModal() }];

    btnList.forEach((b) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = b.label;
      btn.className = `px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition ${b.kelas}`;
      btn.onclick = () => {
        if (typeof b.aksi === "function") b.aksi();
        else this.closeModal();
      };
      actBox.appendChild(btn);
    });

    modal.classList.remove("hidden");
    modal.classList.add("flex");
  },

  closeModal() {
    const modal = document.getElementById("internal-modal");
    if (modal) {
      modal.classList.add("hidden");
      modal.classList.remove("flex");
    }
  },

  confirmDialog(title, body, onConfirm, confirmLabel = "Ya, Lanjutkan", confirmClass = "bg-blue-700 hover:bg-blue-800 text-white") {
    this.showModal({
      type: "confirm",
      title,
      body,
      buttons: [
        {
          label: "Batal",
          kelas: "bg-slate-200 hover:bg-slate-300 text-slate-800",
          aksi: () => this.closeModal()
        },
        {
          label: confirmLabel,
          kelas: confirmClass,
          aksi: () => {
            this.closeModal();
            if (typeof onConfirm === "function") onConfirm();
          }
        }
      ]
    });
  },

  openZoomModal(src) {
    let zm = document.getElementById("zoom-modal");
    if (!zm) {
      zm = document.createElement("div");
      zm.id = "zoom-modal";
      zm.className = "fixed inset-0 bg-black/85 z-50 hidden items-center justify-center p-4 cursor-zoom-out no-print";
      zm.onclick = () => this.closeZoomModal();
      zm.innerHTML = `<img id="zoom-img-target" class="max-w-full max-h-[90vh] rounded-xl shadow-2xl" />`;
      document.body.appendChild(zm);
    }
    document.getElementById("zoom-img-target").src = src;
    zm.classList.remove("hidden");
    zm.classList.add("flex");
  },

  closeZoomModal() {
    const zm = document.getElementById("zoom-modal");
    if (zm) {
      zm.classList.add("hidden");
      zm.classList.remove("flex");
    }
  },

  // Generate Token 6 Karakter (A-Z, 2-9 tanpa huruf/angka membingungkan)
  generateToken(length = 6) {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let result = "";
    const array = new Uint32Array(length);
    window.crypto.getRandomValues(array);
    for (let i = 0; i < length; i++) {
      result += chars.charAt(array[i] % chars.length);
    }
    return result;
  },

  // Hitung SHA-256 Hex di Browser (selalu UPPERCASE TRIM sebelum hash)
  async sha256Hex(plainText) {
    const normalized = String(plainText ?? "").trim().toUpperCase();
    const encoder = new TextEncoder();
    const data = encoder.encode(normalized);
    const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  },

  // Parser Baris CSV (mendukung tanda kutip & pemisah titik koma / koma)
  parseCSVLine(line, delimiter = ";") {
    const result = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === delimiter && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  },

  downloadFile(content, filename, mime = "text/csv;charset=utf-8") {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },

  // Unggah Gambar ke Supabase Storage Bucket 'gambar-soal'
  async uploadImageToBucket(file, folder = "umum") {
    if (!window.SB) throw new Error("Koneksi Supabase belum siap.");
    if (!file) throw new Error("Tidak ada file gambar yang dipilih.");
    const ext = (file.name.split(".").pop() || "png").toLowerCase();
    const safeName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;

    const { error } = await window.SB.storage
      .from("gambar-soal")
      .upload(safeName, file, { cacheControl: "3600", upsert: false });

    if (error) throw error;

    const { data } = window.SB.storage.from("gambar-soal").getPublicUrl(safeName);
    return data.publicUrl;
  }
};
