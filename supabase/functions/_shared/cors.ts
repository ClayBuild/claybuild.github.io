// Shared CORS headers for all Clay Edge Functions
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function errorJson(message: string, status = 400): Response {
  return json({ error: message }, status);
}

// Call OpenRouter chat completions API.
// Returns the raw assistant text content.
// Throws a descriptive Error if the API fails or returns an empty response.
export async function callOpenRouter(
  apiKey: string,
  model: string,
  messages: { role: string; content: any }[],
  options: { temperature?: number; max_tokens?: number; response_format?: any } = {}
): Promise<string> {
  const body: any = {
    model,
    messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.max_tokens ?? 4000,
  };
  if (options.response_format) {
    body.response_format = options.response_format;
  }

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://claybuild.github.io",
      "X-Title": "Clay",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text();
    // Parse OpenRouter error format for a cleaner message
    let detail = txt;
    try {
      const j = JSON.parse(txt);
      detail = j.error?.message || j.error || j.message || txt;
    } catch (_) {}
    if (res.status === 429) {
      throw new Error(`Rate limited by OpenRouter (free tier). Wait a few seconds and try again. Detail: ${detail}`);
    }
    throw new Error(`OpenRouter ${res.status}: ${detail}`);
  }

  const data = await res.json();

  // Check for OpenRouter-level errors (they can return 200 with an error field)
  if (data.error) {
    throw new Error(`OpenRouter error: ${data.error.message || JSON.stringify(data.error)}`);
  }

  const content = data.choices?.[0]?.message?.content ?? "";

  // Check finish_reason — if it's "length", the output was truncated
  const finishReason = data.choices?.[0]?.finish_reason;
  if (finishReason === "length") {
    // Return what we have — extractJSON will try to handle it, and the retry
    // loop in the caller will catch the parse error and retry with a fresh call.
    console.warn("[Clay] Model response was truncated (finish_reason=length).");
  }

  if (!content || !content.trim()) {
    throw new Error("Model returned an empty response. This is usually a temporary rate-limit on the free tier — please try again in a few seconds.");
  }

  return content;
}

// Try to parse JSON from a model response that might be wrapped in markdown
// fences or have surrounding prose. Returns the parsed object or throws.
export function extractJSON<T = any>(raw: string): T {
  if (!raw) throw new Error("Empty model response");
  let s = raw.trim();

  // Strip markdown code fences if present
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) s = fence[1].trim();

  // Strip leading BOM if present
  if (s.charCodeAt(0) === 0xFEFF) s = s.slice(1);

  // Find the first { or [ and the matching last } or ]
  const firstObj = s.indexOf("{");
  const firstArr = s.indexOf("[");
  let start = -1;
  let open = "";
  let close = "";
  if (firstObj === -1 && firstArr === -1) {
    throw new Error("No JSON found in model response");
  }
  if (firstObj === -1) {
    start = firstArr; open = "["; close = "]";
  } else if (firstArr === -1) {
    start = firstObj; open = "{"; close = "}";
  } else {
    if (firstObj < firstArr) { start = firstObj; open = "{"; close = "}"; }
    else { start = firstArr; open = "["; close = "]"; }
  }
  const end = s.lastIndexOf(close);
  if (end <= start) throw new Error("Malformed JSON in model response");
  let slice = s.slice(start, end + 1);

  // Attempt 1: direct parse
  try {
    return JSON.parse(slice) as T;
  } catch (_) {
    // Attempt 2: try to fix common LLM JSON mistakes
    let fixed = slice;
    // Remove trailing commas before } or ]
    fixed = fixed.replace(/,(\s*[}\]])/g, "$1");
    // Replace smart quotes with straight quotes
    fixed = fixed.replace(/[\u201C\u201D]/g, '"');
    fixed = fixed.replace(/[\u2018\u2019]/g, "'");
    try {
      return JSON.parse(fixed) as T;
    } catch (_) {
      // Attempt 3: more aggressive repairs
      let fixed2 = fixed;
      // Fix missing colons: "key" "value" → "key": "value"
      // (a closing quote followed by whitespace and an opening quote, not preceded by : or ,)
      fixed2 = fixed2.replace(/"(\s+)"(?!\s*[,:}\]])/g, '": "');
      // Fix missing commas between array elements: "a" "b" → "a", "b"
      // This is handled by the colon fix above for objects; for arrays we need:
      fixed2 = fixed2.replace(/"\s+"(?=\s*[,\]])/g, '", "');
      // Remove any leading/trailing whitespace inside the JSON
      fixed2 = fixed2.trim();
      try {
        return JSON.parse(fixed2) as T;
      } catch (e) {
        throw new Error("Invalid JSON: " + (e as Error).message);
      }
    }
  }
}
