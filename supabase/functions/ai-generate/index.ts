// ============================================================================
// ai-generate — Sends the prepared generation prompt + DESIGN.md to the
// Laguna XS.2 code-generation model and returns the parsed JSON of files.
// Uses: poolside/laguna-xs.2:free via OpenRouter.
// ============================================================================
import { corsHeaders, json, errorJson, callOpenRouter, extractJSON } from "../_shared/cors.ts";

const GENERATE_SYSTEM_PROMPT = `You are an expert front-end engineer. You generate complete, production-quality websites using ONLY Vanilla HTML, CSS, and JavaScript — no frameworks, no build tools, no imports.

The user will give you a detailed brief. You must respond with a SINGLE JSON object mapping file names to file contents.

The JSON object MUST have AT LEAST these keys:
  "index.html"
  "styles.css"
  "script.js"

CRITICAL CONTENT RULES:
1. ALL text content must accurately reflect the user's business as described in the brief. Read the business idea carefully and use it as the sole source of truth for what the business does.
2. Do NOT invent services, products, or features the user did not mention. If the user teaches "AI tools for web development", the content must say "AI tools for web development" — NOT "Python, JavaScript, and Web Development" unless those were explicitly mentioned.
3. Do NOT include joke content, memes, rickrolls, or any non-professional placeholder. All video/image placeholders must use a neutral gray box or a descriptive label — NEVER a real video URL (especially not YouTube rickrolls).
4. If you need placeholder images, use a plain colored div with CSS or describe what image should go there in a comment. Do NOT use external image URLs.
5. Social media links: only include the platforms the user explicitly requested. Use href="#" for all social links (they are placeholders). Do NOT embed any YouTube videos unless the user explicitly asked for a video section.

CRITICAL TECHNICAL REQUIREMENTS:
1. The site will be deployed at a SUBPATH (e.g. claybuild.github.io/my-project/). Therefore every internal reference MUST be relative:
   - <link rel="stylesheet" href="./styles.css">
   - <script src="./script.js" defer></script>
   - <img src="./logo.png"> (if a logo was requested)
   - Internal links should be "#section-id" or "./" — NEVER "/about" or "/index.html".
2. Use semantic HTML5 (header, nav, main, section, footer, article).
3. Use CSS custom properties (variables) at :root for the entire color palette and spacing scale.
4. Use CSS Grid and Flexbox for layout. Make the site fully responsive (mobile-first).
5. Include FontAwesome 6 via CDN in the <head>: <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
6. Use Google Fonts via <link> in the <head>.
7. Include a working contact form (front-end only). On submit, prevent default, show a success message, and do NOT actually send data anywhere.
8. Add smooth scroll behavior (html { scroll-behavior: smooth; }) and subtle fade-in animations on scroll (via IntersectionObserver in script.js).
9. Add a sticky/responsive navigation that collapses to a hamburger menu on mobile.
10. The HTML must be a complete <!DOCTYPE html> document.
11. All text content must be realistic and tailored to the business — no lorem ipsum.

OUTPUT FORMAT — STRICTLY:
{
  "index.html": "<!DOCTYPE html>...",
  "styles.css": "/* ... */",
  "script.js": "// ..."
}

- Do NOT include any prose, explanations, or markdown code fences.
- Do NOT include any keys other than file names.
- Make sure every quote inside file contents is properly escaped so the whole response is valid JSON.
- The "index.html" value MUST be a single JSON string with all newlines escaped as \\n and all double quotes inside the HTML escaped as \\".`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  try {
    const { generation_prompt, design_doc, slug } = await req.json();
    if (!generation_prompt) return errorJson("Missing 'generation_prompt'.", 400);
    if (!slug) return errorJson("Missing 'slug'.", 400);

    const apiKey = Deno.env.get("OPENROUTER_API_KEY");
    if (!apiKey) return errorJson("OPENROUTER_API_KEY secret not set.", 500);

    const userContent = `Here is the DESIGN.md (design system spec) for reference:

----- BEGIN DESIGN.md -----
${design_doc || "(no design doc provided)"}
----- END DESIGN.md -----

And here is the full website brief (already filled-in by the previous step):

----- BEGIN BRIEF -----
${generation_prompt}
----- END BRIEF -----

The site will deploy at: https://claybuild.github.io/${slug}/

Return the JSON object of files now.`;

    const messages = [
      { role: "system", content: GENERATE_SYSTEM_PROMPT },
      { role: "user",   content: userContent },
    ];

    // SINGLE attempt only — the client handles retries. This keeps the edge
    // function well within its wall-clock timeout. If the model times out or
    // returns bad JSON, we return an error and the client (new-project.js)
    // will retry by calling this function again.
    let raw: string;
    try {
      raw = await callOpenRouter(apiKey, "poolside/laguna-xs.2:free", messages, {
        temperature: 0.4,
        max_tokens: 8000,
      });
    } catch (e) {
      const msg = String(e?.message || e);
      console.warn(`[ai-generate] API error: ${msg}`);
      return errorJson("Model request failed: " + msg + " — click Try Again to retry.", 502);
    }

    if (!raw || !raw.trim()) {
      return errorJson("Model returned an empty response. Click Try Again to retry.", 502);
    }

    try {
      const files = extractJSON<Record<string, string>>(raw);
      if (!files["index.html"]) {
        return errorJson("Model response missing index.html. Click Try Again to retry.", 502);
      }
      return json({ files });
    } catch (parseErr) {
      const msg = String(parseErr?.message || parseErr);
      console.warn(`[ai-generate] Parse error: ${msg}`);
      console.warn(`[ai-generate] Raw response length: ${raw.length}, first 200 chars: ${raw.slice(0, 200)}`);
      return errorJson("Could not parse the generated code. Click Try Again to retry. Error: " + msg, 502);
    }
  } catch (e) {
    return errorJson(String(e?.message || e), 500);
  }
});
