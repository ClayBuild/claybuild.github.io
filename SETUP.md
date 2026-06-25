# Clay — Full Setup Guide

This guide takes you from zero to a fully working Clay installation. Follow each section in order.

> **Estimated time**: 30–45 minutes if you already have a Supabase account and an OpenRouter key.

---

## 0. Prerequisites

You will need:

- A **GitHub** account (the repo is `ClayBuild/claybuild.github.io` — you already have access).
- A **Supabase** account (free tier is fine). The Supabase project is already created at:
  - URL: `https://amxmjmlkekpupsngwnfq.supabase.co`
- An **OpenRouter** API key (free). Get one at https://openrouter.ai/keys.
- Node.js 18+ and npm (only needed if you want to use the Supabase CLI locally — you can also do everything from the Supabase dashboard).

---

## 1. Set up GitHub Pages for the Clay repo

The Clay platform itself is hosted at `claybuild.github.io`. The repo `ClayBuild/claybuild.github.io` is a special "user/org Pages" repo — anything pushed to its `main` branch is automatically published to `https://claybuild.github.io/`.

### 1.1 Verify Pages is enabled

1. Go to https://github.com/ClayBuild/claybuild.github.io/settings/pages
2. Under **Build and deployment**:
   - **Source**: `Deploy from a branch`
   - **Branch**: `main` / `(root)`
3. Save.

### 1.2 Verify the PAT has the right scopes

The PAT you were given (`github_pat_YOUR_FINE_GRAINED_PAT…`) is a fine-grained PAT. It needs:

- **Contents**: Read and Write (to push files)
- **Pages**: Read and Write (to trigger builds and check status)
- **Metadata**: Read (automatic, required)

If you ever need to regenerate the PAT, visit https://github.com/settings/tokens?type=beta and create a fine-grained token scoped to the `ClayBuild/claybuild.github.io` repository with the above permissions.

### 1.3 (Later) After we push the code

Once you push the code (Section 6 below), GitHub Pages will automatically build and deploy. The Clay landing page will appear at `https://claybuild.github.io/`.

---

## 2. Run the Supabase schema

1. Open your Supabase dashboard: https://supabase.com/dashboard/project/amxmjmlkekpupsngwnfq/sql/new
2. Open the file `supabase/SCHEMA.sql` from this repo, copy its entire contents, paste into the SQL editor, and click **Run**.

This creates:
- `profiles`, `projects`, `project_assets`, `deployments`, `project_collections`, `project_records` tables.
- Row Level Security policies so each user only sees their own projects.
- A trigger to auto-create a `profiles` row when a user signs up.
- A public Storage bucket called `project-assets` for uploaded logos.

If the run succeeds, you should see "Success. No rows returned." in the editor.

---

## 3. Tell me where to put my OpenRouter API key

The OpenRouter API key must **never** be in the frontend — anyone could read it. Instead, store it as a Supabase Edge Function **secret**.

### 3.1 Set the secret via the Supabase dashboard (easiest)

1. Go to https://supabase.com/dashboard/project/amxmjmlkekpupsngwnfq/settings/functions
2. Under **Edge Function Secrets**, click **Add new secret**.
3. Add each of these:

| Name | Value |
|---|---|
| `OPENROUTER_API_KEY` | `sk-or-v1-…` (your key from https://openrouter.ai/keys) |
| `GITHUB_PAT` | Your fine-grained PAT (see Section 1.2 for how to generate one) |
| `GITHUB_OWNER` | `ClayBuild` |
| `GITHUB_REPO` | `claybuild.github.io` |
| `CLAY_DOMAIN` | `claybuild.github.io` |

### 3.2 (Alternative) Set secrets via the Supabase CLI

If you have the CLI installed:

```bash
supabase login
supabase link --project-ref amxmjmlkekpupsngwnfq

supabase secrets set OPENROUTER_API_KEY=sk-or-v1-...
supabase secrets set GITHUB_PAT=github_pat_YOUR_FINE_GRAINED_PAT
supabase secrets set GITHUB_OWNER=ClayBuild
supabase secrets set GITHUB_REPO=claybuild.github.io
supabase secrets set CLAY_DOMAIN=claybuild.github.io
```

---

## 4. Deploy the 6 Edge Functions

Each function lives in its own folder under `supabase/functions/`. You can deploy them from the Supabase dashboard or the CLI.

### 4.1 Via the Supabase dashboard (recommended for first-time)

For **each** of these 6 functions, do the following:

1. Go to https://supabase.com/dashboard/project/amxmjmlkekpupsngwnfq/functions
2. Click **Deploy a new function** → **Manual deploy**.
3. Set the function name (see table below), and paste the contents of the corresponding `index.ts` file.
4. If the function references `_shared/cors.ts`, also paste the contents of that file at the top of the `index.ts` (replacing the `import` line). The dashboard doesn't support multi-file functions, so you have to inline the shared code.

The 6 functions and their files:

| Function name | Source file |
|---|---|
| `ai-init` | `supabase/functions/ai-init/index.ts` |
| `ai-logo-vision` | `supabase/functions/ai-logo-vision/index.ts` |
| `ai-design-doc` | `supabase/functions/ai-design-doc/index.ts` |
| `ai-generate` | `supabase/functions/ai-generate/index.ts` |
| `publish` | `supabase/functions/publish/index.ts` |
| `publish-status` | `supabase/functions/publish-status/index.ts` |

For the dashboard inline approach, prepend the contents of `_shared/cors.ts` to each `index.ts` and replace the line:

```ts
import { corsHeaders, json, errorJson, callOpenRouter, extractJSON } from "../_shared/cors.ts";
```

with:

```ts
// (paste the contents of _shared/cors.ts here)
```

…and remove the `export` keywords from the helpers (since they're now in the same file).

### 4.2 (Alternative) Via the Supabase CLI (preserves multi-file structure)

```bash
# from the repo root
supabase functions deploy ai-init        --no-verify-jwt
supabase functions deploy ai-logo-vision --no-verify-jwt
supabase functions deploy ai-design-doc  --no-verify-jwt
supabase functions deploy ai-generate    --no-verify-jwt
supabase functions deploy publish        --no-verify-jwt
supabase functions deploy publish-status --no-verify-jwt
```

`--no-verify-jwt` is used because the frontend sends the user's JWT for auth, but some calls (like publish-status polling) might happen without a session. The functions themselves validate the user via RLS when reading/writing the database.

### 4.3 Verify

After deploying, you should see all 6 functions listed at https://supabase.com/dashboard/project/amxmjmlkekpupsngwnfq/functions. Each should show a green "Deployed" status.

---

## 5. Verify Supabase Auth settings

1. Go to https://supabase.com/dashboard/project/amxmjmlkekpupsngwnfq/auth/providers
2. Click **Email**.
3. Make sure **Enable Email provider** is ON.
4. Under **Email confirmations**, make sure **Confirm email** is **OFF**. Clay doesn't send verification emails — users can sign in immediately after signup.
5. Save.

---

## 6. Push this code to the GitHub repo

The code is already in `/home/z/my-project/claybuild.github.io/`. To push it:

```bash
cd /home/z/my-project/claybuild.github.io
git init
git checkout -b main
git add .
git commit -m "Clay: initial release — landing, auth, dashboard, wizard, project view, edge functions, samples, schema"
git remote add origin https://ClayBuild:${GITHUB_PAT}@github.com/ClayBuild/claybuild.github.io.git
git push -u origin main
```

(Replace `${GITHUB_PAT}` with the actual PAT — do not commit the PAT to the repo.)

Within ~60 seconds, GitHub Pages will rebuild and your Clay landing page will be live at `https://claybuild.github.io/`.

> **Note**: This README is part of the repo. The PAT is **not** stored in the repo — it lives only in Supabase Edge Function secrets (set in Section 3.1).

---

## 7. End-to-end test

1. Visit `https://claybuild.github.io/` — you should see the Clay landing page.
2. Click **Get started** → sign up with any email + password (no verification email will be sent).
3. After signup, you'll land on the empty dashboard.
4. Click **New project**.
5. Type an idea like "A small bakery in Brooklyn selling sourdough and pastries."
6. Click Continue. Enter a project name (or skip).
7. Wait ~5 seconds for the AI to generate questions, palettes, and design styles.
8. Answer the questions, pick a palette (or upload a logo), pick a design style.
9. Click **Generate my website**. Wait ~30–60 seconds.
10. You'll be redirected to the project view with a live preview.
11. Click **Publish**, choose a URL slug, confirm.
12. Wait ~45–60 seconds. You'll see the live URL appear.
13. Click the URL — your generated site is live!

If the URL shows a 404 on first visit, do a hard refresh:
- **Windows**: `Ctrl` + `F5` or `Ctrl` + `Shift` + `R`
- **Mac**: `Cmd` + `Shift` + `R`

---

## 8. Troubleshooting

### "OpenRouter 401: Unauthorized"
The `OPENROUTER_API_KEY` secret is missing or invalid. Re-check Section 3.

### "GITHUB_PAT secret not set"
The `GITHUB_PAT` secret is missing. Re-check Section 3.

### Publish fails with "Failed to push …"
- Check that the PAT has **Contents: Write** permission on the `ClayBuild/claybuild.github.io` repo.
- Check that the slug is valid (`/^[a-z0-9][a-z0-9-]{1,40}$/`).
- Check that the slug isn't already used by a folder in the repo (visit https://github.com/ClayBuild/claybuild.github.io/tree/main).

### Pages build never succeeds
- Go to https://github.com/ClayBuild/claybuild.github.io/settings/pages and check the build status.
- Check https://github.com/ClayBuild/claybuild.github.io/actions for any failed workflow runs.

### Generated website looks broken
- Open the browser console on the preview iframe.
- Check that the AI returned valid JSON with `index.html`, `styles.css`, and `script.js` keys.
- The `ai-generate` function uses `poolside/laguna-xs.2:free` — sometimes the model returns prose around the JSON. The `extractJSON` helper should handle this, but if it fails, retry generation.

### User uploads a logo but the preview still shows the default palette
The logo is sent to `ai-logo-vision` (Nemotron VL). If that model is rate-limited or down, the function falls back gracefully but the palette isn't updated. Check the function logs at https://supabase.com/dashboard/project/amxmjmlkekpupsngwnfq/functions/ai-logo-vision/logs.

---

## 9. Maintenance notes

- **Costs**: OpenRouter's free tier has rate limits. If you hit them, the Edge Functions will return a 429 and the frontend will show a friendly error. Upgrade your OpenRouter account or swap model names in the Edge Functions.
- **Model swaps**: To change a model, edit the corresponding Edge Function and redeploy. The three model IDs are:
  - `openai/gpt-oss-120b:free`
  - `nvidia/nemotron-nano-12b-v2-vl:free`
  - `poolside/laguna-xs.2:free`
- **Database backups**: Supabase free tier does daily backups. For production use, consider upgrading.
- **Storage**: Uploaded logos go to the `project-assets` Supabase Storage bucket. Each project gets a folder named after its UUID.

---

## 10. Where the AI prompts live

All three prompts are inlined in the Edge Functions (so they can be edited in one place):

| Prompt | File |
|---|---|
| Init (questions + palettes + styles) | `supabase/functions/ai-init/index.ts` → `INIT_SYSTEM_PROMPT` |
| Logo vision | `supabase/functions/ai-logo-vision/index.ts` → `LOGO_SYSTEM_PROMPT` |
| Design doc + generation prompt | `supabase/functions/ai-design-doc/index.ts` → `DESIGN_DOC_SYSTEM_PROMPT` |
| Website code generation | `supabase/functions/ai-generate/index.ts` → `GENERATE_SYSTEM_PROMPT` |

Plain-text reference copies are also in the `/prompts/` folder for review.

---

You're done. Go ship some websites.
