// ============================================================================
// ai-generate — Generates a STRUCTURED SPEC (not raw code) for the website.
// The client-side renderer assembles the final HTML/CSS/JS from pre-built
// components using this spec.
//
// This is faster (~300 tokens of output vs 8000), more reliable (no JSON
// escaping issues with HTML content), and produces consistently polished
// results (components are hand-built, not AI-generated).
// ============================================================================
import { corsHeaders, json, errorJson, callOpenRouter, extractJSON } from "../_shared/cors.ts";

const GENERATE_SYSTEM_PROMPT = `You are Clay's website planner. Given the user's business idea, questionnaire answers, and design choices, you produce a STRUCTURED SPEC that a renderer will use to assemble the final website.

Output ONLY valid JSON. No markdown, no prose. Use this exact shape:

{
  "content": {
    "brand_name": "string",
    "tagline": "string",
    "headline": "string — the hero headline (6-12 words, impactful)",
    "subheadline": "string — 1-2 sentences expanding on the headline",
    "cta_text": "string — the main call-to-action button text (2-4 words)",
    "nav_links": ["string", "string", "string"],
    "about_body": "string — 2-3 sentences about the business, derived from the idea",
    "social_links": ["string"],
    "contact_details": { "email": "string or null", "phone": "string or null", "address": "string or null" }
  },
  "components": {
    "nav": "topbar | sidebar | minimal",
    "hero": "centered | split | bold",
    "footer": "minimal | rich"
  },
  "sections": [
    { "type": "features", "variant": "3-col | 2-col", "content": { "title": "string", "subtitle": "string", "cards": [{"title":"string","description":"string","icon":"fa-solid fa-xxx"}] } },
    { "type": "about", "variant": "standard", "content": { "title": "string", "body": "string" } },
    { "type": "testimonial", "variant": "single", "content": { "quote": "string", "author": "string" } },
    { "type": "cta", "variant": "band", "content": { "headline": "string", "subtitle": "string", "button_text": "string" } },
    { "type": "contact", "variant": "standard", "content": { "title": "string", "subtitle": "string", "contact_details": {} } }
  ]
}

CONTENT RULES:
1. ALL text must accurately reflect the user's business as described in the idea. Do NOT invent services or products not mentioned.
2. If the user said "AI tools for web development", write that — NOT "Python and JavaScript".
3. Do NOT include joke content, memes, or rickrolls.
4. Feature cards: generate 3-4 cards based on what the business actually offers. Use relevant FontAwesome icons.
5. Testimonial: generate a realistic-sounding testimonial with a plausible name. If the business is new/small, make the testimonial sound genuine, not over-the-top.
6. About body: expand on the user's idea in 2-3 sentences. Mention their location if provided.
7. Contact details: only include what's reasonable for the business type. Use placeholder@example.com if no real email was provided.

COMPONENT CHOICES:
- nav: "topbar" for most sites. "sidebar" for portfolios/agency sites. "minimal" for very simple sites.
- hero: "centered" for most. "split" for sites with a visual element. "bold" for sites that want a strong first impression.
- footer: "rich" if there are social links or multiple nav items. "minimal" for simple sites.

SECTIONS — VARY THE STRUCTURE:
Do NOT always use the same sections in the same order. Vary which sections you include and their order based on the business type. Available section types:
- "features" (variants: "3-col", "2-col"): cards showcasing services/offerings
- "about" (variant: "standard"): about the business
- "testimonial" (variant: "single"): a customer quote
- "cta" (variant: "band"): call-to-action band
- "cta-compact" (variant: "default"): smaller accent-colored CTA
- "contact" (variant: "standard"): contact form
- "gallery" (variant: "default"): image grid (for portfolios, bakeries, photographers, etc.)
- "pricing" (variant: "default"): pricing tiers (for services, SaaS, tutoring, etc.)
- "stats" (variant: "default"): key numbers (e.g. "500+ students", "10 years")
- "products" (variant: "default"): product grid with prices and Buy buttons (for shops, retail, e-commerce)
- "menu" (variant: "default"): menu items with prices and Order buttons (for restaurants, bakeries, cafes)
- "team" (variant: "default"): team member cards with photos (placeholders)
- "faq" (variant: "default"): expandable FAQ questions
- "portfolio" (variant: "default"): portfolio/project grid with overlay labels

DOMAIN-SPECIFIC SECTIONS (include based on business type):
- Bakery/restaurant/food/cafe: include "menu" (with 4-6 items, prices), "gallery" (food photos), skip "products"
- Photography/portfolio/creative: include "portfolio" (6 projects), "gallery"
- Tutoring/education: include "pricing" (course tiers), "stats", "team" (instructors)
- SaaS/tech/software: include "pricing", "stats", "faq"
- Law/finance/consulting: include "stats", "team" (partners), "faq", skip "gallery"
- Retail/shop/e-commerce/store: include "products" (4-8 products with prices and Buy buttons), "pricing" (shipping tiers)
- Gym/fitness/wellness: include "pricing" (membership tiers), "stats", "team" (trainers)
- Real estate: include "gallery" (listings), "stats", "team" (agents)
- Agency/studio: include "portfolio", "team", "stats"

VARIETY RULE: Even for the same business type, vary the section order and which sections you include. Don't always do the same structure. Mix it up. Sometimes start with stats, sometimes put about before features, sometimes skip testimonial, use cta-compact instead of cta, etc. Pick 4-6 sections (plus contact) and order them differently each time.

Always include "contact" last (before footer).

CONTENT FOR SHOPPING/MENU:
- For "products": generate 4-8 realistic products with names, descriptions, and prices (e.g. $12.99). Include a "Buy" button (href="#contact").
- For "menu": generate 4-6 menu items with names, descriptions, and prices. Include an "Order" button.
- For "team": generate 2-4 team members with names and roles. Photos are placeholders (icon).
- For "faq": generate 3-5 Q&A pairs relevant to the business.
- For "portfolio": generate 4-6 project entries with titles and categories.
- For "gallery": generate 4-6 items with captions.
- For "stats": generate 3-4 key statistics with values and labels.

EXACT JSON STRUCTURE for each section type (follow this precisely):
- portfolio: {"type":"portfolio","variant":"default","content":{"title":"Our Work","subtitle":"Selected projects","items":[{"title":"Project Name","category":"Category"},{"title":"Project Name","category":"Category"}]}}
- gallery: {"type":"gallery","variant":"default","content":{"title":"Gallery","subtitle":"A look at our work","items":[{"caption":"Image description"},{"caption":"Image description"}]}}
- products: {"type":"products","variant":"default","content":{"title":"Our Products","subtitle":"Shop our collection","products":[{"name":"Product Name","description":"Short description","price":"$12.99"}]}}
- menu: {"type":"menu","variant":"default","content":{"title":"Our Menu","subtitle":"Freshly made","items":[{"name":"Item Name","description":"Description","price":"$8.99"}]}}
- team: {"type":"team","variant":"default","content":{"title":"Our Team","subtitle":"Meet the people","members":[{"name":"Person Name","role":"Their role"}]}}
- faq: {"type":"faq","variant":"default","content":{"title":"FAQ","subtitle":"Common questions","faqs":[{"question":"Question?","answer":"Answer."}]}}
- stats: {"type":"stats","variant":"default","content":{"stats":[{"value":"500+","label":"Happy clients"},{"value":"10","label":"Years experience"}]}}
- pricing: {"type":"pricing","variant":"default","content":{"title":"Pricing","subtitle":"Choose your plan","plans":[{"name":"Basic","price":"$29","period":"mo","features":["Feature 1","Feature 2"],"cta":"Choose Basic"}]}}

CRITICAL: Every section MUST have a "content" object with the items/products/members/faqs/stats/plans array populated with real data. NEVER output an empty items array. If you include a section, fill it with realistic content.

JSON ESCAPING: ALL double-quotes inside strings MUST be escaped as \\". Output ONLY the JSON object.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { generation_prompt, design_doc, slug, business_idea, project_name, generate_name, questionnaire, design_style, palette, logo_info } = await req.json();

    const apiKey = Deno.env.get("OPENROUTER_API_KEY");
    if (!apiKey) return errorJson("OPENROUTER_API_KEY secret not set.", 500);

    // Build a clean context for the AI — we don't need the generation_prompt
    // anymore since the AI is outputting a spec, not code.
    const userContent = `Business idea: """${business_idea || ''}"""

${generate_name
  ? `Project name: (none provided — GENERATE a creative, brandable name based on the business idea and use it as brand_name)`
  : `Project name (USE THIS EXACT NAME as the brand_name in your spec — do not invent a different name): "${project_name || ''}"`}

Questionnaire answers:
${JSON.stringify(questionnaire?.answers || {}, null, 2)}

Design style: "${design_style || 'minimalism'}"
${palette ? `Color palette: ${JSON.stringify(palette)}` : (logo_info ? `Logo colors: ${JSON.stringify(logo_info)}` : '')}

Generate the structured spec JSON now. ${generate_name ? 'Generate a creative brand name and use it as brand_name. ' : ''}All content must accurately reflect the business idea above.`;

    const messages = [
      { role: "system", content: GENERATE_SYSTEM_PROMPT },
      { role: "user", content: userContent },
    ];

    let raw: string;
    try {
      raw = await callOpenRouter(apiKey, "openai/gpt-oss-120b:free", messages, {
        temperature: 0.5, max_tokens: 4000
      });
    } catch (e) {
      const msg = String(e?.message || e);
      return errorJson("Model request failed: " + msg, 502);
    }

    if (!raw || !raw.trim()) return errorJson("Empty response from model.", 502);

    try {
      const spec = extractJSON(raw);
      // Basic validation
      if (!spec.content || !spec.content.brand_name || !spec.sections) {
        return errorJson("Spec missing required fields.", 502);
      }
      return json({ spec });
    } catch (e) {
      const msg = String(e?.message || e);
      console.warn(`[ai-generate] Parse error: ${msg}`);
      return errorJson("Could not parse spec. Error: " + msg, 502);
    }
  } catch (e) {
    return errorJson(String(e?.message || e), 500);
  }
});
