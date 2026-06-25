// ============================================================================
// CLAY — Supabase Client + shared utilities
// ============================================================================
// Load order:  config.js → supabase.js → (page-specific js)

// ---- Supabase client (via CDN) ----
// The CDN script tag is included in every HTML page BEFORE this file.
const SUPABASE_URL = window.CLAY_CONFIG.SUPABASE_URL;
const SUPABASE_KEY = window.CLAY_CONFIG.SUPABASE_ANON_KEY;
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
window.supabase = supabase;

// ============================================================================
// AUTH GUARD — redirect to /login.html if not authenticated
// ============================================================================
async function clayRequireAuth() {
  const { data, error } = await supabase.auth.getSession();
  if (!data.session) {
    const here = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `./login.html?next=${here}`;
    return null;
  }
  return data.session;
}

// Redirect to dashboard if already authenticated (for login/signup pages)
async function clayRedirectIfAuthed() {
  const { data } = await supabase.auth.getSession();
  if (data.session) {
    const next = new URLSearchParams(location.search).get("next");
    window.location.href = next || "./dashboard.html";
  }
}

// Sign out
async function claySignOut() {
  await supabase.auth.signOut();
  window.location.href = "./index.html";
}

// ============================================================================
// TOAST NOTIFICATIONS
// ============================================================================
function ensureToastHost() {
  let host = document.querySelector(".toast-host");
  if (!host) {
    host = document.createElement("div");
    host.className = "toast-host";
    document.body.appendChild(host);
  }
  return host;
}
function toast(msg, ms = 3000) {
  const host = ensureToastHost();
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = msg;
  host.appendChild(el);
  setTimeout(() => {
    el.style.opacity = "0";
    el.style.transition = "opacity .3s";
    setTimeout(() => el.remove(), 300);
  }, ms);
}

// ============================================================================
// LOADING SCREEN
// ============================================================================
function showLoadingScreen(label = "Working") {
  let el = document.querySelector(".loading-screen");
  if (!el) {
    el = document.createElement("div");
    el.className = "loading-screen";
    el.innerHTML = `<div class="spinner"></div><div class="label"></div>`;
    document.body.appendChild(el);
  }
  el.querySelector(".label").textContent = label;
  el.style.display = "flex";
  document.body.style.overflow = "hidden";
}
function hideLoadingScreen() {
  const el = document.querySelector(".loading-screen");
  if (el) el.style.display = "none";
  document.body.style.overflow = "";
}
function updateLoadingScreen(label) {
  const el = document.querySelector(".loading-screen");
  if (el) el.querySelector(".label").textContent = label;
}

// ============================================================================
// SLUG UTILITY  — convert a name to a URL-safe slug
// ============================================================================
function claySlugify(s) {
  return String(s || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

// Validate a slug for GitHub folder + URL safety
function clayIsValidSlug(s) {
  return /^[a-z0-9][a-z0-9-]{1,40}$/.test(s);
}

// ============================================================================
// EDGE FUNCTION INVOKER  (wraps supabase.functions.invoke with auth)
// ============================================================================
async function clayInvoke(name, body) {
  const { data: session } = await supabase.auth.getSession();
  const token = session?.session?.access_token;
  const url = `${SUPABASE_URL}/functions/v1/${name}`;
  const headers = {
    "Content-Type": "application/json",
    apikey: SUPABASE_KEY,
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let msg = `Edge function ${name} failed (${res.status})`;
    try { const j = await res.json(); if (j.error) msg = j.error; } catch (_) {}
    throw new Error(msg);
  }
  return res.json();
}

// ============================================================================
// FILE / DATA URL HELPERS
// ============================================================================
function clayFileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

// Extract raw base64 (no data: prefix) and the mime type from a data URL
function clayParseDataUrl(dataUrl) {
  const m = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!m) return { mime: "application/octet-stream", base64: dataUrl };
  return { mime: m[1], base64: m[2] };
}

// Get file extension from mime type
function clayExtFromMime(mime) {
  if (mime === "image/png") return "png";
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/svg+xml") return "svg";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  return "png";
}

// ============================================================================
// BUILD PREVIEW SRCDOC  — render website_files into a single HTML doc for iframe
// ============================================================================
function clayBuildPreviewSrcDoc(files) {
  if (!files || !files["index.html"]) {
    return "<!DOCTYPE html><html><body style='font-family:sans-serif;padding:2rem;color:#666'>No preview available.</body></html>";
  }
  let html = files["index.html"];
  // Inline the CSS into a <style> tag (replace <link rel="stylesheet" href="./styles.css">)
  const css = files["styles.css"] || "";
  if (css) {
    html = html.replace(
      /<link[^>]*href=["']\.\/?styles\.css["'][^>]*>/gi,
      `<style>\n${css}\n</style>`
    );
    // If the link tag wasn't matched, inject the style in <head>
    if (!html.includes("<style>") && html.includes("</head>")) {
      html = html.replace("</head>", `<style>\n${css}\n</style>\n</head>`);
    }
  }
  // Inline the JS at the end of <body>
  const js = files["script.js"] || "";
  if (js) {
    if (html.includes("</body>")) {
      html = html.replace("</body>", `<script>\n${js}\n<\/script>\n</body>`);
    } else {
      html += `<script>\n${js}\n<\/script>`;
    }
  }
  return html;
}

// ============================================================================
// TIME AGO
// ============================================================================
function clayTimeAgo(date) {
  const d = new Date(date);
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  return d.toLocaleDateString();
}

// ============================================================================
// GLOBAL EXPOSE
// ============================================================================
window.clayRequireAuth = clayRequireAuth;
window.clayRedirectIfAuthed = clayRedirectIfAuthed;
window.claySignOut = claySignOut;
window.toast = toast;
window.showLoadingScreen = showLoadingScreen;
window.hideLoadingScreen = hideLoadingScreen;
window.updateLoadingScreen = updateLoadingScreen;
window.claySlugify = claySlugify;
window.clayIsValidSlug = clayIsValidSlug;
window.clayInvoke = clayInvoke;
window.clayFileToBase64 = clayFileToBase64;
window.clayParseDataUrl = clayParseDataUrl;
window.clayExtFromMime = clayExtFromMime;
window.clayBuildPreviewSrcDoc = clayBuildPreviewSrcDoc;
window.clayTimeAgo = clayTimeAgo;
