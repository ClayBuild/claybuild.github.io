// ============================================================================
// publish — Pushes the generated website files into a subfolder of the
// ClayBuild/caybuild.github.io repository and triggers a GitHub Pages build.
//
// Required env secrets:
//   GITHUB_PAT      — fine-grained PAT with Contents:write + Pages:write
//   GITHUB_OWNER    — "ClayBuild"
//   GITHUB_REPO     — "caybuild.github.io"
//   CLAY_DOMAIN     — "caybuild.github.io"  (used to compute the final URL)
// ============================================================================
import { corsHeaders, json, errorJson } from "../_shared/cors.ts";

const GH_API = "https://api.github.com";

async function gh(path: string, init: RequestInit & { token: string }) {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${init.token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (init.body && !headers["Content-Type"]) headers["Content-Type"] = "application/json";
  const res = await fetch(`${GH_API}${path}`, { ...init, headers });
  return res;
}

// PUT a single file to the repo (creates or updates).
async function putFile(
  token: string, owner: string, repo: string, path: string,
  content: string, commitMessage: string, branch: string
): Promise<string> {
  const b64 = btoa(unescape(encodeURIComponent(content)));
  // Check if file exists to get its sha (needed for update)
  const existing = await gh(`/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${branch}`, { method: "GET", token });
  let sha: string | undefined;
  if (existing.ok) {
    const j = await existing.json();
    sha = j.sha;
  }
  const body: any = { message: commitMessage, content: b64, branch };
  if (sha) body.sha = sha;

  const res = await gh(`/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`, {
    method: "PUT",
    token,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Failed to push ${path}: ${res.status} ${t}`);
  }
  const j = await res.json();
  return j.commit?.sha || "";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  try {
    const { slug, files, logo_base64, logo_ext } = await req.json();
    if (!slug || !/^[a-z0-9][a-z0-9-]{1,40}$/.test(slug)) {
      return errorJson("Invalid slug. Use 2-40 chars: lowercase letters, digits, hyphens.", 400);
    }
    if (!files || typeof files !== "object") {
      return errorJson("Missing 'files' object.", 400);
    }

    const token = Deno.env.get("GITHUB_PAT");
    const owner = Deno.env.get("GITHUB_OWNER") || "ClayBuild";
    const repo  = Deno.env.get("GITHUB_REPO")  || "claybuild.github.io";
    const domain = Deno.env.get("CLAY_DOMAIN") || "claybuild.github.io";
    const branch = "main";
    if (!token) return errorJson("GITHUB_PAT secret not set.", 500);

    // 1. Push every file into /<slug>/...
    const commitShaList: string[] = [];
    for (const [fileName, content] of Object.entries(files)) {
      const path = `${slug}/${fileName}`;
      const sha = await putFile(
        token, owner, repo, path,
        String(content),
        `clay: publish ${slug}/${fileName}`,
        branch
      );
      commitShaList.push(sha);
    }

    // 2. Push logo if provided
    if (logo_base64 && logo_ext) {
      const logoPath = `${slug}/logo.${logo_ext}`;
      const b64 = logo_base64.replace(/^data:[^;]+;base64,/, "");
      const existing = await gh(`/repos/${owner}/${repo}/contents/${encodeURIComponent(logoPath)}?ref=${branch}`, { method: "GET", token });
      let sha: string | undefined;
      if (existing.ok) { const j = await existing.json(); sha = j.sha; }
      const body: any = { message: `clay: publish ${slug}/logo`, content: b64, branch };
      if (sha) body.sha = sha;
      const res = await gh(`/repos/${owner}/${repo}/contents/${encodeURIComponent(logoPath)}`, {
        method: "PUT", token, body: JSON.stringify(body),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`Failed to push logo: ${res.status} ${t}`);
      }
    }

    // 3. Trigger a GitHub Pages build
    const triggerRes = await gh(`/repos/${owner}/${repo}/pages/builds`, {
      method: "POST", token,
    });
    // 201 = created, 200 = already running (idempotent)
    if (!triggerRes.ok && triggerRes.status !== 409) {
      const t = await triggerRes.text();
      // Not fatal — Pages auto-rebuilds on push, we just tried to speed it up.
      console.warn(`Pages build trigger returned ${triggerRes.status}: ${t}`);
    }

    return json({
      status: "building",
      slug,
      published_url: `https://${domain}/${slug}/`,
      last_commit: commitShaList[commitShaList.length - 1] || null,
    });
  } catch (e) {
    return errorJson(String(e?.message || e), 500);
  }
});
