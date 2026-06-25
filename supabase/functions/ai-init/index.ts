// ============================================================================
// ai-init — Generates questionnaire questions, color palettes, and design style
// suggestions for a new project, based on the user's business idea.
// Uses: openai/gpt-oss-120b:free via OpenRouter.
// ============================================================================
import { corsHeaders, json, errorJson, callOpenRouter, extractJSON } from "../_shared/cors.ts";

const INIT_SYSTEM_PROMPT = `You are Clay, an AI helping a non-technical user build their first website. Based on their business idea, generate a questionnaire and design suggestions.

Output ONLY valid JSON. No markdown, no prose, no code fences. Use this exact shape:

{"name":"string","tagline":"string","questions":[{"id":"snake_case","question":"string","help_text":"string","options":["str","str","str"],"default":"str","multi_select":false}],"color_palettes":[{"name":"string","colors":["#bg","#primary","#secondary","#accent","#text"]}],"design_styles":["str","str","str"]}

RULES:

== NAME GENERATION ==
The "name" field must be a CREATIVE, BRANDABLE name — NOT a literal description of the business.
- BAD: "AI Tutor Hub", "Bakery Shop", "Yoga Studio", "Tutoring Services"
- GOOD: "Promptly", "Crust & Crumb", "Asana House", "Codecraft"
If the user provided a name, use it. If not, invent something short, memorable, and brand-like (1-2 words, no generic suffixes like "Hub", "Services", "Center", "Studio" unless it fits the brand).

== REDUNDANT QUESTIONS — CRITICAL ==
Read the business idea carefully. Do NOT ask about ANYTHING the user already stated. Common things users mention:
- Target audience (age, profession, demographic)
- Core service or product
- Location
- Specialty or differentiator
Example: If the user writes "I tutor high school students aged 15-18 in using AI for web development", you must NOT ask "who is your audience" or "what is your main service" — those are answered. Only ask about things NOT mentioned.

== MULTI-SELECT QUESTIONS — CRITICAL ==
Any question where multiple answers make sense MUST have "multi_select": true. Examples:
- "Which sections should your website include?" → multi_select:true (user might want Home + About + Contact + Blog)
- "What contact methods should you display?" → multi_select:true (user might want email + phone + form)
- "Which features do you need?" → multi_select:true
For multi_select questions:
- Phrase the question to include "(select all that apply)"
- "default" must be an ARRAY of strings, e.g. ["Home","About","Contact"]
- NEVER include "All of the above" as an option — it's redundant in multi-select

Single-select questions (navigation style, tone, call-to-action) have "multi_select": false and "default" as a single string.

== QUESTIONS TO ASK (4-6 total, only about unspecified things) ==
Always include:
1. Navigation style (single-select: Top-bar, Sidebar, optionally Mega-menu for large sites)
2. Sections to include (MULTI-SELECT: Home, About, Services, Pricing, Testimonials, Contact, Blog, FAQ, Gallery, Team)
3. Tone of voice (single-select)
Then add 1-3 more only if the business idea doesn't already cover them.

== COLOR PALETTES (4 total) ==
Each palette: 5 uppercase hex codes (#RRGGBB) in order: background, primary, secondary, accent, text. Tailor to the business.

== DESIGN STYLES (3-4 total) ==
Pick from ALL 10 styles — do not default to the first few. Consider the business type:
- minimalism, brutalism, swiss, neumorphism, editorial, glassmorphism, art-deco, corporate, playful, organic
Style guidance:
- Tutoring/education for teens → playful, corporate, minimalism
- Bakery/food → organic, editorial, minimalism
- Law/finance → corporate, swiss, minimalism
- Tech/SaaS → glassmorphism, minimalism, swiss
- Luxury/hospitality → art-deco, editorial, minimalism
- Kids/fun → playful, organic
Do NOT suggest editorial for a tutoring business — use playful or corporate instead.

== JSON ESCAPING ==
ALL double-quotes inside string values MUST be escaped as \\". ALL backslashes as \\\\. Output ONLY the JSON object.`;

const INIT_USER_TEMPLATE = (idea: string, name: string | null) => `Business idea: """${idea}"""
Project name: ${name && name.trim() ? `"""${name.trim()}"""` : "(none — generate a creative brandable name)"}

Generate the JSON now. Do not ask about anything already stated in the business idea above. Use multi_select:true for any question where multiple answers make sense.`;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  try {
    const body = await req.json();
    const idea = body?.idea;
    const name = body?.name ?? null;
    if (!idea || typeof idea !== "string" || idea.trim().length < 5) {
      return errorJson("Missing or too-short 'idea'.", 400);
    }

    const apiKey = Deno.env.get("OPENROUTER_API_KEY");
    if (!apiKey) return errorJson("OPENROUTER_API_KEY secret not set. Add it in Supabase → Edge Functions → Secrets.", 500);

    const messages = [
      { role: "system", content: INIT_SYSTEM_PROMPT },
      { role: "user", content: INIT_USER_TEMPLATE(idea, name) },
    ];

    let lastError = "";

    for (let attempt = 0; attempt < 3; attempt++) {
      let raw: string;
      try {
        raw = await callOpenRouter(
          apiKey,
          "openai/gpt-oss-120b:free",
          messages,
          { temperature: attempt === 0 ? 0.8 : 0.5, max_tokens: 12000 }
        );
      } catch (e) {
        lastError = String(e?.message || e);
        console.warn(`[ai-init] Attempt ${attempt + 1} API error: ${lastError}`);
        if (attempt < 2) await sleep(2000);
        continue;
      }

      if (!raw || !raw.trim()) {
        lastError = "Empty response from model.";
        if (attempt < 2) await sleep(2000);
        continue;
      }

      let parsed;
      try {
        parsed = extractJSON(raw);
      } catch (parseErr) {
        lastError = String(parseErr?.message || parseErr);
        console.warn(`[ai-init] Attempt ${attempt + 1} parse error: ${lastError}`);
        if (attempt < 2) await sleep(1500);
        continue;
      }

      if (!parsed.questions || !Array.isArray(parsed.questions) || !parsed.color_palettes || !parsed.design_styles) {
        lastError = "Missing required fields (questions, color_palettes, or design_styles).";
        if (attempt < 2) await sleep(1500);
        continue;
      }

      // Sanitize
      const ALLOWED_STYLES = new Set(["minimalism","brutalism","swiss","neumorphism","editorial","glassmorphism","art-deco","corporate","playful","organic"]);
      parsed.design_styles = (parsed.design_styles || []).filter((s: string) => ALLOWED_STYLES.has(s));
      if (parsed.design_styles.length === 0) {
        parsed.design_styles = ["minimalism","swiss","editorial"];
      }

      // Normalize multi_select + default on each question.
      // Also strip "All of the above" options (redundant in multi-select).
      parsed.questions = (parsed.questions || []).map((q: any) => {
        let multi = q.multi_select === true;
        let options = (q.options || []).filter((o: string) =>
          !/^(all of the above|all of these|all options)$/i.test(String(o).trim())
        );
        // Heuristic: if the question text contains "select all", force multi_select
        if (/select all/i.test(String(q.question || ''))) multi = true;
        // Heuristic: if the question is about "sections" or "features" or "contact methods", force multi
        if (/(which sections|what sections|which features|what features|which contact|what contact|which pages|what pages)/i.test(String(q.question || ''))) multi = true;

        let def = q.default;
        if (multi) {
          if (!Array.isArray(def)) {
            def = def ? [def] : (options.length ? [options[0]] : []);
          }
        } else {
          if (Array.isArray(def)) def = def[0] || (options[0] || "");
        }
        return { ...q, options, multi_select: multi, default: def };
      });

      return json(parsed);
    }

    return errorJson(
      "The AI model couldn't generate a valid response after 3 attempts. This is usually due to rate-limiting on the free tier — please wait 10 seconds and try again. Last error: " + lastError,
      502
    );
  } catch (e) {
    return errorJson("Server error: " + String(e?.message || e), 500);
  }
});
