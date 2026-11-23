// ============================================================================
// INISIALISASI CLIENT SUPABASE GLOBAL (window.SB)
// ============================================================================

(function initSupabaseClient() {
  if (typeof window.supabase === "undefined") {
    console.error("Pustaka @supabase/supabase-js belum dimuat.");
    window.SB = null;
    return;
  }

  if (typeof SUPABASE_CONFIG === "undefined" || !SUPABASE_CONFIG.URL) {
    console.error("Konfigurasi SUPABASE_CONFIG di config.js tidak ditemukan.");
    window.SB = null;
    return;
  }

  const apiKey = SUPABASE_CONFIG.ANON_KEY || SUPABASE_CONFIG.PUBLISHABLE_KEY || "";
  if (!apiKey || SUPABASE_CONFIG.URL.includes("<PROJECT_ID>")) {
    console.warn("SUPABASE_CONFIG di config.js masih menggunakan placeholder atau key kosong.");
  }

  window.SB = window.supabase.createClient(SUPABASE_CONFIG.URL, apiKey);
})();
