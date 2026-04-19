// supabase/functions/ai-proxy/index.ts
// All AI API keys and system prompts live HERE — never in the browser.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import OpenAI from "https://esm.sh/openai@4.52.0";

// ─── CORS ───────────────────────────────────────────────
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ─── API KEY RESOLUTION ─────────────────────────────────
function getApiKey(feature?: string): string {
  const keys: Record<string, string> = {
    groq: Deno.env.get("GROQ_API_KEY") || "",
    gemini: Deno.env.get("GEMINI_API_KEY") || "",
    pitchdeck: Deno.env.get("PITCHDECK_API_KEY") || "",
    eligibility: Deno.env.get("ELIGIBILITY_API_KEY") || "",
    review: Deno.env.get("REVIEW_API_KEY") || "",
    kasb_studio: Deno.env.get("KASB_STUDIO_API_KEY") || "",
    kasb_assistant: Deno.env.get("KASB_ASSISTANT_API_KEY") || "",
    elon_musk: Deno.env.get("ELON_MUSK_API_KEY") || "",
    steven_dobs: Deno.env.get("STEVEN_DOBS_API_KEY") || "",
    marek_zane: Deno.env.get("MAREK_ZANE_API_KEY") || "",
    will_grates: Deno.env.get("WILL_GRATES_API_KEY") || "",
    surepass: Deno.env.get("SUREPASS_API_TOKEN") || "",
  };

  // Feature-specific key mapping
  const featureMap: Record<string, string> = {
    chat_elon: "elon_musk", chat_steven: "steven_dobs",
    chat_marek: "marek_zane", chat_will: "will_grates",
    studio: "kasb_studio", assistant: "kasb_assistant",
    review: "review", eligibility: "eligibility",
    pitchdeck: "pitchdeck",
  };

  if (feature && featureMap[feature] && keys[featureMap[feature]]) {
    return keys[featureMap[feature]];
  }
  return keys.groq || keys.gemini || "";
}

function getPersonalityKeyId(personalityId: string): string {
  const map: Record<string, string> = {
    "Melon Tusk": "chat_elon", "Steven Dobs": "chat_steven",
    "Marek Zane": "chat_marek", "Will Grates": "chat_will",
    "Product Push": "chat_elon", "BoAt Daddy": "chat_elon",
    "NoTAM King": "chat_elon", "Piranha Panel": "chat_elon",
  };
  return map[personalityId] || "assistant";
}

// ─── OPENAI CLIENT ──────────────────────────────────────
function getOpenAIClient(apiKey: string) {
  const baseURL = apiKey.startsWith("gsk_")
    ? "https://api.groq.com/openai/v1"
    : apiKey.startsWith("sk-")
    ? "https://api.openai.com/v1"
    : "https://api.groq.com/openai/v1";
  return new OpenAI({ apiKey, baseURL });
}

async function runInference(apiKey: string, prompt: string, opts: { model?: string; isJSON?: boolean } = {}): Promise<string> {
  const client = getOpenAIClient(apiKey);
  const completion = await client.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: opts.model || "llama-3.3-70b-versatile",
    response_format: opts.isJSON ? { type: "json_object" } : undefined,
  });
  return completion.choices[0].message.content || "";
}

async function runChat(apiKey: string, systemPrompt: string, history: Array<{role: string; content: string}>, userMessage: string, model?: string): Promise<string> {
  const client = getOpenAIClient(apiKey);
  const messages: any[] = [
    { role: "system", content: systemPrompt },
    ...history.map(h => ({ role: h.role, content: h.content })),
    { role: "user", content: userMessage },
  ];
  const completion = await client.chat.completions.create({
    messages, model: model || "llama-3.3-70b-versatile",
  });
  return completion.choices[0].message.content || "";
}

// ─── SYSTEM PROMPTS (SERVER-SIDE ONLY) ──────────────────
// These are loaded from a separate file to keep this file manageable
const SYSTEM_PROMPTS = await import("./prompts.ts").then(m => m.default).catch(() => ({}));

function getSystemPrompt(personalityId: string): string {
  return SYSTEM_PROMPTS[personalityId] || SYSTEM_PROMPTS["kasb_assistant"] || "You are a helpful AI assistant.";
}

// ─── VERIFY AUTH ────────────────────────────────────────
async function verifyAuth(req: Request): Promise<{ userId: string } | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return null;

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return { userId: user.id };
}

// ─── ACTION HANDLERS ────────────────────────────────────
type ActionHandler = (payload: any) => Promise<any>;

const actions: Record<string, ActionHandler> = {
  // Chat with personality (FounderGPT, Piranha Tank)
  async chat(p) {
    const keyId = getPersonalityKeyId(p.personalityId);
    const apiKey = getApiKey(keyId);
    if (!apiKey) throw new Error("AI not configured");

    let systemPrompt = getSystemPrompt(p.personalityId);
    if (p.brutalMode) systemPrompt += "\n\nBRUTAL MODE IS ON. Be EXTREMELY critical. Tear apart every idea ruthlessly. No encouragement. Raw, unfiltered truth.";
    if (p.founderContext) systemPrompt += `\n\nFOUNDER CONTEXT:\n${p.founderContext}`;

    // RAG context injection
    if (p.ragContext) systemPrompt += `\n\nCONTEXT FROM REAL-LIFE INTERVIEWS:\n${p.ragContext}`;

    const text = await runChat(apiKey, systemPrompt, p.history || [], p.message);
    return { text };
  },

  // Chat with Kasb Assistant
  async chat_kasb(p) {
    const apiKey = getApiKey("assistant");
    if (!apiKey) throw new Error("AI not configured");
    let systemPrompt = getSystemPrompt("kasb_assistant");
    if (p.founderContext) systemPrompt += `\n\nFOUNDER CONTEXT:\n${p.founderContext}`;
    const text = await runChat(apiKey, systemPrompt, p.history || [], p.message);
    return { text };
  },

  // Compare startups
  async compare_startups(p) {
    const apiKey = getApiKey("eligibility");
    if (!apiKey) throw new Error("AI not configured");
    const prompt = `Compare these two startups as investment opportunities.\n\nStartup 1: ${p.startup1.name}\nDescription: ${p.startup1.description || "N/A"}\nStage: ${p.startup1.stage}\nValuation: ${p.startup1.valuation}\nTraction: ${p.startup1.traction}\n\nStartup 2: ${p.startup2.name}\nDescription: ${p.startup2.description || "N/A"}\nStage: ${p.startup2.stage}\nValuation: ${p.startup2.valuation}\nTraction: ${p.startup2.traction}\n\nReturn valid JSON:\n{"verdict":"...","analysis":{"problem":{"winner":"...","reason":"..."},"market":{"winner":"...","reason":"..."},"risks":{"winner":"...","reason":"..."}},"startup1Analysis":"...","startup2Analysis":"..."}`;
    const text = await runInference(apiKey, prompt, { isJSON: true });
    return JSON.parse(text.replace(/```json\n?|\n?```/g, "").trim());
  },

  // Compare investors
  async compare_investors(p) {
    const apiKey = getApiKey("eligibility");
    if (!apiKey) throw new Error("AI not configured");
    const prompt = `Compare these two investors as potential partners.\n\nInvestor 1: ${p.investor1.name}\nBio: ${p.investor1.bio}\nFunds: ${p.investor1.fundsAvailable}\nExpertise: ${p.investor1.expertise}\n\nInvestor 2: ${p.investor2.name}\nBio: ${p.investor2.bio}\nFunds: ${p.investor2.fundsAvailable}\nExpertise: ${p.investor2.expertise}\n\nReturn valid JSON:\n{"verdict":"...","analysis":{"funds":{"winner":"...","reason":"..."},"expertise":{"winner":"...","reason":"..."},"track_record":{"winner":"...","reason":"..."}},"startup1Analysis":"...","startup2Analysis":"..."}`;
    const text = await runInference(apiKey, prompt, { isJSON: true });
    return JSON.parse(text.replace(/```json\n?|\n?```/g, "").trim());
  },

  // Eligibility check
  async eligibility(p) {
    const apiKey = getApiKey("eligibility");
    if (!apiKey) throw new Error("AI not configured");
    const truncate = (v: string | null, max = 300) => v ? (v.length > max ? v.substring(0, max) + "..." : v) : "N/A";
    const s = p.startup;
    const prompt = `You are an AI Investment Analyst. Analyze this startup against the investor criteria for a "Data-Driven Match Score".\n\nStartup: ${s.name || "N/A"}, Industry: ${s.industry || "N/A"}, Stage: ${s.stage || "N/A"}, Traction: ${truncate(s.traction)}, Valuation: ${s.valuation || "N/A"}, Problem: ${truncate(s.problem_solving || s.description)}\nRevenue: ${s.annual_revenue || "N/A"}, Location: ${s.location || "N/A"}, DPIIT: ${s.dpiit_recognition || "N/A"}\n\nCriteria:\n${(p.criteria || []).map((c: string) => `- ${c}`).join("\n")}\n\nSCORING: Weighted Matrix — Industry(40pts), Stage(30pts), Geography(20pts), Traction(10pts). NEVER return multiples of 5.\n\nReturn JSON: {"percentage": <0-100>, "reasoning": "<3-4 sentence summary>"}`;
    const text = await runInference(apiKey, prompt);
    const jsonStr = text.substring(text.indexOf("{"), text.lastIndexOf("}") + 1);
    return JSON.parse(jsonStr);
  },

  // Missing fields identification
  async missing_fields(p) {
    const apiKey = getApiKey("eligibility");
    if (!apiKey) throw new Error("AI not configured");
    const prompt = `Identify missing data points for eligibility refinement.\n\nProfile:\n${p.profileSummary}\n\nMandate:\n${(p.criteria || []).map((c: string) => `- ${c}`).join("\n")}\n\nReturn JSON array: [{"field":"key","label":"Question","options":["A","B","C"]}]`;
    const text = await runInference(apiKey, prompt);
    const start = text.indexOf("["), end = text.lastIndexOf("]");
    if (start === -1 || end === -1) return [];
    return JSON.parse(text.substring(start, end + 1));
  },

  // Industry insights
  async industry_insights(p) {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("AI not configured");
    const prompt = `Provide investment insights for "${p.industry}" in India.\n\nReturn JSON: {"title":"${p.industry}","desc":"...","growthData":[{"country":"India","value":22.5,"growth":"+22.5%"},{"country":"USA","value":15,"growth":"+15%"},{"country":"Europe","value":12,"growth":"+12%"},{"country":"SE Asia","value":18,"growth":"+18%"}]}`;
    const text = await runInference(apiKey, prompt);
    const jsonStr = text.substring(text.indexOf("{"), text.lastIndexOf("}") + 1);
    return JSON.parse(jsonStr);
  },

  // Refine message
  async refine_message(p) {
    const apiKey = getApiKey("assistant");
    if (!apiKey) throw new Error("AI not configured");
    const prompt = `Refine this message to be more professional for a startup-investor context.\n\nOriginal: "${p.message}"\n\nReturn ONLY the refined message as plain text.`;
    const text = await runInference(apiKey, prompt, { model: "llama-3.1-8b-instant" });
    return { text: text.trim() };
  },

  // Refine problem statement
  async refine_problem(p) {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("AI not configured");
    const prompt = `You are an expert startup advisor. Refine this problem statement.\n\nPROBLEM: "${p.problem}"\n\nReturn JSON: {"refined":"[One sentence: We help WHO achieve OUTCOME by METHOD]","improvements":["..."],"scores":{"clarity":8,"specificity":7,"impact":9}}`;
    const text = await runInference(apiKey, prompt);
    try {
      const jsonStr = text.substring(text.indexOf("{"), text.lastIndexOf("}") + 1);
      const data = JSON.parse(jsonStr);
      return { text: data.refined || text.trim() };
    } catch { return { text: text.trim() }; }
  },

  // Kasb Studio
  async studio(p) {
    const apiKey = getApiKey("studio");
    if (!apiKey) throw new Error("AI not configured");
    const TOOLS_DIR = `- MVP (Low): Lovable\n- MVP (Medium): Lovable\n- MVP (High): Replit\n- Pitch Deck: Gamma\n- Email - Cold: Claude\n- Email - Sales: Jasper\n- Marketing - Ads: Google\n- Marketing - Content: Jasper\n- UI/UX (Low): Vercel v0\n- UI/UX (Medium/High): Figma\n- Research: Perplexity AI\n- Video: Synthesia\n- Business Ops: Notion\n- Sales/Leads: Apollo.io`;
    let contextBlock = `User Query: ${p.query}`;
    if (p.previousContext) {
      contextBlock = `PREVIOUS: ${p.previousContext.tool}\nBlueprint: ${p.previousContext.blueprint}\n\nFOLLOW-UP: "${p.query}"`;
    }
    const prompt = `You are Kasb Studio AI. Suggest the best tool and generate a blueprint.\n\nTOOLS:\n${TOOLS_DIR}\n\n${contextBlock}\n\nReturn JSON: {"suggestedTool":"...","reasoning":"...","generatedPrompt":"..."}`;
    const text = await runInference(apiKey, prompt);
    const jsonStr = text.substring(text.indexOf("{"), text.lastIndexOf("}") + 1);
    return JSON.parse(jsonStr);
  },

  // Extract pitch deck details
  async extract_pitch(p) {
    const apiKey = getApiKey("pitchdeck");
    if (!apiKey) throw new Error("AI not configured");
    const truncated = (p.text || "").substring(0, 8000);
    const prompt = `Extract startup details from this pitch deck text.\n\n"${truncated}"\n\nReturn JSON: {"companyName":"","industry":"","stage":"","teamSize":"","problemSolving":"","state":"","city":"","founderName":"","solutionOverview":"","targetCustomer":"","marketSize":"","whyNow":"","tractionRevenue":"","gtmPlan":"","competitiveAdvantage":"","businessModel":"","whyYou":"","fundingAsk":"","useOfFunds":"","milestones":""}`;
    const text = await runInference(apiKey, prompt);
    const jsonStr = text.substring(text.indexOf("{"), text.lastIndexOf("}") + 1);
    return JSON.parse(jsonStr);
  },

  // Extract startup info from pitch deck (with vision support for base64 images)
  async extract_info(p) {
    const apiKey = getApiKey("pitchdeck");
    if (!apiKey) throw new Error("AI not configured");
    const client = getOpenAIClient(apiKey);
    const prompt = `Extract startup details. Return JSON: {"companyName":"","industry":"","stage":"","teamSize":"","problemSolving":"","state":"","city":"","founderName":"","solutionOverview":"","targetCustomer":"","marketSize":"","whyNow":"","tractionRevenue":"","gtmPlan":"","competitiveAdvantage":"","businessModel":"","whyYou":"","fundingAsk":"","useOfFunds":"","milestones":""}`;

    if (p.imageBase64) {
      const response = await client.chat.completions.create({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [{ role: "user", content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: `data:image/png;base64,${p.imageBase64}` } }
        ]}]
      });
      const raw = response.choices[0].message.content || "{}";
      const jsonStr = raw.substring(raw.indexOf("{"), raw.lastIndexOf("}") + 1);
      return JSON.parse(jsonStr);
    }

    const truncated = (p.text || "").substring(0, 10000);
    const text = await runInference(apiKey, `${prompt}\n\nCONTENT:\n${truncated}`);
    const jsonStr = text.substring(text.indexOf("{"), text.lastIndexOf("}") + 1);
    return JSON.parse(jsonStr);
  },

  // Document verification with OCR
  async document_ocr(p) {
    const apiKey = getApiKey("pitchdeck");
    if (!apiKey) throw new Error("AI not configured");
    const client = getOpenAIClient(apiKey);
    const prompt = `Analyze this ${p.docType} document. Extract: For PAN: pan_number, name. For Incorporation: cin, company_name. For Aadhaar: aadhaar_number, name. Return ONLY JSON.`;
    if (p.imageBase64) {
      const response = await client.chat.completions.create({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [{ role: "user", content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: `data:${p.mimeType || "image/png"};base64,${p.imageBase64}` } }
        ]}]
      });
      const raw = response.choices[0].message.content || "{}";
      const jsonStr = raw.substring(raw.indexOf("{"), raw.lastIndexOf("}") + 1);
      return { extractedFields: JSON.parse(jsonStr), confidence: 0.98 };
    }
    const text = await runInference(apiKey, `${prompt}\nContent: ${(p.text || "").substring(0, 3000)}`);
    const jsonStr = text.substring(text.indexOf("{"), text.lastIndexOf("}") + 1);
    return { extractedFields: JSON.parse(jsonStr), confidence: 0.5 };
  },

  // Document verification
  async verify_document(p) {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("AI not configured");
    const prompt = `You are a compliance AI auditor. Verify if this text belongs to a "${p.docType}".\n\nText: "${(p.text || "").substring(0, 3000)}"\n\nReturn JSON: {"valid":true,"confidence":85,"reason":"..."}`;
    const text = await runInference(apiKey, prompt, { isJSON: true });
    return JSON.parse(text.replace(/```json\n?|\n?```/g, "").trim());
  },

  // Recommendations
  async recommend(p) {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("AI not configured");
    const text = await runInference(apiKey, p.prompt);
    return { text };
  },

  // Review startup document (11-step analysis)
  async review(p) {
    const apiKey = getApiKey("review");
    if (!apiKey) throw new Error("AI not configured");
    // The review prompt is very large, so we pass it from the client
    // (prompts for review are not secret IP — they're the analysis framework)
    const text = await runInference(apiKey, p.prompt);
    const jsonStr = text.substring(text.indexOf("{"), text.lastIndexOf("}") + 1);
    return JSON.parse(jsonStr);
  },

  // Review pitch deck
  async review_pitch(p) {
    const apiKey = getApiKey("review");
    if (!apiKey) throw new Error("AI not configured");
    const text = await runInference(apiKey, p.prompt);
    const jsonStr = text.substring(text.indexOf("{"), text.lastIndexOf("}") + 1);
    return JSON.parse(jsonStr);
  },

  // Generate investor summary
  async investor_summary(p) {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("AI not configured");
    const text = await runInference(apiKey, p.prompt);
    return { text: text.trim() };
  },

  // Valuation insights
  async valuation(p) {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("AI not configured");
    const text = await runInference(apiKey, p.prompt);
    return { text: text.trim() };
  },

  // Founder analysis
  async founder_analysis(p) {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("AI not configured");
    const text = await runInference(apiKey, p.prompt);
    return { text: text.trim() };
  },

  // Analyze startup document
  async analyze_doc(p) {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("AI not configured");
    if (p.imageBase64) {
      const client = getOpenAIClient(apiKey);
      const response = await client.chat.completions.create({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [{ role: "user", content: [
          { type: "text", text: p.prompt },
          { type: "image_url", image_url: { url: `data:image/png;base64,${p.imageBase64}` } }
        ]}]
      });
      const raw = response.choices[0].message.content || "{}";
      const jsonStr = raw.substring(raw.indexOf("{"), raw.lastIndexOf("}") + 1);
      return JSON.parse(jsonStr);
    }
    const text = await runInference(apiKey, p.prompt);
    const jsonStr = text.substring(text.indexOf("{"), text.lastIndexOf("}") + 1);
    return JSON.parse(jsonStr);
  },

  // Semantic question match
  async semantic_match(p) {
    const apiKey = getApiKey();
    if (!apiKey) return { matchKey: null };
    const text = await runInference(apiKey, p.prompt, { isJSON: true });
    try {
      return JSON.parse(text.replace(/```json\n?|\n?```/g, "").trim());
    } catch { return { matchKey: null }; }
  },

  // Vision OCR for pitch deck text extraction
  async vision_ocr(p) {
    const apiKey = getApiKey("pitchdeck");
    if (!apiKey) throw new Error("AI not configured");
    const client = getOpenAIClient(apiKey);
    const response = await client.chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [{ role: "user", content: [
        { type: "text", text: "Extract ALL text visible on this slide/page. Return only text content. Include headings, bullets, numbers. Do not describe the image." },
        { type: "image_url", image_url: { url: `data:image/png;base64,${p.imageBase64}` } }
      ]}]
    });
    return { text: response.choices[0].message.content || "" };
  },

  // KYC - Aadhaar OTP
  async kyc_generate_otp(p) {
    const token = Deno.env.get("SUREPASS_API_TOKEN");
    if (!token) throw new Error("KYC service not configured");
    const response = await fetch("https://api.surepass.io/api/v1/aadhaar-v2/generate-otp", {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ id_number: p.aadhaarNumber }),
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message || "Failed to generate OTP");
    return { client_id: data.data.client_id };
  },

  // KYC - Verify OTP
  async kyc_verify_otp(p) {
    const token = Deno.env.get("SUREPASS_API_TOKEN");
    if (!token) throw new Error("KYC service not configured");
    const response = await fetch("https://api.surepass.io/api/v1/aadhaar-v2/submit-otp", {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: p.clientId, otp: p.otp }),
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message || "OTP Verification Failed");
    return { full_name: data.data.full_name, dob: data.data.dob, gender: data.data.gender, address: data.data.address };
  },
};

// ─── MAIN HANDLER ───────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const auth = await verifyAuth(req);
    if (!auth) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, payload } = await req.json();

    if (!action || !actions[action]) {
      return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await actions[action](payload || {});

    return new Response(JSON.stringify(result), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("AI Proxy Error:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
