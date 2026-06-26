// ============================================================================
// publish-status — Checks the latest GitHub Pages build status for the repo
// and returns whether the deployment is ready.
//
// Required env secrets:
//   GITHUB_PAT, GITHUB_OWNER, GITHUB_REPO, CLAY_DOMAIN
// ============================================================================
import { corsHeaders, json, errorJson } from "../_shared/cors.ts";

const GH_API = "https://api.github.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  try {
    const token = Deno.env.get("GITHUB_PAT");
    const owner = Deno.env.get("GITHUB_OWNER") || "ClayBuild";
    const repo  = Deno.env.get("GITHUB_REPO")  || "claybuild.github.io";
    const domain = Deno.env.get("CLAY_DOMAIN") || "claybuild.github.io";
    if (!token) return errorJson("GITHUB_PAT secret not set.", 500);

    // Pages site info includes "status" field: "built" | "building" | "errored" | null
    const siteRes = await fetch(`${GH_API}/repos/${owner}/${repo}/pages`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
    if (!siteRes.ok) {
      const t = await siteRes.text();
      return errorJson(`Pages info failed: ${siteRes.status} ${t}`, 502);
    }
    const site = await siteRes.json();

    // Also fetch the latest build for more detail
    const buildRes = await fetch(`${GH_API}/repos/${owner}/${repo}/pages/builds/latest`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
    let build: any = null;
    if (buildRes.ok) build = await buildRes.json();

    const status = (site.status || (build?.status) || "building") as string;
    const ready = status === "built";

    return json({
      status,
      ready,
      published_url: ready ? `https://${domain}/` : null,
      build_info: build ? {
        commit: build.commit,
        duration: build.duration,
        created_at: build.created_at,
        status: build.status,
      } : null,
    });
  } catch (e) {
    return errorJson(String(e?.message || e), 500);
  }
});
