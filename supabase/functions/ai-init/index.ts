// ============================================================================
// ai-init — Generates questionnaire questions, color palettes, and design style
// suggestions for a new project, based on the user's business idea.
// Uses: openai/gpt-oss-120b:free via OpenRouter.
// ============================================================================
import { corsHeaders, json, errorJson, callOpenRouter, extractJSON } from "../_shared/cors.ts";

const INIT_SYSTEM_PROMPT = `You are Clay, an AI helping a non-technical user build their first website. Based on their business idea, generate a questionnaire and design suggestions.

Output ONLY valid JSON. No markdown, no prose, no code fences. Use this exact shape:

{"name":"string","tagline":"string","questions":[{"id":"snake_case","question":"string","help_text":"string","options":["str","str","str"],"default":"str","multi_select":false}],"color_palettes":[{"name":"string","colors":["#bg","#primary","#secondary","#accent","#text"]}],"design_styles":["str","str","str"]}

Rules:
1. Do NOT ask about anything already stated in the business idea (audience, service, location, specialty). Extract that silently.
2. Ask 4-6 questions only, about things NOT specified. Always include: navigation style (single-select, options: Top-bar, Sidebar, optionally Mega-menu), sections to include (multi_select:true, options from Home/About/Services/Pricing/Testimonials/Contact/Blog/FAQ/Gallery/Team), tone (single-select). Add 1-2 business-specific questions if needed.
3. For multi_select questions: set "multi_select":true, phrase the question to say "(select all that apply)", and make "default" an array.
4. Each question: 3-6 plain-English options. No jargon.
5. Generate 4 color palettes, each with 5 hex codes (uppercase #RRGGBB) in order: background, primary, secondary, accent, text. Tailor to the business.
6. design_styles: pick 3-4 from ONLY this list: minimalism, brutalism, swiss, neumorphism, editorial, glassmorphism, art-deco, corporate, playful, organic.
7. ALL double-quotes inside string values MUST be escaped as \\". ALL backslashes as \\\\. ALL newlines as \\n.
8. Output ONLY the JSON object. Nothing else.`;

const INIT_USER_TEMPLATE = (idea: string, name: string | null) => `Business idea: """${idea}"""
Project name: ${name && name.trim() ? `"""${name.trim()}"""` : "(none — generate one)"}

Generate the JSON now. Do not ask about anything already stated above.`;

// Sleep helper for retry delays
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

    // We use the SAME messages array for every attempt — we do NOT append bad
    // responses to the context. Appending truncated/bad responses was causing
    // subsequent requests to bloat and return empty. Fresh start each time.
    const messages = [
      { role: "system", content: INIT_SYSTEM_PROMPT },
      { role: "user", content: INIT_USER_TEMPLATE(idea, name) },
    ];

    let lastError = "";

    // Try up to 3 times with a delay between attempts.
    for (let attempt = 0; attempt < 3; attempt++) {
      let raw: string;
      try {
        raw = await callOpenRouter(
          apiKey,
          "openai/gpt-oss-120b:free",
          messages,
          { temperature: attempt === 0 ? 0.7 : 0.4, max_tokens: 12000 }
        );
      } catch (e) {
        // Network/API error — surface it but retry (might be rate limiting)
        lastError = String(e?.message || e);
        console.warn(`[ai-init] Attempt ${attempt + 1} API error: ${lastError}`);
        if (attempt < 2) {
          await sleep(2000); // wait 2s before retrying (helps with rate limits)
        }
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
        console.warn(`[ai-init] Raw response (first 300 chars): ${raw.slice(0, 300)}`);
        if (attempt < 2) await sleep(1500);
        continue;
      }

      // Validate required fields
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
    }

    // All 3 attempts failed
    return errorJson(
      "The AI model couldn't generate a valid response after 3 attempts. This is usually due to rate-limiting on the free tier — please wait 10 seconds and try again. Last error: " + lastError,
      502
    );
  } catch (e) {
    return errorJson("Server error: " + String(e?.message || e), 500);
  }
});
