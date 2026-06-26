// ============================================================================
// CLAY — Supabase Client + shared utilities
// ============================================================================
// Load order:  config.js → supabase.js → (page-specific js)
//
// NOTE: The Supabase CDN exposes `window.supabase` (the library namespace with
// createClient). We wrap in an IIFE so our local `const supabase` (the client
// instance) is function-scoped and doesn't conflict with the CDN global. We
// then overwrite `window.supabase` with the client instance so that all other
// scripts can continue to use `supabase.from(...)`, `supabase.auth...` etc.
// ============================================================================

(function () {
  const SUPABASE_URL = window.CLAY_CONFIG.SUPABASE_URL;
  const SUPABASE_KEY = window.CLAY_CONFIG.SUPABASE_ANON_KEY;

  // Create the client using the CDN's createClient, then replace the namespace.
  const _ns = window.supabase;
  const supabase = _ns.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  window.supabase = supabase;

  // ========================================================================
  // AUTH GUARD
  // ========================================================================
  async function clayRequireAuth() {
    const { data, error } = await supabase.auth.getSession();
    if (!data.session) {
      const here = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `./login.html?next=${here}`;
      return null;
    }
    return data.session;
  }

  async function clayRedirectIfAuthed() {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      const next = new URLSearchParams(location.search).get("next");
      window.location.href = next || "./dashboard.html";
    }
  }

  async function claySignOut() {
    await supabase.auth.signOut();
    window.location.href = "./index.html";
  }

  // ========================================================================
  // TOAST NOTIFICATIONS
  // ========================================================================
  function ensureToastHost() {
    let host = document.querySelector(".toast-host");
    if (!host) {
      host = document.createElement("div");
      host.className = "toast-host";
      document.body.appendChild(host);
    }
    return host;
  }
  function toast(msg, ms) {
    ms = ms || 3000;
    const host = ensureToastHost();
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = msg;
    host.appendChild(el);
    setTimeout(function () {
      el.style.opacity = "0";
      el.style.transition = "opacity .3s";
      setTimeout(function () { el.remove(); }, 300);
    }, ms);
  }

  // ========================================================================
  // LOADING SCREEN
  // ========================================================================
  function showLoadingScreen(label) {
    label = label || "Working";
    let el = document.querySelector(".loading-screen");
    if (!el) {
      el = document.createElement("div");
      el.className = "loading-screen";
      el.innerHTML = '<div class="spinner"></div><div class="label"></div>';
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

  // ========================================================================
  // SLUG UTILITY
  // ========================================================================
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
  function clayIsValidSlug(s) {
    return /^[a-z0-9][a-z0-9-]{1,40}$/.test(s);
  }

  // ========================================================================
  // EDGE FUNCTION INVOKER
  // ========================================================================
  async function clayInvoke(name, body) {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData && sessionData.session ? sessionData.session.access_token : null;
    const url = SUPABASE_URL + "/functions/v1/" + name;
    const headers = {
      "Content-Type": "application/json",
      apikey: SUPABASE_KEY,
    };
    if (token) headers["Authorization"] = "Bearer " + token;
    const res = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      let msg = "Edge function " + name + " failed (" + res.status + ")";
      try { const j = await res.json(); if (j.error) msg = j.error; } catch (_) {}
      throw new Error(msg);
    }
    return res.json();
  }

  // ========================================================================
  // FILE / DATA URL HELPERS
  // ========================================================================
  function clayFileToBase64(file) {
    return new Promise(function (resolve, reject) {
      const r = new FileReader();
      r.onload = function () { resolve(r.result); };
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  }
  function clayParseDataUrl(dataUrl) {
    const m = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
    if (!m) return { mime: "application/octet-stream", base64: dataUrl };
    return { mime: m[1], base64: m[2] };
  }
  function clayExtFromMime(mime) {
    if (mime === "image/png") return "png";
    if (mime === "image/jpeg") return "jpg";
    if (mime === "image/svg+xml") return "svg";
    if (mime === "image/webp") return "webp";
    if (mime === "image/gif") return "gif";
    return "png";
  }

  // ========================================================================
  // BUILD PREVIEW SRCDOC
  // ========================================================================
  function clayBuildPreviewSrcDoc(files) {
    if (!files || !files["index.html"]) {
      return "<!DOCTYPE html><html><body style='font-family:sans-serif;padding:2rem;color:#666'>No preview available.</body></html>";
    }
    let html = files["index.html"];
    const css = files["styles.css"] || "";
    if (css) {
      html = html.replace(
        /<link[^>]*href=["']\.\/?styles\.css["'][^>]*>/gi,
        "<style>\n" + css + "\n</style>"
      );
      if (!html.includes("<style>") && html.includes("</head>")) {
        html = html.replace("</head>", "<style>\n" + css + "\n</style>\n</head>");
      }
    }
    const js = files["script.js"] || "";
    if (js) {
      if (html.includes("</body>")) {
        html = html.replace("</body>", "<script>\n" + js + "\n<\/script>\n</body>");
      } else {
        html += "<script>\n" + js + "\n<\/script>";
      }
    }
    return html;
  }

  // ========================================================================
  // TIME AGO
  // ========================================================================
  function clayTimeAgo(date) {
    const d = new Date(date);
    const sec = Math.floor((Date.now() - d.getTime()) / 1000);
    if (sec < 60) return "just now";
    const min = Math.floor(sec / 60);
    if (min < 60) return min + "m ago";
    const hr = Math.floor(min / 60);
    if (hr < 24) return hr + "h ago";
    const day = Math.floor(hr / 24);
    if (day < 30) return day + "d ago";
    return d.toLocaleDateString();
  }

  // ========================================================================
  // GLOBAL EXPOSE
  // ========================================================================
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
})();
