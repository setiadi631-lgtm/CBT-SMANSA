// ============================================================================
// ADMIN SHELL: AUTH GUARD, LOGO SEKOLAH, NAVIGASI 7 MENU & STATE GLOBAL ADMIN
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

    document.getElementById("form-admin-login").addEventListener("submit", (e) => this.handleLogin(e));
    document.getElementById("btn-logout-admin").addEventListener("click", () => this.handleLogout());

    document.querySelectorAll(".nav-btn").forEach((btn) => {
      btn.addEventListener("click", () => this.switchTab(btn.dataset.tab));
    });

    await this.loadSchoolBranding();
    await this.checkSession();
  },

  async loadSchoolBranding() {
    try {
      const { data } = await window.SB.from("identitas_sekolah").select("*").eq("id", 1).maybeSingle();
      if (data) {
        this.cache.sekolah = data;
      }
      this.applyLogosToAdminUI();
    } catch (_) {
      this.applyLogosToAdminUI();
    }
  },

  applyLogosToAdminUI() {
    const sek = this.cache.sekolah || {};
    const logoUrl = sek.logo_sekolah_url || "";
    const namaSekolah = sek.nama_sekolah || "Aplikasi Ujian CBT";

    // 1. Pasang logo di layar Login Admin
    const loginForm = document.getElementById("form-admin-login");
    if (loginForm && loginForm.parentElement) {
      let loginBrand = document.getElementById("admin-login-brand-box");
      if (!loginBrand) {
        loginBrand = document.createElement("div");
        loginBrand.id = "admin-login-brand-box";
        loginBrand.className = "flex flex-col items-center text-center mb-4";
        loginForm.parentElement.insertBefore(loginBrand, loginForm.parentElement.firstChild);
      }
      loginBrand.innerHTML = logoUrl
        ? `<img src="${CBTUtils.escapeHtml(logoUrl)}" alt="Logo Sekolah" class="h-16 w-16 object-contain rounded-xl bg-white p-1.5 border border-slate-200 shadow-sm mb-2" />
           <div class="text-xs font-extrabold uppercase tracking-wide text-blue-800">${CBTUtils.escapeHtml(namaSekolah)}</div>`
        : `<div class="h-14 w-14 rounded-2xl bg-blue-700 text-white flex items-center justify-center font-black text-lg shadow mb-2">CBT</div>
           <div class="text-xs font-extrabold uppercase tracking-wide text-blue-800">${CBTUtils.escapeHtml(namaSekolah)}</div>`;
    }

    // 2. Pasang logo di Sidebar Dasbor Admin
    const sidebarNameEl = document.getElementById("sidebar-school-name");
    if (sidebarNameEl) {
      sidebarNameEl.textContent = namaSekolah;
      const parentBox = sidebarNameEl.parentElement;
      if (parentBox) {
        let sideLogo = document.getElementById("sidebar-school-logo-wrap");
        if (!sideLogo) {
          sideLogo = document.createElement("div");
          sideLogo.id = "sidebar-school-logo-wrap";
          sideLogo.className = "mb-2";
          parentBox.insertBefore(sideLogo, sidebarNameEl);
        }
        sideLogo.innerHTML = logoUrl
          ? `<img src="${CBTUtils.escapeHtml(logoUrl)}" alt="Logo" class="h-11 w-11 object-contain rounded-xl bg-white p-1 border border-slate-700" />`
          : `<div class="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xs">CBT</div>`;
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
      window.SB.from("identitas_sekolah").select("*").eq("id", 1).maybeSingle(),
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