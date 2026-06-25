# Clay

> Build a website by talking to AI. No code, no frameworks, no setup.

Clay is a single platform where non-technical people can use AI to create websites — and get hosting, database, and design in one place. The AI agent interviews the user with simple multiple-choice questions, generates a Vanilla HTML/CSS/JS website, and publishes it to GitHub Pages with one click.

## Architecture

- **Frontend**: Vanilla HTML / CSS / JS (no frameworks). Deployed to GitHub Pages at `claybuild.github.io`.
- **Backend**: Supabase (Auth, Postgres, Storage, Edge Functions).
- **AI**: Three models via OpenRouter:
  - `openai/gpt-oss-120b:free` — questionnaire generation, design doc generation.
  - `nvidia/nemotron-nano-12b-v2-vl:free` — logo image analysis (vision).
  - `poolside/laguna-xs.2:free` — website code generation.
- **Hosting**: GitHub Pages. Each user project publishes to `claybuild.github.io/<slug>/`.

## Repo layout

```
.
├── index.html              # Clay landing page
├── login.html, signup.html # Auth pages
├── dashboard.html          # User's project list
├── new-project.html        # The 6-step wizard (idea → name → questions → brand → style → review → generate)
├── project.html            # Preview + publish view
├── 404.html
├── css/main.css            # Global stylesheet (monochrome "dossier" theme)
├── js/
│   ├── config.js           # Supabase URL + anon key + edge function names
│   ├── supabase.js         # Client init + auth guard + utilities
│   ├── new-project.js      # Wizard logic
│   └── project.js          # Project view + publish flow
├── samples/                # Sample preview sites
│   ├── palette-preview.html   # Standard site, colors injected via URL params
│   ├── minimalism.html
│   ├── brutalism.html
│   ├── swiss.html
│   ├── neumorphism.html
│   └── editorial.html
├── supabase/
│   ├── SCHEMA.sql          # All tables, RLS, triggers, storage bucket
│   └── functions/
│       ├── _shared/cors.ts          # CORS + OpenRouter helper
│       ├── ai-init/index.ts         # GPT OSS 120B → questions, palettes, styles
│       ├── ai-logo-vision/index.ts  # Nemotron VL → logo description + hex codes
│       ├── ai-design-doc/index.ts   # GPT OSS 120B → DESIGN.md + filled generation prompt
│       ├── ai-generate/index.ts     # Laguna XS.2 → JSON of {filename: content}
│       ├── publish/index.ts         # Push files to GitHub + trigger Pages build
│       └── publish-status/index.ts  # Poll Pages build status
├── prompts/                # Plain-text reference copies of the AI prompts
├── assets/
├── .nojekyll               # Critical for GitHub Pages (see comment in file)
└── SETUP.md                # Full setup guide — READ THIS FIRST
```

## Quick start

1. Follow `SETUP.md` end-to-end. It covers:
   - Initializing the GitHub repo + Pages.
   - Running `SCHEMA.sql` in Supabase.
   - Deploying the 6 Edge Functions.
   - Setting secrets (`OPENROUTER_API_KEY`, `GITHUB_PAT`, etc.).
   - Pushing this code to the repo.

2. Visit `https://claybuild.github.io/` and create your first project.

## Where do my secrets go?

| Secret | Where to set |
|---|---|
| `OPENROUTER_API_KEY` | `supabase secrets set OPENROUTER_API_KEY=sk-or-v1-…` |
| `GITHUB_PAT` | `supabase secrets set GITHUB_PAT=github_pat_…` |
| `GITHUB_OWNER` | `supabase secrets set GITHUB_OWNER=ClayBuild` |
| `GITHUB_REPO` | `supabase secrets set GITHUB_REPO=claybuild.github.io` |
| `CLAY_DOMAIN` | `supabase secrets set CLAY_DOMAIN=claybuild.github.io` |

**Never** put any of these in frontend code. The Supabase anon key in `js/config.js` is safe to expose — Row Level Security protects all data.

## License

MIT.
