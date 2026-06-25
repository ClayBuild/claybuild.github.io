// ============================================================================
// CLAY — Frontend Configuration
// ============================================================================
window.CLAY_CONFIG = {
  // ---- Supabase project (anon key is safe to expose; RLS protects data) ----
  SUPABASE_URL: "https://amxmjmlkekpupsngwnfq.supabase.co",
  SUPABASE_ANON_KEY:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFteG1qbWxrZWtwdXBzbmd3bmZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzNjQ1NDEsImV4cCI6MjA5Nzk0MDU0MX0.OrFHZ1BV6oi5GFE1Iv_MKndgjSjnwl8AEr0OIjcCD3g",

  // ---- Edge Function endpoints (Supabase Functions v1) ----
  // Each function is deployed separately; supabase-js calls them via .functions.invoke()
  // We expose names here for clarity.
  EDGE_FUNCTIONS: {
    AI_INIT:        "ai-init",
    AI_LOGO_VISION: "ai-logo-vision",
    AI_DESIGN_DOC:  "ai-design-doc",
    AI_GENERATE:    "ai-generate",
    PUBLISH:        "publish",
    PUBLISH_STATUS: "publish-status",
  },

  // ---- Project constants ----
  GITHUB_REPO_URL: "https://github.com/ClayBuild/claybuild.github.io",
  CLAY_DOMAIN:     "claybuild.github.io",
  PAGES_URL_BASE:  "https://claybuild.github.io",

  // ---- Misc ----
  PASSWORD_MIN_LENGTH: 8,
};

// Helper: build the path to a sample preview site.
window.claySampleUrl = function (style) {
  return `./samples/${style}.html`;
};
window.clayPalettePreviewUrl = function (palette) {
  const p = palette.colors || palette;
  const params = new URLSearchParams({
    bg: p[0], primary: p[1], secondary: p[2], accent: p[3], text: p[4],
  });
  return `./samples/palette-preview.html?${params.toString()}`;
};
