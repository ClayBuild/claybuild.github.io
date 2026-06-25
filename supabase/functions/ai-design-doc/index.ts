// ============================================================================
// ai-design-doc — Given the user's questionnaire answers + visual identity
// (logo description OR chosen palette + design style), generates:
//   1. A DESIGN.md markdown document (the design system spec).
//   2. A fully-filled website generation prompt ready to send to Laguna.
// Uses: openai/gpt-oss-120b:free via OpenRouter.
//
// IMPORTANT: We use a DELIMITER-BASED format instead of JSON because the
// design_doc contains markdown with quotes, backticks, and special characters
// that are very difficult for the model to escape correctly in JSON strings.
// ============================================================================
import { corsHeaders, json, errorJson, callOpenRouter } from "../_shared/cors.ts";

const DESIGN_DOC_SYSTEM_PROMPT = `You are Clay's design-system generator. Given the user's business idea, their questionnaire answers, and their chosen visual identity, you produce TWO things:

1. A DESIGN.md markdown document that defines the design system (colors with hex codes, typography, spacing scale, component rules, layout principles).
2. A fully filled-in natural-language prompt to send to a code-generation model.

OUTPUT FORMAT — use these exact delimiters (do NOT use JSON, do NOT use code fences):

===DESIGN_DOC===
<full markdown content of DESIGN.md here>
===GENERATION_PROMPT===
<full generation prompt here>
===END===

CRITICAL RULES for the generation prompt:
- It MUST end with: "Return ONLY a JSON object mapping file names to file contents. No markdown, no prose, no code fences. The keys MUST be \"index.html\", \"styles.css\", and \"script.js\". All asset references in the HTML must use relative paths (./styles.css, ./script.js)."
- If a logo was uploaded (logo_info provided), include: "The user has uploaded a logo. Reference it in the HTML as ./logo.png (or the appropriate extension). Use an <img> tag with src=\"./logo.png\"."
- It must specify that the site deploys at claybuild.github.io/<slug>/ — all internal links must be relative.
- It must require responsive design, semantic HTML5, CSS custom properties, and FontAwesome 6 via CDN.
- It must include the chosen color palette as exact hex codes.
- It must include the chosen design style and its core principles.
- It must list every section the user wants, in order.

CRITICAL RULES for the design doc:
- Real markdown, with # / ## / ### headings.
- Include a "## Color Palette" section with each color labeled and shown as a hex code.
- Include a "## Typography" section with primary/secondary font suggestions (use Google Fonts).
- Include a "## Spacing Scale" section (e.g. 4px / 8px / 16px / 24px / 48px / 96px).
- Include a "## Components" section covering buttons, cards, navigation, forms.
- Include a "## Layout Principles" section.

Output using the delimiter format above. Do NOT wrap in JSON. Do NOT use code fences around the delimiters.`;

const USER_TEMPLATE = (ctx: {
  business_idea: string;
  project_name: string;
  slug: string;
  questionnaire: any;
  design_style: string;
  logo_info: any | null;
  palette: any | null;
}) => `Business idea: """${ctx.business_idea}"""
Project name: "${ctx.project_name}"
Project slug: "${ctx.slug}"
Deployment URL: https://claybuild.github.io/${ctx.slug}/

Questionnaire answers (JSON):
${JSON.stringify(ctx.questionnaire, null, 2)}

Chosen design style: "${ctx.design_style}"

${
  ctx.logo_info
    ? `LOGO ANALYSIS (use these colors as the primary palette):\n${JSON.stringify(ctx.logo_info, null, 2)}`
    : `CHOSEN COLOR PALETTE (use this as the design palette):\n${JSON.stringify(ctx.palette, null, 2)}`
}

Now produce the output using the delimiter format (===DESIGN_DOC=== ... ===GENERATION_PROMPT=== ... ===END===).`;

// Parse the delimiter-based response.
// Returns { design_doc, generation_prompt } or throws.
function parseDelimitedResponse(raw: string): { design_doc: string; generation_prompt: string } {
  if (!raw || !raw.trim()) throw new Error("Empty response from model.");

  const docMatch = raw.match(/===DESIGN_DOC===\s*([\s\S]*?)\s*===GENERATION_PROMPT===/i);
  const promptMatch = raw.match(/===GENERATION_PROMPT===\s*([\s\S]*?)\s*===END===/i);

  if (!docMatch) {
    // Try without the END delimiter (model might have omitted it)
    const docMatch2 = raw.match(/===DESIGN_DOC===\s*([\s\S]*?)\s*===GENERATION_PROMPT===/i);
    const promptMatch2 = raw.match(/===GENERATION_PROMPT===\s*([\s\S]*)$/i);
    if (docMatch2 && promptMatch2) {
      const design_doc = docMatch2[1].trim();
      const generation_prompt = promptMatch2[1].trim();
      if (!design_doc || !generation_prompt) throw new Error("One of the sections is empty.");
      return { design_doc, generation_prompt };
    }
    throw new Error("Could not find ===DESIGN_DOC=== delimiter in response.");
  }

  const design_doc = docMatch[1].trim();
  const generation_prompt = (promptMatch ? promptMatch[1].trim() : "");

  if (!design_doc) throw new Error("Design doc section is empty.");
  if (!generation_prompt) throw new Error("Generation prompt section is empty.");

  return { design_doc, generation_prompt };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  try {
    const ctx = await req.json();
    const required = ["business_idea","project_name","slug","questionnaire","design_style"];
    for (const k of required) {
      if (!ctx[k]) return errorJson(`Missing field: ${k}`, 400);
    }
    if (!ctx.logo_info && !ctx.palette) {
      return errorJson("Either logo_info or palette must be provided.", 400);
    }

    const apiKey = Deno.env.get("OPENROUTER_API_KEY");
    if (!apiKey) return errorJson("OPENROUTER_API_KEY secret not set.", 500);

    const messages = [
      { role: "system", content: DESIGN_DOC_SYSTEM_PROMPT },
      { role: "user",   content: USER_TEMPLATE(ctx) },
    ];

    let lastError = "";
    for (let attempt = 0; attempt < 3; attempt++) {
      let raw: string;
      try {
        raw = await callOpenRouter(apiKey, "openai/gpt-oss-120b:free", messages, {
          temperature: attempt === 0 ? 0.6 : 0.4,
          max_tokens: 16000,
        });
      } catch (e) {
        lastError = String(e?.message || e);
        console.warn(`[ai-design-doc] Attempt ${attempt + 1} API error: ${lastError}`);
        if (attempt < 2) await new Promise(r => setTimeout(r, 2000));
        continue;
      }

      if (!raw || !raw.trim()) {
        lastError = "Empty response from model.";
        if (attempt < 2) await new Promise(r => setTimeout(r, 2000));
        continue;
      }

      try {
        const parsed = parseDelimitedResponse(raw);
        return json(parsed);
      } catch (parseErr) {
        lastError = String(parseErr?.message || parseErr);
        console.warn(`[ai-design-doc] Attempt ${attempt + 1} parse error: ${lastError}`);
        console.warn(`[ai-design-doc] Raw response (first 300 chars): ${raw.slice(0, 300)}`);
        if (attempt < 2) await new Promise(r => setTimeout(r, 1500));
        continue;
      }
    }

    return errorJson(
      "Could not generate the design document after 3 attempts. This is usually rate-limiting on the free tier — wait 10 seconds and try again. Last error: " + lastError,
      502
    );
  } catch (e) {
    return errorJson(String(e?.message || e), 500);
  }
});
