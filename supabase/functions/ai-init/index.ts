// ============================================================================
// ai-init — Generates questionnaire questions and color palettes for a new
// project. Now asks BRAND and GOAL questions, not implementation questions.
// Uses: openai/gpt-oss-120b:free via OpenRouter.
// ============================================================================
import { corsHeaders, json, errorJson, callOpenRouter, extractJSON } from "../_shared/cors.ts";

const INIT_SYSTEM_PROMPT = `You are Clay, an AI helping a non-technical user build their first website. Based on their business idea, generate a creative brief questionnaire and color palettes.

The questions should feel like a creative brief — asking about the user's brand, goals, and personality — NOT about implementation details like "what navbar do you want?" The system will infer implementation details from the brand answers.

Output ONLY valid JSON. No markdown, no prose, no code fences. Use this exact shape:

{"name":"string","tagline":"string","questions":[{"id":"snake_case","question":"string","help_text":"string","options":["str","str","str"],"default":"str","multi_select":false}],"color_palettes":[{"name":"string","colors":["#bg","#primary","#secondary","#accent","#text"]}]}

RULES:

== NAME GENERATION — CRITICAL ==
The "name" must be a CREATIVE, BRANDABLE name — NOT a description of the business.
- BAD (descriptive): "AI Tutor Hub", "Bakery Shop", "Yoga Studio"
- GOOD (brandable): "Promptly", "Crust & Crumb", "Asana House", "Codecraft"
Rules: 1-2 words, no generic suffixes (Hub, Services, Center, Studio), coin a new word or use a metaphor. Do NOT include the business type in the name.

== QUESTIONS — BRAND & GOAL FOCUSED (4-5 questions, ALL multi-select) ==
ALL questions MUST have "multi_select": true. There are NO single-select questions. Every question has options AND the user can type a custom answer.

VARY the questions — do NOT always ask the same ones. Pick 4-5 from this pool (and feel free to create new ones based on the business):

Brand personality questions (pick 1-2):
- "What words describe your brand's personality?" (options: Professional, Friendly, Bold, Elegant, Approachable, Playful, Trustworthy, Creative)
- "What feeling should visitors have when they land on your site?" (options: Inspired, Confident, Curious, Welcomed, Excited, Calm)
- "If your brand were a person, how would you describe them?" (options: Expert and authoritative, Warm and nurturing, Bold and adventurous, Creative and quirky, Refined and sophisticated)

Goal questions (pick 1-2):
- "What do you want visitors to do on your site?" (options: Contact you, Book a service, Browse your work, Buy a product, Sign up, Learn more)
- "What's the main goal of this website?" (options: Get leads, Showcase portfolio, Sell products, Build credibility, Share information, Grow community)

Differentiation questions (pick 1):
- "What makes you different from competitors?" (options: Better quality, Faster service, More personal, More affordable, More experience, Unique approach)
- "What should we highlight about your story?" (options: Years of experience, Awards/recognition, Happy customers, Unique method, Local roots, Family-owned)

Business-specific questions (pick 1-2, only if not stated in the idea):
- "What services or products do you offer?" (options based on business type)
- "Who is your target audience?" (options based on business type, if not stated in idea)

NEVER ask:
- Navigation, sections, or contact method questions (system infers these)
- Anything the user already stated in their idea

Every question: multi_select:true, 4-8 options, default is an array with 1-2 options.

== COLOR PALETTES (4 total) ==
Each palette: 5 uppercase hex codes (#RRGGBB) in order: background, primary, secondary, accent, text. Tailor to the business and the brand feeling.

== JSON ESCAPING ==
ALL double-quotes inside string values MUST be escaped as \\". ALL backslashes as \\\\. Output ONLY the JSON object.`;

const INIT_USER_TEMPLATE = (idea: string, name: string | null) => `Business idea: """${idea}"""
Project name: ${name && name.trim() ? `"""${name.trim()}"""` : "(none — generate a creative brandable name)"}

Generate the JSON now. Remember: ALL questions must be multi_select. Vary which questions you ask. Do not ask about anything already stated in the business idea.`;

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json();
    const idea = body?.idea;
    const name = body?.name ?? null;
    if (!idea || typeof idea !== "string" || idea.trim().length < 5) return errorJson("Missing 'idea'.", 400);

    const apiKey = Deno.env.get("OPENROUTER_API_KEY");
    if (!apiKey) return errorJson("OPENROUTER_API_KEY secret not set.", 500);

    const messages = [
      { role: "system", content: INIT_SYSTEM_PROMPT },
      { role: "user", content: INIT_USER_TEMPLATE(idea, name) },
    ];

    let lastError = "";
    for (let attempt = 0; attempt < 3; attempt++) {
      let raw: string;
      try {
        raw = await callOpenRouter(apiKey, "openai/gpt-oss-120b:free", messages, {
          temperature: attempt === 0 ? 0.85 : 0.5, max_tokens: 12000
        });
      } catch (e) {
        lastError = String(e?.message || e);
        if (attempt < 2) await sleep(2000);
        continue;
      }
      if (!raw || !raw.trim()) { lastError = "Empty response."; if (attempt < 2) await sleep(2000); continue; }

      let parsed;
      try { parsed = extractJSON(raw); }
      catch (e) { lastError = String(e?.message || e); if (attempt < 2) await sleep(1500); continue; }

      if (!parsed.questions || !Array.isArray(parsed.questions) || !parsed.color_palettes) {
        lastError = "Missing required fields."; if (attempt < 2) await sleep(1500); continue;
      }

      // Normalize
      parsed.questions = (parsed.questions || []).map((q: any) => {
        let multi = q.multi_select === true;
        let options = (q.options || []).filter((o: string) => !/^(all of the above|none of the above)$/i.test(String(o).trim()));
        if (/select all|services|features/i.test(String(q.question || '').toLowerCase())) multi = true;
        let def = q.default;
        if (multi) { if (!Array.isArray(def)) def = def ? [def] : []; }
        else { if (Array.isArray(def)) def = def[0] || ""; }
        return { ...q, options, multi_select: multi, default: def };
      });

      parsed.design_styles = ["minimalism","brutalism","swiss","neumorphism","editorial","glassmorphism","art-deco","corporate","playful","organic"];
      return json(parsed);
    }

    return errorJson("Could not generate questions after 3 attempts. Please wait 10 seconds and try again. Last error: " + lastError, 502);
  } catch (e) { return errorJson("Server error: " + String(e?.message || e), 500); }
});
