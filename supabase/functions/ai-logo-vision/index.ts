// ============================================================================
// ai-logo-vision — Accepts a base64-encoded logo image, sends it to the
// Nemotron Nano 12B V2 VL model and returns a structured description with
// exact hex colors. This description is later used to build DESIGN.md.
// Uses: nvidia/nemotron-nano-12b-v2-vl:free via OpenRouter.
// ============================================================================
import { corsHeaders, json, errorJson, callOpenRouter, extractJSON } from "../_shared/cors.ts";

const LOGO_SYSTEM_PROMPT = `You are an expert visual identity analyst. The user has uploaded a logo for their new website. Examine it carefully and produce a structured design specification that a separate code-generation model will use to build a matching website.

Return STRICT JSON — no markdown, no prose — with EXACTLY this shape:

{
  "description": "string — 2-3 sentences describing the logo (subject, style, mood).",
  "colors": ["#hex","#hex","#hex","#hex","#hex"],
  "style_keywords": ["string","string","string"],
  "personality": "string — single word: playful | corporate | elegant | bold | friendly | minimal | rustic | modern | classic | luxury",
  "recommended_background": "#hex",
  "recommended_text_color": "#hex",
  "recommended_accent": "#hex",
  "typography_suggestion": "string — e.g. 'geometric sans-serif' or 'humanist serif'"
}

Rules:
- Extract up to 5 dominant colors as exact hex codes (be precise — use real picked colors, not approximations).
- All hex codes uppercase, format "#RRGGBB".
- The 5 colors in the "colors" array should be ordered: [logo dominant color 1, logo dominant color 2, neutral light, neutral dark, accent].
- recommended_background should be a very light or very dark neutral that complements the logo.
- recommended_text_color must have strong contrast against recommended_background.
- Output JSON ONLY.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  try {
    const { image_base64, mime_type } = await req.json();
    if (!image_base64) return errorJson("Missing 'image_base64'.", 400);

    const apiKey = Deno.env.get("OPENROUTER_API_KEY");
    if (!apiKey) return errorJson("OPENROUTER_API_KEY secret not set.", 500);

    const dataUrl = `data:${mime_type || "image/png"};base64,${image_base64}`;

    const raw = await callOpenRouter(
      apiKey,
      "nvidia/nemotron-nano-12b-v2-vl:free",
      [
        { role: "system", content: LOGO_SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: "Analyze this logo and return the JSON specification." },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
      { temperature: 0.3, max_tokens: 1200 }
    );

    const parsed = extractJSON(raw);
    return json(parsed);
  } catch (e) {
    return errorJson(String(e?.message || e), 500);
  }
});
