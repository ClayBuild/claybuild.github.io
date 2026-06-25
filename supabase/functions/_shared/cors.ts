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
    throw new Error(`OpenRouter ${res.status}: ${txt}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

// Try to parse JSON from a model response that might be wrapped in markdown
// fences or have surrounding prose. Returns the parsed object or throws.
export function extractJSON<T = any>(raw: string): T {
  if (!raw) throw new Error("Empty model response");
  let s = raw.trim();

  // Strip markdown code fences if present
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) s = fence[1].trim();

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
  const slice = s.slice(start, end + 1);
  return JSON.parse(slice) as T;
}
