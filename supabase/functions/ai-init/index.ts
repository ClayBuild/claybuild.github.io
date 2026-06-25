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
      "default": "string — must be one of the options"
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

Rules:
- Generate between 5 and 7 questions. Always include a navigation question (options must include "Top-bar" and "Sidebar"; include "Mega-menu" ONLY if the site is large, e.g. e-commerce, education, or publishing). Always include a "primary_sections" question (multi-option list of which sections to include — Home, About, Services, Pricing, Testimonials, Contact, Blog, FAQ). Always include a "tone" question. Always include a "contact_info" question. Add 1-2 business-specific questions.
- Each question MUST have exactly 3-5 options written in plain English for non-technical users. No jargon. No code.
- Generate 4 color palettes, each with EXACTLY 5 hex codes in this order: [background, primary, secondary, accent, text]. The hex codes must be real, valid, and visually cohesive. Tailor the palettes to the business (e.g. warm earthy tones for a bakery; cool blue/grey for a law firm). Use uppercase hex like "#F5F1E8".
- design_styles MUST be chosen from this list and ONLY this list: ["minimalism","brutalism","swiss","neumorphism","editorial"]. Pick 3 that best fit the business type. Do not invent new styles.
- The "name" field must be plain text, no quotes inside, no emoji.
- All JSON keys must be present. No extra keys.
- Output JSON ONLY.`;

const INIT_USER_TEMPLATE = (idea: string, name: string | null) => `Business idea: """${idea}"""
Project name: ${name && name.trim() ? `"""${name.trim()}"""` : "(none provided — generate one)"}

Return the JSON now.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  try {
    const { idea, name } = await req.json();
    if (!idea || typeof idea !== "string" || idea.trim().length < 5) {
      return errorJson("Missing or too-short 'idea'.", 400);
    }

    const apiKey = Deno.env.get("OPENROUTER_API_KEY");
    if (!apiKey) return errorJson("OPENROUTER_API_KEY secret not set.", 500);

    const raw = await callOpenRouter(
      apiKey,
      "openai/gpt-oss-120b:free",
      [
        { role: "system", content: INIT_SYSTEM_PROMPT },
        { role: "user",   content: INIT_USER_TEMPLATE(idea, name ?? null) },
      ],
      { temperature: 0.7, max_tokens: 2500, response_format: { type: "json_object" } }
    );

    const parsed = extractJSON<{
      name: string;
      tagline: string;
      questions: Array<{ id: string; question: string; help_text: string; options: string[]; default: string }>;
      color_palettes: Array<{ name: string; colors: string[] }>;
      design_styles: string[];
    }>(raw);

    // Validate design_styles against allowed list (defensive)
    const ALLOWED = new Set(["minimalism","brutalism","swiss","neumorphism","editorial"]);
    parsed.design_styles = (parsed.design_styles || []).filter(s => ALLOWED.has(s));
    if (parsed.design_styles.length === 0) {
      parsed.design_styles = ["minimalism","swiss","editorial"];
    }

    return json(parsed);
  } catch (e) {
    return errorJson(String(e?.message || e), 500);
  }
});
