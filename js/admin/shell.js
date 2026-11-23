// ============================================================================
// ADMIN SHELL: AUTH GUARD, LOGO SEKOLAH, SIDEBAR TETAP & NAVIGASI 7 MENU
// ============================================================================

window.AdminApp = {
  user: null,
  cache: {
    sekolah: null,
    mapel: [],
    kelas: [],
    paket: []
  },

  async init() {
    const loginErr = document.getElementById("admin-login-err");
    if (!window.SB) {
      loginErr.textContent = "Konfigurasi Supabase (config.js) belum terbaca.";
      loginErr.classList.remove("hidden");
      return;
    }

    this.removeStaticCbtBadges();
    this.applyFixedSidebarLayout();

    document.getElementById("form-admin-login").addEventListener("submit", (e) => this.handleLogin(e));
    document.getElementById("btn-logout-admin").addEventListener("click", () => this.handleLogout());

    document.querySelectorAll(".nav-btn").forEach((btn) => {
      btn.addEventListener("click", () => this.switchTab(btn.dataset.tab));
    });

    await this.loadSchoolBranding();
    await this.checkSession();
  },

  applyFixedSidebarLayout() {
    const dash = document.getElementById("admin-dashboard");
    if (!dash) return;

    dash.classList.add("md:h-screen", "md:overflow-hidden");

    Array.from(dash.children).forEach((child) => {
      if (child.querySelector(".nav-btn")) {
        child.classList.add("md:h-screen", "md:sticky", "md:top-0", "md:overflow-y-auto", "md:shrink-0");
      } else if (child.tagName === "MAIN" || child.querySelector(".tab-section")) {
        child.classList.add("flex-1", "md:h-screen", "md:overflow-y-auto");
        child.dataset.adminScrollArea = "1";
      }
    });
  },

  removeStaticCbtBadges() {
    ["login-logo-fallback", "konf-logo-fallback", "hdr-logo-fallback", "admin-logo-fallback"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.remove();
    });

    ["admin-login-screen", "admin-dashboard"].forEach((rootId) => {
      const root = document.getElementById(rootId);
      if (!root) return;
      root.querySelectorAll("div, span").forEach((el) => {
        if (el.id === "sidebar-school-name" || el.id === "sidebar-admin-email") return;
        const txt = el.textContent.trim();
        const isSmallBadge = /\b(w-8|w-9|w-10|w-11|w-12|w-14|w-16|h-8|h-9|h-10|h-11|h-12|h-14|h-16)\b/.test(
          el.className || ""
        );
        if (isSmallBadge && /^CBT(\s*(ONLINE|ADMIN|SEKOLAH))?$/i.test(txt)) {
          el.remove();
        }
      });
    });
  },

  async loadSchoolBranding() {
    try {
      const { data } = await window.SB
        .from("identitas_sekolah")
        .select("*")
        .order("id", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (data) {
        this.cache.sekolah = data;
      }
      this.applyLogosToAdminUI();
    } catch (_) {
      this.applyLogosToAdminUI();
    }
  },

  applyLogosToAdminUI() {
    this.removeStaticCbtBadges();

    const sek = this.cache.sekolah || {};
    const logoUrl = sek.logo_sekolah_url || "";
    const namaSekolah = sek.nama_sekolah || "Aplikasi Ujian";

    // Kop Logo & Nama Sekolah di Layar Login Admin
    const loginForm = document.getElementById("form-admin-login");
    if (loginForm && loginForm.parentElement) {
      let loginBrand = document.getElementById("admin-login-brand-box");
      if (!loginBrand) {
        loginBrand = document.createElement("div");
        loginBrand.id = "admin-login-brand-box";
        loginBrand.className = "flex flex-col items-center text-center mb-4";
        loginForm.parentElement.insertBefore(loginBrand, loginForm.parentElement.firstChild);
      }
      loginBrand.innerHTML = `
        ${
          logoUrl
            ? `<img src="${CBTUtils.escapeHtml(logoUrl)}" alt="Logo Sekolah" onerror="this.classList.add('hidden')" class="h-16 w-16 object-contain rounded-xl bg-white p-1.5 border border-slate-200 shadow-sm mb-2" />`
            : ""
        }
        <div class="text-xs font-extrabold uppercase tracking-wide text-blue-800">${CBTUtils.escapeHtml(namaSekolah)}</div>
      `;
    }

    // Logo & Nama Sekolah di Sidebar Dasbor Admin
    const sidebarNameEl = document.getElementById("sidebar-school-name");
    if (sidebarNameEl) {
      sidebarNameEl.textContent = namaSekolah;
      const parentBox = sidebarNameEl.parentElement;
      if (parentBox) {
        let sideLogo = document.getElementById("sidebar-school-logo-wrap");
        if (!sideLogo) {
          sideLogo = document.createElement("div");
          sideLogo.id = "sidebar-school-logo-wrap";
          parentBox.insertBefore(sideLogo, sidebarNameEl);
        }
        if (logoUrl) {
          sideLogo.className = "mb-2";
          sideLogo.innerHTML = `<img src="${CBTUtils.escapeHtml(logoUrl)}" alt="Logo Sekolah" onerror="this.parentElement.classList.add('hidden')" class="h-11 w-11 object-contain rounded-xl bg-white p-1 border border-slate-700" />`;
        } else {
          sideLogo.className = "hidden";
          sideLogo.innerHTML = "";
        }
      }
    }
  },

  async checkSession() {
    try {
      const {
        data: { session }
      } = await window.SB.auth.getSession();
      if (session && session.user) {
        this.user = session.user;
        document.getElementById("admin-login-screen").classList.add("hidden");
        const dash = document.getElementById("admin-dashboard");
        dash.classList.remove("hidden");
        dash.classList.add("flex");
        this.applyFixedSidebarLayout();
        document.getElementById("sidebar-admin-email").textContent = session.user.email || "";

        await this.loadSharedMasterData();
        this.switchTab("pengawas");
      }
    } catch (err) {
      const loginErr = document.getElementById("admin-login-err");
      loginErr.textContent = "Gagal memeriksa sesi admin: " + err.message;
      loginErr.classList.remove("hidden");
    }
  },

  async handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById("admin-email").value.trim();
    const password = document.getElementById("admin-password").value;
    const errEl = document.getElementById("admin-login-err");
    const btn = document.getElementById("btn-admin-login");

    errEl.classList.add("hidden");
    btn.disabled = true;
    btn.textContent = "Memverifikasi Akun...";

    try {
      const { error } = await window.SB.auth.signInWithPassword({ email, password });
      if (error) {
        errEl.textContent = "Login gagal: " + error.message;
        errEl.classList.remove("hidden");
        btn.disabled = false;
        btn.textContent = "Masuk ke Dashboard";
        return;
      }
      await this.checkSession();
    } catch (err) {
      errEl.textContent = "Gangguan koneksi: " + err.message;
      errEl.classList.remove("hidden");
      btn.disabled = false;
      btn.textContent = "Masuk ke Dashboard";
    }
  },

  async handleLogout() {
    await window.SB.auth.signOut();
    window.location.reload();
  },

  async loadSharedMasterData() {
    const [sekRes, mapelRes, kelasRes, paketRes] = await Promise.all([
      window.SB.from("identitas_sekolah").select("*").order("id", { ascending: true }).limit(1).maybeSingle(),
      window.SB.from("mapel").select("*").order("nama_mapel", { ascending: true }),
      window.SB.from("kelas").select("*").order("tingkat", { ascending: true }).order("nama_kelas", { ascending: true }),
      window.SB.from("paket_ujian").select("*, mapel(nama_mapel, kode_mapel)").order("created_at", { ascending: false })
    ]);

    this.cache.sekolah = sekRes.data || {};
    this.cache.mapel = mapelRes.data || [];
    this.cache.kelas = kelasRes.data || [];
    this.cache.paket = paketRes.data || [];

    this.applyLogosToAdminUI();
  },

  async switchTab(tabName) {
    document.querySelectorAll(".tab-section").forEach((el) => el.classList.add("hidden"));
    const target = document.getElementById("tab-" + tabName);
    if (target) target.classList.remove("hidden");

    const scrollArea = document.querySelector('[data-admin-scroll-area="1"]') || document.querySelector("#admin-dashboard > main");
    if (scrollArea) scrollArea.scrollTop = 0;

    document.querySelectorAll(".nav-btn").forEach((btn) => {
      if (btn.dataset.tab === tabName) {
        btn.classList.add("bg-blue-700", "text-white");
        btn.classList.remove("text-slate-300");
      } else {
        btn.classList.remove("bg-blue-700", "text-white");
        btn.classList.add("text-slate-300");
      }
    });

    const handlers = {
      sekolah: () => window.AdminSekolah?.mount(),
      mapel: () => window.AdminMapel?.mount(),
      kelas: () => window.AdminKelas?.mount(),
      soal: () => window.AdminBankSoal?.mount(),
      pengawas: () => window.AdminPengawas?.mount(),
      ujian: () => window.AdminKelolaUjian?.mount(),
      nilai: () => window.AdminRekapNilai?.mount()
    };

    if (handlers[tabName]) {
      await handlers[tabName]();
    }
  }
};

document.addEventListener("DOMContentLoaded", () => {
  window.AdminApp.init();
});