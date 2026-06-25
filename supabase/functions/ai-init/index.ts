// ============================================================================
// ai-init — Generates questionnaire questions, color palettes, and design style
// suggestions for a new project, based on the user's business idea.
// Uses: openai/gpt-oss-120b:free via OpenRouter.
// ============================================================================
import { corsHeaders, json, errorJson, callOpenRouter, extractJSON } from "../_shared/cors.ts";

const INIT_SYSTEM_PROMPT = `You are Clay, an AI assistant helping non-technical users build their first website. The user has just described their business idea. Your job is to prepare a focused, friendly questionnaire that gathers ONLY the information needed to build a clean marketing website for them.

You must output STRICT JSON — no markdown, no prose, no code fences — with EXACTLY this shape:

{
  "name": "string — a clean, human-readable project name (use the user-supplied name if provided; otherwise generate one short, brandable name based on the idea).",
  "tagline": "string — a one-line tagline for the business.",
  "questions": [
    {
      "id": "string — snake_case unique id",
      "question": "string — short, non-technical question",
      "help_text": "string — one-sentence explanation of why this matters",
      "options": ["string","string","string"],
      "default": "string — must be one of the options (for single-select) OR an array of options (for multi-select)",
      "multi_select": "boolean — true if the user can pick multiple options, false (or omitted) for single-select"
    }
  ],
  "color_palettes": [
    {
      "name": "string — palette name",
      "colors": ["#bg","#primary","#secondary","#accent","#text"]
    }
  ],
  "design_styles": ["string","string","string"]
}

RULES — READ CAREFULLY:

1. NEVER ASK REDUNDANT QUESTIONS. Before generating each question, ask yourself: "Is this information already stated in the business idea?" If yes, DO NOT ask it. Extract that information silently and use it later. Examples of things users typically mention in their idea:
   - Their target audience (age range, profession, etc.)
   - Their core service or product
   - Their location
   - Their specialty or differentiator
   If the user wrote "I tutor high school students aged 15-18 in using AI for web development", you must NOT ask "who is your audience" or "what is your main focus" — those are already answered.

2. Ask only 4-6 questions total, and only about things the user did NOT specify. Good question topics (pick the relevant ones):
   - navigation style (single-select; always include "Top-bar" and "Sidebar"; include "Mega-menu" only if the site is large like e-commerce or publishing)
   - which sections to include (MULTI-SELECT; options from: Home, About, Services, Pricing, Testimonials, Contact, Blog, FAQ, Gallery, Team)
   - tone of voice (single-select)
   - contact information to display (single-select or multi-select)
   - call-to-action focus (single-select)
   Add at most 1-2 business-specific questions that genuinely need user input.

3. MULTI-SELECT questions: set "multi_select": true. Phrase the question to make it clear multiple selections are allowed, e.g. "Which sections should your website include? (Select all that apply)". The "default" for multi-select must be an array of option strings.

4. SINGLE-SELECT questions: set "multi_select": false or omit it. The "default" must be a single option string.

5. Each question MUST have 3-6 options written in plain English for non-technical users. No jargon. No code.

6. Generate 4 color palettes, each with EXACTLY 5 hex codes in this order: [background, primary, secondary, accent, text]. The hex codes must be real, valid, and visually cohesive. Tailor the palettes to the business (e.g. warm earthy tones for a bakery; cool blue/grey for a law firm). Use uppercase hex like "#F5F1E8".

7. design_styles MUST be chosen from this list and ONLY this list: ["minimalism","brutalism","swiss","neumorphism","editorial","glassmorphism","art-deco","corporate","playful","organic"]. Pick 3-4 that best fit the business type. Do not invent new styles.

8. The "name" field must be plain text, no quotes inside, no emoji.

9. All JSON keys must be present. No extra keys.

10. Output JSON ONLY. No markdown fences, no prose before or after.`;

const INIT_USER_TEMPLATE = (idea: string, name: string | null) => `Business idea: """${idea}"""
Project name: ${name && name.trim() ? `"""${name.trim()}"""` : "(none provided — generate one)"}

Return the JSON now. Remember: do NOT ask about anything already stated in the business idea above.`;

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

    let raw: string;
    try {
      // NOTE: We intentionally do NOT pass response_format here. Many free models
      // on OpenRouter (including gpt-oss-120b:free) do not support it and return
      // a 500. We rely on extractJSON() to parse the response instead.
      raw = await callOpenRouter(
        apiKey,
        "openai/gpt-oss-120b:free",
        [
          { role: "system", content: INIT_SYSTEM_PROMPT },
          { role: "user",   content: INIT_USER_TEMPLATE(idea, name) },
        ],
        { temperature: 0.7, max_tokens: 3000 }
      );
    } catch (e) {
      const msg = String(e?.message || e);
      // Surface the actual OpenRouter error to the user
      return errorJson("AI model request failed: " + msg, 502);
    }

    if (!raw || !raw.trim()) {
      return errorJson("AI model returned an empty response. Please try again.", 502);
    }

    let parsed;
    try {
      parsed = extractJSON(raw);
    } catch (e) {
      return errorJson("Could not parse AI response as JSON. The model may be overloaded — please try again. Raw preview: " + raw.slice(0, 200), 502);
    }

    // Validate / sanitize
    const ALLOWED_STYLES = new Set(["minimalism","brutalism","swiss","neumorphism","editorial","glassmorphism","art-deco","corporate","playful","organic"]);
    parsed.design_styles = (parsed.design_styles || []).filter((s: string) => ALLOWED_STYLES.has(s));
    if (parsed.design_styles.length === 0) {
      parsed.design_styles = ["minimalism","swiss","editorial"];
    }

    // Normalize multi_select + default on each question
    parsed.questions = (parsed.questions || []).map((q: any) => {
      const multi = q.multi_select === true;
      let def = q.default;
      if (multi) {
        if (!Array.isArray(def)) {
          def = def ? [def] : (q.options && q.options.length ? [q.options[0]] : []);
        }
      } else {
        if (Array.isArray(def)) def = def[0] || (q.options && q.options[0]) || "";
      }
      return { ...q, multi_select: multi, default: def };
    });

    return json(parsed);
  } catch (e) {
    return errorJson("Server error: " + String(e?.message || e), 500);
  }
});
