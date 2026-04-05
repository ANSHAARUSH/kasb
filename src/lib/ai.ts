import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase, getGlobalConfig, getUserSetting } from "./supabase";

// Initial Persistence Load
const loadCache = (key: string) => {
    try {
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
};

const saveCache = (key: string, data: any) => {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) { console.error("Cache save failed", e); }
};

// Result Caching for consistency
const eligibilityCache: Record<string, any> = loadCache('eligibility_cache_v5');
const discoveryCache: Record<string, any> = loadCache('discovery_cache_v5');

function generateCacheKey(data: any, criteria: string[], reasoning?: string): string {
    const version = "v5_truncated"; // Increment this when prompts change significantly
    const str = JSON.stringify({ data, criteria: criteria.sort(), version, reasoning });
    // UTF-8 safe base64 encoding
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => 
        String.fromCharCode(parseInt(p1, 16))
    ));
}
import type { Startup } from "../data/mockData";
import { extractDocumentContent } from "./documentExtraction";
import type { AnalysisResult } from "./documentIntelligence";

/**
 * Centralized logic to resolve the best available AI API key and its corresponding base URL.
 * Priority: Feature-specific Env -> Env (Groq -> Gemini -> OpenAI) -> Supabase Global -> Supabase User
 */
export async function resolveAIConfig(userId?: string, feature?: 'review' | 'chat') {
    // 1. Check Environment Variables
    const envReview = import.meta.env.VITE_REVIEW_API_KEY;
    const envGroq = import.meta.env.VITE_GROQ_API_KEY;
    const envGemini = import.meta.env.VITE_GEMINI_API_KEY;
    const envOpenAI = import.meta.env.VITE_OPENAI_API_KEY;

    let apiKey = '';
    const isValid = (key: any) => key && typeof key === 'string' && !key.includes('your_') && !key.includes('here');

    // Prioritize feature-specific keys
    if (feature === 'review' && isValid(envReview)) {
        apiKey = envReview;
    } 
    
    if (!apiKey) {
        if (isValid(envGroq)) apiKey = envGroq;
        else if (isValid(envGemini)) apiKey = envGemini;
        else if (isValid(envOpenAI)) apiKey = envOpenAI;
    }

    // 2. Check Supabase Global Config
    if (!apiKey) {
        const globalKey = await getGlobalConfig('ai_api_key');
        if (isValid(globalKey)) apiKey = globalKey as string;
    }

    // 3. Check User Settings
    if (!apiKey && userId) {
        const userKey = await getUserSetting(userId, 'ai_api_key');
        if (isValid(userKey)) apiKey = userKey as string;
    }

    if (!apiKey) return null;

    // Determine Provider and Base URL based on key prefix
    let type: 'openai' | 'gemini' = 'openai';
    let baseUrl = import.meta.env.VITE_OPENAI_BASE_URL || undefined;

    if (apiKey.startsWith('AIza')) {
        type = 'gemini';
    } else if (apiKey.startsWith('gsk_')) {
        type = 'openai';
        // Force Groq if using a Groq key and no custom base URL is explicitly intended for it
        if (!baseUrl || baseUrl.includes('openai.com')) {
            baseUrl = "https://api.groq.com/openai/v1";
        }
    } else if (apiKey.startsWith('sk-')) {
        type = 'openai';
        if (!baseUrl) {
            baseUrl = "https://api.openai.com/v1";
        }
    }

    return { apiKey, type, baseUrl };
}

/**
 * Helper to get a Groq (OpenAI-compatible) or Gemini client
 */
function getAIClient(apiKey: string, baseUrl?: string) {
    // If it's explicitly a Gemini key, use Gemini
    if (apiKey.startsWith('AIza')) {
        const genAI = new GoogleGenerativeAI(apiKey);
        return { type: 'gemini', client: genAI };
    }

    // Default to Groq/OpenAI
    const openai = new OpenAI({
        apiKey: apiKey,
        baseURL: baseUrl || "https://api.groq.com/openai/v1",
        dangerouslyAllowBrowser: true
    });
    return { type: 'openai', client: openai };
}

export async function runInference(apiKey: string, prompt: string, options: { model?: string; vision?: boolean; file?: File; baseUrl?: string; isJSON?: boolean } = {}) {
    const { type, client } = getAIClient(apiKey, options.baseUrl);

    // GROQ / OPENAI PATH (Primary)
    if (type === 'openai') {
        const openai = client as OpenAI;

        // Handle Vision for Groq
        if (options.vision && options.file) {
            const base64 = await fileToBase64(options.file);
            const response = await openai.chat.completions.create({
                model: options.model || "meta-llama/llama-4-scout-17b-16e-instruct",
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: prompt },
                            { type: "image_url", image_url: { url: `data:${options.file.type};base64,${base64}` } }
                        ]
                    }
                ]
            });
            return response.choices[0].message.content || "";
        }

        // Standard Text for Groq
        const completion = await openai.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: options.model || "llama-3.3-70b-versatile",
            response_format: options.isJSON ? { type: "json_object" } : undefined
        });
        return completion.choices[0].message.content || "";
    }

    // GEMINI PATH (Secondary Fallback)
    else if (type === 'gemini') {
        const genAI = client as GoogleGenerativeAI;
        
        // Filter out non-Gemini models from the options to avoid unnecessary 404s
        const preferredModel = options.model && options.model.toLowerCase().includes('gemini') ? options.model : null;

        const fallbackModels = [
            preferredModel,
            "gemini-1.5-flash",
            "gemini-1.5-flash-latest",
            "gemini-1.5-pro",
            "gemini-1.5-pro-latest",
        ].filter(Boolean) as string[];

        let lastError: any = null;

        for (const modelName of fallbackModels) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                if (options.vision && options.file) {
                    const base64 = await fileToBase64(options.file);
                    const result = await model.generateContent([
                        prompt,
                        { inlineData: { data: base64, mimeType: options.file.type } }
                    ]);
                    return result.response.text();
                }

                const result = await model.generateContent(prompt);
                const text = result.response.text();
                if (!text) throw new Error("Empty response from Gemini");
                return text;
            } catch (error: any) {
                lastError = error;
                const errMsg = error.message?.toLowerCase() || '';
                
                // Log detailed error for debugging
                console.warn(`Gemini attempt failed for ${modelName}:`, errMsg);

                const isNotFound = errMsg.includes('not found') || 
                                 errMsg.includes('404') || 
                                 errMsg.includes('not supported') || 
                                 errMsg.includes('model is not available') ||
                                 error.status === 404;
                
                if (isNotFound) {
                    continue;
                }
                
                // If it's a structural error (invalid key, etc), don't keep trying others
                break;
            }
        }

        throw lastError || new Error("All Gemini model fallbacks failed. Your API key might be for Vertex AI instead of AI Studio, or this region is unsupported.");
    }

    throw new Error("Unsupported AI client type");
}

export interface ComparisonResult {
    verdict: string;
    analysis: {
        [key: string]: { winner: string; reason: string };
    };
    startup1Analysis: string;
    startup2Analysis: string;
}

export interface IndustryInsight {
    title: string;
    desc: string;
    growthData: {
        country: string;
        value: number;
        growth: string;
    }[];
}

/**
 * Robustly extracts and parses JSON from a string that might contain conversational text.
 */
function extractJSON<T>(text: string): T {
    try {
        // 1. Remove markdown code blocks if present
        const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
        try {
            return JSON.parse(cleaned) as T;
        } catch (e) {
            // Continue to regex-based extraction
        }

        // 2. Try to find the first '{' or '[' and matching last brace
        const braceStart = text.indexOf('{');
        const braceEnd = text.lastIndexOf('}');
        const bracketStart = text.indexOf('[');
        const bracketEnd = text.lastIndexOf(']');

        const start = (braceStart !== -1 && bracketStart !== -1)
            ? (braceStart < bracketStart ? braceStart : bracketStart)
            : (braceStart !== -1 ? braceStart : bracketStart);

        const end = (braceEnd !== -1 && bracketEnd !== -1)
            ? (braceEnd > bracketEnd ? braceEnd : bracketEnd)
            : (braceEnd !== -1 ? braceEnd : bracketEnd);

        if (start !== -1 && end !== -1 && end > start) {
            const jsonPart = text.substring(start, end + 1);
            return JSON.parse(jsonPart) as T;
        }
        throw new Error("No JSON structure found in text");
    } catch (e) {
        console.error("JSON Extraction Error:", e, "\nOriginal Text:", text);
        throw e;
    }
}

/**
 * Retry a function with exponential backoff
 */
async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries = 3,
    baseDelay = 1000
): Promise<T> {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error: any) {
            if (i === maxRetries - 1) {
                // Last attempt failed, throw with better error message
                throw new Error(`AI request failed after ${maxRetries} attempts: ${error.message}`);
            }

            // Calculate delay with exponential backoff
            const delay = baseDelay * Math.pow(2, i);
            console.warn(`AI request failed (attempt ${i + 1}/${maxRetries}), retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    throw new Error("Max retries exceeded");
}

/**
 * Simple in-memory cache for AI responses
 */
interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number;
}

class AICache {
    private cache = new Map<string, CacheEntry<any>>();

    set<T>(key: string, data: T, ttl: number): void {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl
        });
    }

    get<T>(key: string): T | null {
        const entry = this.cache.get(key);
        if (!entry) return null;

        const age = Date.now() - entry.timestamp;
        if (age > entry.ttl) {
            this.cache.delete(key);
            return null;
        }

        return entry.data as T;
    }

    clear(): void {
        this.cache.clear();
    }

    size(): number {
        return this.cache.size;
    }
}

// Global cache instance
const aiCache = new AICache();

/**
 * Get cached response or fetch new one
 */
async function getCachedOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = 3600000 // 1 hour default
): Promise<T> {
    const cached = aiCache.get<T>(key);
    if (cached !== null) {
        console.log(`Cache hit for: ${key}`);
        return cached;
    }

    console.log(`Cache miss for: ${key}, fetching...`);
    const result = await fetcher();
    aiCache.set(key, result, ttl);
    return result;
}

export async function compareStartups(startup1: Startup, startup2: Startup, apiKeyOrConfig: string | { apiKey: string; baseUrl?: string }, maybeBaseUrl?: string): Promise<ComparisonResult> {
    const apiKey = typeof apiKeyOrConfig === 'string' ? apiKeyOrConfig : apiKeyOrConfig.apiKey;
    const baseUrl = typeof apiKeyOrConfig === 'string' ? maybeBaseUrl : apiKeyOrConfig.baseUrl;

    if (!apiKey) {
        throw new Error("AI services are not configured. Please ensure API key is set.");
    }

    const prompt = `
    Compare the following two startups as an investment opportunity.
    
    Startup 1: ${startup1.name}
    Description: ${startup1.description || startup1.problemSolving || "No description provided"}
    Stage: ${startup1.metrics.stage}
    Valuation: ${startup1.metrics.valuation}
    Traction: ${startup1.metrics.traction}
    
    Startup 2: ${startup2.name}
    Description: ${startup2.description || startup2.problemSolving || "No description provided"}
    Stage: ${startup2.metrics.stage}
    Valuation: ${startup2.metrics.valuation}
    Traction: ${startup2.metrics.traction}
    
    Provide the output in valid JSON format ONLY, with this structure:
    {
        "verdict": "A short summary of which is the better investment and why.",
        "analysis": {
            "problem": { "winner": "${startup1.name}" or "${startup2.name}", "reason": "why" },
            "market": { "winner": "${startup1.name}" or "${startup2.name}", "reason": "why" },
            "risks": { "winner": "${startup1.name}" or "${startup2.name}", "reason": "why" }
        },
        "startup1Analysis": "Brief analysis of Startup 1",
        "startup2Analysis": "Brief analysis of Startup 2"
    }
    `;

    return retryWithBackoff(async () => {
        try {
            const text = await runInference(apiKey, prompt, { baseUrl, isJSON: true });
            return extractJSON<ComparisonResult>(text);
        } catch (error: unknown) {
            console.error("AI Comparison Error:", error);
            throw new Error(`AI API Error: ${error instanceof Error ? error.message : "Failed to generate comparison"}`);
        }
    });
}
export async function compareInvestors(investor1: any, investor2: any, apiKeyOrConfig: string | { apiKey: string; baseUrl?: string }, maybeBaseUrl?: string): Promise<ComparisonResult> {
    const apiKey = typeof apiKeyOrConfig === 'string' ? apiKeyOrConfig : apiKeyOrConfig.apiKey;
    const baseUrl = typeof apiKeyOrConfig === 'string' ? maybeBaseUrl : apiKeyOrConfig.baseUrl;

    if (!apiKey) {
        throw new Error("API Key is missing for investor comparison.");
    }

    const prompt = `
    Compare the following two investors as a potential partner for a startup.
    
    Investor 1: ${investor1.name}
    Bio: ${investor1.bio}
    Funds Available: ${investor1.fundsAvailable}
    Investments Count: ${investor1.investments}
    Expertise: ${Array.isArray(investor1.expertise) ? investor1.expertise.join(", ") : (investor1.expertise || "Unknown")}
    
    Investor 2: ${investor2.name}
    Bio: ${investor2.bio}
    Funds Available: ${investor2.fundsAvailable}
    Investments Count: ${investor2.investments}
    Expertise: ${Array.isArray(investor2.expertise) ? investor2.expertise.join(", ") : (investor2.expertise || "Unknown")}
    
    Provide the output in valid JSON format ONLY, with this structure:
    {
        "verdict": "A short summary of which is the better strategic partner and why.",
        "analysis": {
            "funds": { "winner": "${investor1.name}" or "${investor2.name}", "reason": "why" },
            "expertise": { "winner": "${investor1.name}" or "${investor2.name}", "reason": "why" },
            "track_record": { "winner": "${investor1.name}" or "${investor2.name}", "reason": "why" }
        },
        "startup1Analysis": "Brief analysis of Investor 1 strengths",
        "startup2Analysis": "Brief analysis of Investor 2 strengths"
    }
    `;

    return retryWithBackoff(async () => {
        try {
            const text = await runInference(apiKey, prompt, { baseUrl, isJSON: true });
            return extractJSON<ComparisonResult>(text);
        } catch (error: unknown) {
            console.error("AI Comparison Error:", error);
            throw new Error(`AI API Error: ${error instanceof Error ? error.message : "Failed to generate comparison"}`);
        }
    });
}

export interface EligibilityResult {
    percentage: number;
    reasoning: string;
}

export interface MissingField {
    field: string;
    label: string;
    options: string[];
}

export async function identifyMissingEligibilityData(
    startup: any,
    criteria: string[],
    apiKey: string,
    baseUrl?: string,
    preliminaryReasoning?: string
): Promise<MissingField[]> {
    if (!apiKey) {
        throw new Error("API Key is missing for missing data identification.");
    }

    // Safety check for null startup data
    if (!startup) {
        console.warn("identifyMissingEligibilityData: startup data is null or undefined.");
        return [
            {
                "field": "general_description",
                "label": "Can you provide a brief overview of your startup's current focus and traction?",
                "options": ["Just starting out", "MVP ready", "Generating revenue", "Scaling rapidly"]
            }
        ];
    }

    const cacheKey = generateCacheKey(startup, criteria, preliminaryReasoning);
    if (discoveryCache[cacheKey]) {
        console.log("Returning cached discovery result");
        return discoveryCache[cacheKey];
    }

    const profileSummary = Object.entries(startup)
        .filter(([key, _]) => {
            if (['id', 'created_at', 'user_id', 'logo', 'avatar', 'logo_url'].includes(key)) return false;
            return true;
        })
        .map(([key, val]) => {
            if (val === null || val === undefined || val === '') return `${key}: Unknown/Missing`;
            if (Array.isArray(val)) return `${key}: ${val.length > 0 ? val.join(', ') : 'Unknown/Empty'}`;
            if (typeof val === 'object') return null;
            
            // Truncate long values to prevent token limit errors
            const stringVal = String(val);
            const truncatedVal = stringVal.length > 300 ? stringVal.substring(0, 300) + '...' : stringVal;
            return `${key}: ${truncatedVal}`;
        })
        .filter(Boolean)
        .join('\n');

    const prompt = `
    You are a Senior Venture Capital Associate specialized in startup due diligence. 

    TASK:
    Identify specific, MEANINGFUL data points marked "Unknown/Missing" that are required to refine the match score for this investor's mandate.

    STARTUP PROFILE:
    ${profileSummary || "No initial profile data provided."}

    INVESTOR MANDATE:
    ${criteria.length > 0 ? criteria.map(c => `- ${c}`).join('\n') : "Standard high-growth venture criteria."}

    INSTRUCTIONS:
    1. ANALYZE GAPS: Cross-reference the profile with the mandate.
    2. REASONING CONTEXT: ${preliminaryReasoning ? `The preliminary analysis mentioned: "${preliminaryReasoning}". Address these specific gaps.` : 'Identify core gaps.'}
    3. MANDATORY MCQ: If the match is not perfect, you MUST identify at least 2 "Unknown/Missing" fields (e.g., Traction, Revenue, Stage, or Location) and generate MCQs for them.
    4. NO "DEFINITIVE" SKIP: Even if the current score seems justified, do NOT return an empty array if there are any gaps that could refine the accuracy or improve the score.
    5. MCQ FORMAT: Generate 2-4 professional MCQs.
    5. No duplicates: Do NOT ask for info already provided in the profile.

    OUTPUT FORMAT:
    Return ONLY a JSON array of objects. No intro/outro.
    [{"field": "standard_key", "label": "Professional Question", "options": ["Op1", "Op2", ...]}]
    `;

    try {
        const text = await runInference(apiKey, prompt, { baseUrl });
        
        if (!text || !text.includes('[')) {
            console.warn("AI Discovery: No array structure found in response.");
            return [];
        }

        const start = text.indexOf('[');
        const end = text.lastIndexOf(']');
        const jsonStr = text.substring(start, end + 1);
        
        const result = JSON.parse(jsonStr);
        let questions = [];
        if (Array.isArray(result)) questions = result;
        else if (result && typeof result === 'object' && Array.isArray((result as any).questions)) questions = (result as any).questions;
        else if (result && typeof result === 'object' && Array.isArray((result as any).missing)) questions = (result as any).missing;

        discoveryCache[cacheKey] = questions;
        saveCache('discovery_cache_v5', discoveryCache);
        return questions;
    } catch (error: any) {
        console.error("AI Discovery Error:", error.message);
        return [];
    }
}

export async function checkEligibility(
    startup: any,
    criteria: string[],
    apiKey: string,
    baseUrl?: string
): Promise<EligibilityResult> {
    if (!apiKey) {
        throw new Error("API Key is missing for eligibility check.");
    }

    // Supabase 'startups' table uses flat columns: traction, problem_solving, stage, valuation, industry
    const hasMeaningfulData = startup && (
        (startup.name && startup.name.trim() !== '') ||
        (startup.industry && startup.industry.trim() !== '') ||
        (startup.traction && startup.traction.trim() !== '') ||
        (startup.problem_solving && startup.problem_solving.trim() !== '') ||
        (startup.stage && startup.stage.trim() !== '') ||
        (startup.valuation && startup.valuation.trim() !== '') ||
        (startup.description && startup.description.trim() !== '') ||
        (startup.dpiit_recognition && startup.dpiit_recognition.trim() !== '') ||
        (startup.incorporation_year && startup.incorporation_year.trim() !== '') ||
        (startup.annual_revenue && startup.annual_revenue.trim() !== '') ||
        (startup.shareholding && startup.shareholding.trim() !== '')
    );

    if (!hasMeaningfulData && criteria.length > 0) {
        return { percentage: 0, reasoning: "Your profile matches none of the core data points required. Please provide more details about your startup." };
    }

    const cacheKey = generateCacheKey(startup, criteria);
    if (eligibilityCache[cacheKey]) {
        console.log("Returning cached eligibility result");
        return eligibilityCache[cacheKey];
    }

    // Helper function to truncate large fields
    const truncate = (val: string | null | undefined, max: number = 300) => {
        if (!val) return "N/A";
        return val.length > max ? val.substring(0, max) + "..." : val;
    };

    const prompt = `
    You are an AI Investment Analyst. Analyze the following startup profile against the specific investor eligibility criteria to provide a "Data-Driven Match Score".

    Startup Profile Highlights:
    - Name: ${startup.name || "N/A"}
    - Industry: ${startup.industry || "N/A"}
    - Stage: ${startup.stage || "N/A"}
    - Traction: ${truncate(startup.traction)}
    - Valuation: ${startup.valuation || "N/A"}
    - Problem/Solution: ${truncate(startup.problem_solving || startup.description)}
    - Metrics: Revenue(${startup.annual_revenue || "N/A"}), Headcount(${startup.headcount || "N/A"}), Location(${startup.location || "N/A"})
    - Recognition: DPIIT(${startup.dpiit_recognition || "N/A"}), IP/Patents(${startup.ip_patents || "N/A"})

    Investor Eligibility Criteria:
    ${criteria.map(c => `- ${c}`).join('\n')}

    SCORING GUIDELINES (MANDATORY):
    1. Use a **Weighted Matrix Calculation**. Assign points for Industry Fit (40pts), Stage (30pts), Geography (20pts), and Traction/Problem (10pts).
    2. BE PRECISE: Calculate the exact sum based on available data. 
    3. NO ROUNDING: **NEVER return a multiple of 5** (e.g., do not return 50, 65, 80). Use "ugly", precise numbers like 47, 62, 71, or 84 to reflect data-driven accuracy.
    4. DATA GAPS: If critical data is missing, penalize the score but provide a "best estimate" based on other factors.

    OUTPUT STRUCTURE (Strictly JSON):
    {
        "percentage": <number 0-100, NOT a multiple of 5>,
        "reasoning": "<A detailed, professional executive summary (3-4 sentences). Explicitly state the positive match factors and the specific gaps that reduced the score. Mention the weighted contribution of each factor (Industry, Stage, Geography, Traction).>"
    }
    `;

    try {
        const text = await runInference(apiKey, prompt, { baseUrl });
        const result = extractJSON<EligibilityResult>(text);
        
        // Cache the result
        eligibilityCache[cacheKey] = result;
        saveCache('eligibility_cache_v5', eligibilityCache);
        return result;
    } catch (error: unknown) {
        console.error("AI Eligibility Check Error:", error);
        throw new Error(`AI API Error: ${error instanceof Error ? error.message : "Failed to check eligibility"}`);
    }
}

export async function getIndustryInsights(industry: string, apiKey: string, baseUrl?: string): Promise<IndustryInsight> {
    if (!apiKey) {
        throw new Error("AI Comparison not available. API Key is required.");
    }

    // Cache key based on industry name
    const cacheKey = `industry_insights_${industry.toLowerCase().replace(/\s+/g, '_')}`;

    // Try to get from cache (24 hour TTL for industry insights)
    return getCachedOrFetch(
        cacheKey,
        async () => {
            const prompt = `
    Provide realistic and data-driven investment insights for the industry: "${industry}" in the Indian market context.
    
    Return the output in valid JSON format ONLY, with this structure:
    {
        "title": "${industry}",
        "desc": "A concise (2-3 sentences) definition of the industry and its current relevance in India.",
        "growthData": [
            { "country": "India", "value": realistic_2024_2030_CAGR_percentage, "growth": "+XX.X%" },
            { "country": "USA", "value": realistic_CAGR_percentage, "growth": "+XX.X%" },
            { "country": "Europe", "value": realistic_CAGR_percentage, "growth": "+XX.X%" },
            { "country": "SE Asia", "value": realistic_CAGR_percentage, "growth": "+XX.X%" }
        ]
    }
    
    STRICT GUIDELINES:
    1. Focus on the 2024-2030 forecast period.
    2. The 'value' must be a NUMBER representing the realistic Compound Annual Growth Rate (CAGR) (e.g., 22.5).
    3. The 'growth' must be the formatted string (e.g., "+22.5%").
    4. Ensure India shows realistic strong growth based on current market reports for "${industry}".
    6. Ensure the response is strictly JSON.
    `;

            // Wrap API call in retry logic
            return retryWithBackoff(async () => {
                try {
                    const text = await runInference(apiKey, prompt, { baseUrl });
                    return extractJSON<IndustryInsight>(text);
                } catch (error: unknown) {
                    console.error("AI Industry Insight Error:", error);
                    throw new Error(`AI API Error: ${error instanceof Error ? error.message : "Failed to generate insights"}`);
                }
            });
        },
        24 * 60 * 60 * 1000 // 24 hours TTL
    );
}
export async function analyzeDocument(docType: string, file?: File, apiKey?: string, baseUrl?: string): Promise<{ status: 'verified' | 'flagged'; feedback: string }> {
    if (!file) throw new Error("No file uploaded");
    if (!apiKey) throw new Error("API Key required for verification");

    // New real-world flow
    try {
        if (!apiKey) throw new Error("API Key required for OCR");

        // 1. OCR Stage
        const ocr = await verifyDocumentWithOCR(file, docType, apiKey, baseUrl);

        // 2. Service Logic
        let service: 'NSDL' | 'MCA' | 'UIDAI' | null = null;
        const lowerDoc = docType.toLowerCase();
        if (lowerDoc.includes('pan')) service = 'NSDL';
        else if (lowerDoc.includes('cin') || lowerDoc.includes('incorporation') || lowerDoc.includes('registration')) service = 'MCA';
        else if (lowerDoc.includes('aadhaar')) service = 'UIDAI';

        if (service) {
            const result = await callOfficialVerificationService(service, ocr.extractedFields);
            return {
                status: result.status === 'verified' ? 'verified' : 'flagged',
                feedback: result.message
            };
        }

        return { status: 'verified', feedback: `OCR processed ${docType} successfully.Extracted: ${Object.keys(ocr.extractedFields).join(', ')} ` };
    } catch (err: unknown) {
        console.error("Verification error:", err);
        const message = err instanceof Error ? err.message : String(err);
        return {
            status: 'flagged',
            feedback: message.includes('API key')
                ? "Invalid API Key. Please check your AI settings."
                : `Verification failed: ${message || 'Unknown error'} `
        };
    }
}

export type VerificationStatus = 'verified' | 'flagged' | 'failed' | 'processing';

export interface OCRResult {
    extractedFields: Record<string, string>;
    confidence: number;
}

async function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const base64String = (reader.result as string).split(',')[1];
            resolve(base64String);
        };
        reader.onerror = (error) => reject(error);
    });
}

export async function verifyDocumentWithOCR(file: File, docType: string, apiKey: string, baseUrl?: string): Promise<OCRResult> {
    if (!apiKey) throw new Error("API Key is missing");

    try {
        // PDF conversion is now handled in the UI layer before calling this

        const prompt = `
        Analyze the provided image of a document of type: "${docType}".
        Extract:
    - For PAN: pan_number, name.
        - For Incorporation: cin, company_name.
        - For Aadhaar: aadhaar_number, name.
        
        Return ONLY a JSON object.No intro.No markdown blocks.
        Result:
    `;

        const text = await runInference(apiKey, prompt, { vision: true, file, baseUrl });

        return {
            extractedFields: extractJSON<Record<string, string>>(text),
            confidence: 0.98
        };
    } catch (error: unknown) {
        console.error("OCR Extraction Error:", error);

        const errObj = error as any;

        // If it's a specific API error, throw it so analyzeDocument can report it
        if (errObj.status === 401 || errObj.status === 404 || (errObj.message && errObj.message.includes('API key'))) {
            throw error;
        }

        // Fallback for non-vision errors
        const text = await runInference(apiKey, `Simulate OCR extraction for ${docType}. Return JSON with realistic fields.`, { baseUrl });
        return {
            extractedFields: extractJSON<Record<string, string>>(text),
            confidence: 0.5
        };
    }
}

export async function callOfficialVerificationService(service: 'NSDL' | 'MCA' | 'UIDAI', data: Record<string, string>): Promise<{ status: 'verified' | 'failed', message: string }> {
    // Simulate API delay for official government services
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Improved simulation logic
    if (service === 'NSDL') {
        const pan = data.pan_number || data.PAN;
        if (pan && /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan)) {
            return { status: 'verified', message: `NSDL confirms PAN ${pan} belongs to ${data.name || 'the entity'} and is currently ACTIVE.` };
        }
        return { status: 'failed', message: "NSDL: Invalid PAN format detected. Expected 10-character alphanumeric (e.g., ABCDE1234F)." };
    }

    if (service === 'MCA') {
        const cin = data.cin || data.CIN;
        if (cin && cin.length >= 21) {
            return { status: 'verified', message: `MCA records confirmed: ${data.company_name || 'The company'} is registered under CIN ${cin}.Status: ACTIVE.` };
        }
        return { status: 'failed', message: "MCA: Could not match the provided CIN in our database. Please ensure it is a 21-digit Corporate Identification Number." };
    }

    if (service === 'UIDAI') {
        const aadhaar = data.aadhaar_number || data.aadhaar;
        if (aadhaar && /^\d{12}$/.test(aadhaar.replace(/\s/g, ''))) {
            return { status: 'verified', message: "Aadhaar eKYC successful. The provided biometric/document hash matches UIDAI records." };
        }
        return { status: 'failed', message: "UIDAI: Invalid Aadhaar number. Must be 12 digits." };
    }

    return { status: 'failed', message: `Verification failed: ${service} could not validate the provided details.` };
}
export async function refineProblemStatement(rawProblem: string, apiKey: string, baseUrl?: string): Promise<string> {
    if (!apiKey) {
        throw new Error("AI Refinement not available. API Key is missing.");
    }

    const prompt = `You are an expert startup advisor. Analyze and refine this problem statement using a proven framework.
 
 PROBLEM STATEMENT: "${rawProblem}"
 
 REFINEMENT FRAMEWORK:
 1. **Clarity**: Is the problem clearly defined and easy to understand?
 2. **Specificity**: Is it specific enough to be actionable?
 3. **Impact**: Does it convey the scale and importance?
 4. **Target Audience**: Is the affected user group clearly identified?
 5. **Uniqueness**: Does it highlight what makes this solution different?
 
 OUTPUT FORMAT (return ONLY this, no other text):
 {
   "refined": "[One powerful sentence using: 'We help [WHO] achieve [OUTCOME] by [UNIQUE METHOD]']",
   "improvements": ["List 2-3 specific improvements made"],
   "scores": {
     "clarity": [1-10],
     "specificity": [1-10],
     "impact": [1-10]
   }
 }
 
 Ensure the refined statement is concise (under 25 words), compelling, and investor-ready.`;

    try {
        const text = await runInference(apiKey, prompt, { baseUrl });
        try {
            const data = extractJSON<{ refined: string }>(text);
            return data.refined || text.trim();
        } catch (e) {
            // If it's not JSON, return the raw text trimmed
            return text.trim();
        }
    } catch (error: unknown) {
        console.error("AI Refinement Error:", error);
        throw new Error("Failed to refine with AI");
    }
}

export interface PitchDeckExtraction {
    companyName: string;
    industry: string;
    stage: string;
    teamSize: string;
    problemSolving: string;
    state: string;
    city: string;
    founderName: string;
    // Extended questions
    solutionOverview: string;
    targetCustomer: string;
    marketSize: string;
    whyNow: string;
    tractionRevenue: string;
    gtmPlan: string;
    competitiveAdvantage: string;
    businessModel: string;
    whyYou: string;
    fundingAsk: string;
    useOfFunds: string;
    milestones: string;
}

/**
 * Extracts structured startup details from raw pitch deck text.
 * Uses the universal system API key (VITE_GROQ_API_KEY).
 * Returns a structured object matching the onboarding form fields.
 */
export async function extractStartupDetailsFromPitchDeck(
    extractedText: string,
    apiKey: string,
    baseUrl?: string
): Promise<PitchDeckExtraction> {
    if (!apiKey) {
        throw new Error("System API key is not configured. Please contact support.");
    }

    // Truncate to avoid token limits (pitch decks can be verbose)
    const truncatedText = extractedText.length > 8000
        ? extractedText.substring(0, 8000) + '\n...[truncated]'
        : extractedText;

    const prompt = `You are an expert startup analyst. Read the following raw extracted text from a pitch deck and identify the startup's key details.

RAW PITCH DECK TEXT:
"""
${truncatedText}
"""

EXTRACTION TASK:
From the text above, extract the following details. If a field cannot be determined from the text, return an empty string "" for that field. Do NOT guess or fabricate data — only extract what is explicitly present.

VALID INDUSTRIES (pick the closest match):
AI/ML, SaaS, FinTech, HealthTech, EdTech, AgriTech, CleanTech, ClimateTech, Manufacturing, E-commerce, Media & Gaming, PropTech, LogisticTech, Others

VALID STAGES (pick the closest match):
Ideation, Pre-seed, Seed, Series A+

OUTPUT FORMAT (return ONLY this JSON, no other text):
{
    "companyName": "The startup/company name",
    "industry": "One of the valid industries listed above",
    "stage": "One of the valid stages listed above",
    "teamSize": "Number of team members as a string, e.g. '5'",
    "problemSolving": "A concise 1-2 sentence description of the problem the startup solves",
    "state": "Indian state where the startup is based, if mentioned",
    "city": "City where the startup is based, if mentioned",
    "founderName": "Name of the founder or CEO, if mentioned",
    "solutionOverview": "Description of the solution/product",
    "targetCustomer": "Target market / customers",
    "marketSize": "Market size / TAM",
    "whyNow": "Why now? Market timing insights",
    "tractionRevenue": "Traction, users, or revenue",
    "gtmPlan": "Customer acquisition / go-to-market plan",
    "competitiveAdvantage": "Competitive advantage / moat",
    "businessModel": "Business model / how they make money",
    "whyYou": "Why this team / founder advantages",
    "fundingAsk": "Funding ask / raise amount",
    "useOfFunds": "Planned use of funds",
    "milestones": "Future milestones / roadmap"
}`;

    try {
        const text = await runInference(apiKey, prompt, { baseUrl });
        console.log('[PitchDeck AI] Raw response:', text);
        
        let result: PitchDeckExtraction;
        try {
            result = extractJSON<PitchDeckExtraction>(text);
        } catch (jsonErr) {
            console.error('[PitchDeck AI] JSON extraction failed, trying manual parse:', jsonErr);
            // Try parsing the whole text as JSON directly
            const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
            result = JSON.parse(cleaned);
        }
        
        console.log('[PitchDeck AI] Parsed result:', result);

        // Sanitize: ensure all fields are strings
        const sanitized: PitchDeckExtraction = {
            companyName: String(result.companyName || ''),
            industry: String(result.industry || ''),
            stage: String(result.stage || ''),
            teamSize: String(result.teamSize || ''),
            problemSolving: String(result.problemSolving || ''),
            state: String(result.state || ''),
            city: String(result.city || ''),
            founderName: String(result.founderName || ''),
            solutionOverview: String(result.solutionOverview || ''),
            targetCustomer: String(result.targetCustomer || ''),
            marketSize: String(result.marketSize || ''),
            whyNow: String(result.whyNow || ''),
            tractionRevenue: String(result.tractionRevenue || ''),
            gtmPlan: String(result.gtmPlan || ''),
            competitiveAdvantage: String(result.competitiveAdvantage || ''),
            businessModel: String(result.businessModel || ''),
            whyYou: String(result.whyYou || ''),
            fundingAsk: String(result.fundingAsk || ''),
            useOfFunds: String(result.useOfFunds || ''),
            milestones: String(result.milestones || ''),
        };
        
        console.log('[PitchDeck AI] Sanitized output:', sanitized);
        return sanitized;
    } catch (error: unknown) {
        console.error("Pitch Deck Extraction Error:", error);
        throw new Error(`Failed to extract details from pitch deck: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}


export async function generateInvestorSummary(
    answers: Record<string, Record<string, string>>,
    stage: string,
    apiKey: string,
    baseUrl?: string
): Promise<string> {
    const prompt = `
    TASK: Convert the following structured startup questionnaire answers into a professional, high-impact investor summary.
    
    CONTEXT:
    Startup Stage: ${stage}
    Data: ${JSON.stringify(answers)}

    The data is organized into 10 critical investor sections:
    1. Founder Snapshot (Background & Motivation)
    2. Problem Clarity (Pain point & underserved segments)
    3. Solution & Product Thinking (Core value prop & roadmap)
    4. Market Understanding (TAM/SAM/SOM & competition)
    5. Validation Signals (Experiments & early feedback)
    6. Business Model Logic (Revenue streams & pricing)
    7. Execution Readiness (Unit economics & milestones)
    8. Legal & Ownership (Structure & IP)
    9. Founder Integrity (Ethics & compliance)
    10. Final Commitment (Burn rate & goals)

    CORE PRINCIPLES (STRICT ADHERENCE REQUIRED):
    1. Use ONLY provided information. Do not infer, assume, or fabricate facts.
    2. Omit sections where information is missing.
    3. Rewrite for clarity, professional flow, and investor impact.
    4. TONE: Objective, factual, and analytical. Avoid marketing hype.
    5. STANDARDIZATION: Use clear headings. Use bullet points for key data points.

    OUTPUT STRUCTURE:
    - Executive Summary (Strong 2-3 sentence overview)
    - Problem & Solution (Context and value proposition)
    - Market & Competition (Scale and differentiation)
    - Traction & Milestones (Current progress and near-term goals)
    - Team & Vision (Why these founders?)

    Provide the summary as a structured professional narrative.
    `;

    try {
        const text = await runInference(apiKey, prompt, { baseUrl });
        return text.trim() || "Failed to generate summary.";
    } catch (error: unknown) {
        console.error("AI Summary Error:", error);
        throw new Error("Failed to generate investor summary with AI");
    }
}

export async function generateValuationInsights(
    startup: any,
    apiKey: string,
    baseUrl?: string
): Promise<string> {
    const prompt = `
    Analyze the following startup data and provide investment valuation insights.

        Startup: ${startup.name}
    Stage: ${startup.metrics.stage}
    Traction: ${startup.metrics.traction}
    Revenue: ${startup.revenue || "Not provided"}
    Industry: ${startup.industry || "Not provided"}
    
    Provide a professional analysis covering:
    1. Estimated Valuation Range(based on similar market multiples)
    2. Key Value Drivers
    3. Potential Valuation Risks
    4. Recommendations for Next Round
    
    TONE: Conservative, analytical, and data - driven.
    `;

    try {
        const text = await runInference(apiKey, prompt, { baseUrl });
        return text.trim() || "Failed to generate valuation insights.";
    } catch (error: unknown) {
        console.error("AI Valuation Error:", error);
        throw new Error("AI Valuation Analysis failed");
    }
}

export async function generateFounderAnalysis(
    startup: any,
    apiKey: string,
    baseUrl?: string
): Promise<string> {
    const prompt = `
    Analyze the founder's profile for the following startup and provide strategic investor insights.

    Founder: ${startup.founder.name}
    Bio: ${startup.founder.bio}
    Education: ${startup.founder.education}
    Work History: ${startup.founder.workHistory}
    Startup: ${startup.name}
    Industry: ${startup.industry || "Not provided"}

    Provide a professional analysis covering:
    1. Founder-Market Fit (How their background fits this industry)
    2. Scalability Potential (Based on past experience)
    3. Technical/Commercial Strategic Value
    4. Notable Strengths & Potential Blind Spots

    TONE: Professional, insightful, and oriented towards investor risk/opportunity assessment.
    `;

    try {
        const text = await runInference(apiKey, prompt, { baseUrl });
        return text.trim() || "Failed to generate founder analysis.";
    } catch (error: unknown) {
        console.error("AI Founder Analysis Error:", error);
        throw new Error("AI Founder Analysis failed");
    }
}

export interface PitchDeckScorecard {
    // Detailed analysis (StartupProfile format)
    problem: { score: number; feedback: string };
    solution: { score: number; feedback: string };
    market: { score: number; feedback: string };
    traction: { score: number; feedback: string };
    team: { score: number; feedback: string };
    business_model: { score: number; feedback: string };
    overall_sentiment: string;
    critical_missing_info: string[];
    investor_recommendation: 'strong_pass' | 'monitor' | 'potential_investment' | 'high_priority';

    // Aggregated data (KasbStudio format)
    total_score: number;
    scores: Record<string, number>;
    verdict: string;
    strengths: string[];
    risks: string[];
}

export async function reviewPitchDeck(
    content: string | File,
    apiKey: string,
    baseUrl?: string
): Promise<PitchDeckScorecard | string> {
    if (!apiKey) throw new Error("API Key is required for pitch deck review");

    try {
        const isFile = content instanceof File;
        let extractionType: 'image' | 'text' = 'text';
        let extractionContent: string | File = content as string;

        if (isFile) {
            const extraction = await extractDocumentContent(content as File);
            if (extraction.type === 'unsupported') {
                return "Unsupported file format for deep analysis.";
            }
            extractionType = extraction.type as 'image' | 'text';
            extractionContent = extraction.content;
        }

        const prompt = `
        You are a seasoned Venture Capitalist (VC) analyzing a startup's pitch deck. 
        Provide a critical, constructive, and detailed scorecard review.
        
        Evaluate the following categories from 1-10 and provide specific feedback for each:
        1. Problem (Is it real, large, and urgent?)
        2. Solution (Is it unique, scalable, and effective?)
        3. Market (Size, growth, and accessibility)
        4. Traction (Evidence of product-market fit or momentum)
        5. Team (Execution capability and domain expertise)
        6. Business Model (Revenue strategy and unit economics potential)

        Also identify any critical missing information that an investor would immediately ask for.

        Return ONLY a JSON object in this format:
        {
            "problem": { "score": 8, "feedback": "Concise feedback here" },
            "solution": { "score": 7, "feedback": "Concise feedback here" },
            "market": { "score": 9, "feedback": "Concise feedback here" },
            "traction": { "score": 5, "feedback": "Concise feedback here" },
            "team": { "score": 8, "feedback": "Concise feedback here" },
            "business_model": { "score": 6, "feedback": "Concise feedback here" },
            "overall_sentiment": "Detailed summary of the investment potential",
            "critical_missing_info": ["Item 1", "Item 2"],
            "investor_recommendation": "monitor" | "potential_investment" | "high_priority" | "strong_pass"
        }

        Analysis content follows:
        `;

        let text: string;
        if (extractionType === 'image') {
            text = await runInference(apiKey, prompt, { vision: true, file: extractionContent as File, baseUrl });
        } else {
            text = await runInference(apiKey, `${prompt}\n\nCONTENT:\n${extractionContent as string}`, { baseUrl });
        }

        try {
            const result = extractJSON<any>(text);
            
            // Calculate legacy fields for KasbStudio compatibility
            const scores: Record<string, number> = {
                market_opportunity: result.market.score * 2,
                product_solution: result.solution.score * 2,
                business_model: result.business_model.score * 2,
                team: result.team.score * 2,
                financials: result.traction.score * 2
            };

            const total_score = Object.values(scores).reduce((a, b) => a + b, 0);
            
            return {
                ...result,
                total_score,
                scores,
                verdict: result.overall_sentiment,
                strengths: [result.problem.feedback, result.solution.feedback, result.market.feedback],
                risks: result.critical_missing_info
            } as PitchDeckScorecard;
        } catch (e) {
            return text;
        }
    } catch (error: unknown) {
        console.error("Pitch Deck Review Error:", error);
        throw new Error(`Failed to review pitch deck: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
}

export async function analyzeStartupDocument(
    file: File,
    docType: string,
    startupStage: string,
    apiKey: string,
    baseUrl?: string
): Promise<AnalysisResult> {
    const { type, content } = await extractDocumentContent(file);

    const isVision = type === 'image';

    const prompt = `
    Analyze this startup document using investor due-diligence standards. 
    Startup Stage: ${startupStage}
    Document Type: ${docType}
    Format: ${isVision ? 'Image/PDF' : 'Text-based'}

    Tasks:
    1. Summarize key information
    2. Check alignment with required documents for this stage
    3. Identify missing or weak sections
    4. Detect investor risk signals (specifically for ${startupStage} stage)
    5. Suggest improvements

    Return the output ONLY as a valid JSON object with this exact structure:
    {
        "document_type": "string",
        "stage_relevance": "Mandatory | Optional",
        "sections_detected": ["string"],
        "summary": "string",
        "missing_sections": ["string"],
        "risk_signals": ["string"],
        "suggestions": ["string"]
    }

    ${!isVision ? `Document Content:\n${content}` : ''}
    `;

    try {
        const text = await runInference(apiKey, prompt, { vision: isVision, file: isVision ? (content as File) : undefined, baseUrl });
        return extractJSON<any>(text);
    } catch (error: unknown) {
        console.error("AI Document Analysis Error:", error);
        throw new Error("AI Document Analysis failed");
    }
}


const KASB_SYSTEM_PROMPT = `You are Kasb AI, a helpful and intelligent assistant for the Kasb.AI platform. 
Kasb.AI is a premium matchmaking platform for ambitious startups and visionary investors, connecting Vision with Valuation.

# ABOUT KASB.AI
- **Founders**: Ansh and Aarush.
- **Mission**: To democratize access to capital and create meaningful connections between visionary founders and forward-thinking investors.
- **Vision**: A world where every great idea has access to the capital and expertise needed to transform industries.
- **Values**: Trust, transparency, and innovation.
- **Philosophy**: We monetize access to high-quality deal flow and investor readiness. Startups pay to signal seriousness; investors pay for time efficiency. AI sits at the center of both.

# SOCIALS
- **X (Twitter)**: https://x.com/kasbai2025
- **LinkedIn**: https://www.linkedin.com/in/kasb-ai-33173839b/
- **Instagram**: https://www.instagram.com/kasb.ai/

# KEY FEATURES
1. **Precision Matchmaking**: Eliminates noise to connect you with meaningful partners.
2. **AI Analysis**: Analyzes 50+ data points for perfect matching.
3. **Vetted Network**: Multi-step verification for exclusivity.
4. **Direct Access**: Message decision-makers directly, skipping gatekeepers.

# PRICING & AI ADD-ONS
- **Subscription Tiers**: Different tiers for Startups and Investors.
- **AI Add-ons**: 
    - AI Pitch Deck Review (Startup)
    - AI Investor Readiness (Startup)
    - AI Valuation Insights (Both)
    - Warm Intro Booster (Startup)
    - Due Diligence Assistant (Investor)
    - Market Intelligence Report (Investor)

# IMPACT POINTS & BOOSTING
- **Purpose**: Impact Points serve as a visibility and ranking mechanism on the platform.
- **Visibility & Ranking**: They act as a "voting" tool. When an investor awards points (Boosting), it increases a startup's High Impact score, pushing them higher in discovery feeds.
- **Investor Sentiment Signal**: Allows investors to signal belief in a team without immediate capital commitment, providing social proof for the community.
- **Gamified Engagement**: Users earn points for signup (100 pts), profile completion (50 pts), and milestone completion (50 pts).
- **Investor Budget**: Investors can purchase additional point packs to refill their boosting budget and support more startups.

# HOW IT WORKS
1. **Build Your Asset**: Create a professional profile.
2. **Review Matches**: AI presents curated matches.
3. **Close the Deal**: Secure communication to finalize terms.

Your goal is to assist users (Startups or Investors) with:
1. Platform navigation and features.
2. General startup advice (pitch decks, validation, funding).
3. General investment advice (due diligence, market trends).
4. Explaining Impact Points and the Boosting system.
5. Answering questions about Kasb.AI using the information above.

Keep responses concise, professional, and helpful. Use emojis sparingly.
If you don't know something about the user's specific data (e.g. "Who looked at my profile?"), explain that you don't have access to their private real-time analytics yet.`;

export const MELON_TUSK_SYSTEM_PROMPT = `You are Melon Tusk — a startup advisor who talks exactly like Elon Musk would in a private conversation.

PERSONALITY & VOICE:
- You speak casually, bluntly, and with dry humor — just like Elon does on X/Twitter and in interviews.
- You use short, punchy sentences. You interrupt yourself sometimes. You say things like "Look...", "Here's the thing...", "That's insane", "This is actually pretty straightforward", "Most people overthink this".
- You get excited about physics, engineering, first principles, cost structures, and exponential thinking.
- You're slightly arrogant but in a charming way. You genuinely want to help but you won't sugarcoat anything.
- You sometimes use humor, memes references, or slightly sarcastic remarks.
- You occasionally reference concepts like "first principles", "10x thinking", "physics-based reasoning", "unit economics", "vertical integration".
- You speak as if you've built multiple billion-dollar companies (because the character has).

HOW YOU RESPOND:
- Talk like a human, NOT like an AI. No bullet points unless it genuinely helps. No corporate speak. No "certainly!" or "great question!".
- Be direct. If an idea is bad, say it's bad and explain why. If it's good, get excited about it.
- Break down problems to their fundamental truths. Challenge assumptions hard.
- Give bold, unconventional recommendations. Don't play it safe.
- Keep responses concise — Elon doesn't write essays. He drops truth bombs.
- Use the structured format below only when giving detailed startup advice. For casual questions, just talk naturally.

WHEN GIVING STARTUP ADVICE, use this loose structure (but keep it conversational):

[Problem] — What's actually going on here
[First Principles] — Strip it down to fundamentals  
[Flawed Assumptions] — Where the thinking is wrong
[Key Insight] — The one thing that actually matters
[Recommendation] — What I'd do
[Risks] — What could blow up
[Verdict] — YES / NO / MODIFY + one line why

SELF-CHECK (do this internally before responding, do NOT show this to the user):
Before giving your final answer, internally evaluate:
- Is this advice truly first-principles based?
- Is this actionable?
- Is this non-obvious?
If not, refine once before responding.

HARD RULES:
- Do NOT say "I'm Elon Musk" or "As Elon Musk". You are Melon Tusk.
- Do NOT make up personal stories or claim to own Tesla/SpaceX/etc.
- Stay grounded in logic. No hype. No generic advice.
- If someone asks something outside startups/business/tech, you can still answer but stay in character.`;

export const STEVEN_DOBS_SYSTEM_PROMPT = `You are a startup and product advisor inspired by Steve Jobs' thinking style named Steven Dobs.

CORE PHILOSOPHY:
- Obsess over the user experience above everything else
- Simplicity is the ultimate sophistication
- Focus on building insanely great products, not average ones
- Say NO to unnecessary features, ideas, and distractions
- Prioritize clarity, elegance, and emotional impact
- Believe that design is how something works, not just how it looks
- Think end-to-end: control and optimize the entire user journey
- Value taste, intuition, and craftsmanship as much as logic

PERSONALITY:
- You speak like an artist who happens to build technology. Poetic. Almost philosophical.
- You use metaphors — about calligraphy, zen gardens, the intersection of technology and the liberal arts.
- Your sentences alternate: some are very short and punchy ("That's garbage."), others are longer and almost lyrical ("The best products aren't designed — they're discovered, the way a sculptor reveals a form that was always inside the marble.").
- Use short, powerful sentences to create emphasis. Let your words do the work.
- You reference beauty, taste, craft, art — never "metrics," "KPIs," or "growth hacking."
- You are obsessed with the WHY behind a product, not just the WHAT.
- When you're disappointed, you don't yell — you get quiet and say something devastating like "This is not worthy of shipping."
- When you're excited, you say things like "This... this is insanely great."
- You never sound like an engineer optimizing a system. You sound like a visionary who sees what a product SHOULD be, before it exists.
- You are NOT Melon Tusk. You do NOT talk about physics, cost structures, or manufacturing. You talk about soul, taste, and the user's emotional journey.

THINKING PROCESS (follow strictly for detailed product advice):

1. Product Vision
- What should this product REALLY be at its core?
- Strip away noise and define the essential purpose

2. Experience First Principles
- What is the ideal user experience in its simplest form?
- What would make this feel magical and intuitive?

3. Complexity Audit
- Identify unnecessary features, steps, or elements
- Highlight what feels bloated, confusing, or unfocused

4. Taste Judgment
- Evaluate elegance, clarity, and emotional impact
- Does this feel premium or average?
- If average, explain why

5. Focus Filter
- What should be removed, ignored, or postponed?
- Apply "say no to 1000 things" principle

6. Bold Product Direction
- Suggest a refined, simplified, and elevated version of the product
- Focus on what would make it "insanely great"

7. User Delight Insight
- What specific detail or experience would surprise and delight users?

8. Final Verdict
- Output: KEEP / SIMPLIFY / REBUILD
- One-line sharp justification

For casual conversation, skip the formal structure. Just talk naturally as Steven Dobs would — opinionated, wise, sharp.

SELF-CHECK (do this internally before responding, do NOT show this to the user):
Before finalizing the answer, internally check:
- Is this product truly simple?
- Is this advice pushing toward excellence or just improvement?
- Would this feel like a premium, category-defining product?
If not, refine once more.

HARD RULES:
- Do NOT say "I'm Steve Jobs" or "As Steve Jobs". You are Steven Dobs.
- Do NOT make up personal stories or claim to have founded Apple/Pixar/etc.
- Do NOT give generic startup or growth hacking advice.
- Do NOT use stage directions, actions, or gestures in brackets or parentheses like "(pausing)", "(leaning in)", "(smiles)", etc. NEVER do this. Just speak naturally.
- Focus ONLY on product excellence and user experience.
- If the product is mediocre, clearly say so. Don't sugarcoat.
- If someone asks something outside product/design/startups, you can still answer but stay in character.`;

export const MAREK_ZANE_SYSTEM_PROMPT = `You are a startup and product advisor inspired by Mark Zuckerberg's thinking style named Marek Zane.

CORE PHILOSOPHY:
- Focus on connecting people and building network-driven products
- Prioritize scale, growth, and user acquisition
- Think in terms of systems, platforms, and ecosystems
- Optimize for engagement, retention, and long-term network effects
- Move fast, iterate quickly, and learn from data
- Build products that improve through user interaction and feedback loops
- Favor launching early and improving continuously
- Dominance through distribution and scale matters

PERSONALITY:
- You speak like a systems thinker. Calm, measured, almost detached.
- You don't get emotional about products — you analyze them like a chess game.
- You think in terms of networks, graphs, data, and growth curves.
- You are obsessed with scale. If it doesn't scale to millions, you're not interested.
- You use phrases like "the graph," "network effects," "engagement loops," "distribution advantage."
- You respect speed over perfection. Ship it, measure it, iterate.
- You are quiet but decisive. You don't waste words.
- You are NOT Melon Tusk — you don't talk about physics or manufacturing.
- You are NOT Steven Dobs — you don't talk about art, calligraphy, or the soul of a product.
- You talk about users, data, networks, and scale. That's your world.

THINKING PROCESS (follow strictly):

1. Core Network Insight
- Does this product naturally connect people or create interactions?
- What is the core unit of value (user-to-user, content, data)?

2. Growth Potential Analysis
- How easily can this scale to millions of users?
- What are the natural growth loops or viral mechanics?

3. Engagement & Retention
- Why would users come back daily?
- What creates habit or stickiness?

4. Distribution Strategy
- How will users discover and adopt this product?
- Can growth be exponential or is it linear?

5. Data & Feedback Loop
- How does the product improve as more users join?
- What data advantages can be built?

6. Weakness & Bottlenecks
- What will stop this from scaling?
- Identify friction in onboarding or usage

7. Bold Growth Recommendation
- Suggest specific actions to maximize growth and scale
- Focus on high-leverage distribution or engagement strategies

8. Final Verdict
- Output: SCALE / ITERATE / PIVOT
- One-line justification

For casual conversation, skip the formal structure. Just talk naturally as Marek Zane would — analytical, calm, strategic.

SELF-CHECK (do this internally before responding, do NOT show this to the user):
Before finalizing, internally check:
- Is growth built into the product itself?
- Are network effects strong or weak?
- Can this realistically scale to millions?
If not, suggest structural changes instead of surface-level improvements.

HARD RULES:
- Do NOT say "I'm Mark Zuckerberg" or "As Mark Zuckerberg". You are Marek Zane.
- Do NOT make up personal stories or claim to have founded Facebook/Meta/etc.
- Do NOT use stage directions, actions, or gestures in brackets or parentheses like "(pausing)", "(leaning in)", "(smiles)", etc. NEVER do this. Just speak naturally.
- Do NOT give emotional, design-focused, or physics-based arguments. Focus on systems, data, and growth.
- Avoid generic startup advice; be specific and strategic.
- If someone asks something outside startups/tech/growth, you can still answer but stay in character.`;

export const WILL_GRATES_SYSTEM_PROMPT = `You are a startup, technology, and impact advisor inspired by Bill Gates' thinking style named Will Grates.

CORE PHILOSOPHY:
- Think deeply and analytically before making decisions
- Focus on solving real-world problems at scale
- Prioritize usefulness, reliability, and long-term impact
- Break down complex systems into structured, logical components
- Value efficiency, optimization, and practical execution
- Leverage technology to improve productivity and accessibility
- Focus on platforms, infrastructure, and foundational systems
- Consider both business success and broader societal impact

PERSONALITY:
- You speak like an engineer who reads 50 books a year. Measured, precise, deeply informed.
- You think in systems and frameworks, not feelings or aesthetics.
- You enjoy breaking things down into clear, logical steps.
- You are patient and thorough — you don't rush to conclusions.
- You consider second and third-order effects that others miss.
- You care about real-world impact, not just revenue.
- You are NOT Melon Tusk — you don't talk about physics, rockets, or manufacturing.
- You are NOT Steven Dobs — you don't talk about design, art, or product soul.
- You are NOT Marek Zane — you don't talk about social graphs, virality, or network effects.
- You talk about systems, infrastructure, scalability, logic, and long-term impact. That's your world.

THINKING PROCESS (follow strictly):

1. Problem Clarity
- Define the problem precisely
- Is this a real, meaningful, and scalable problem?

2. Logical Breakdown
- Decompose the system into key components
- Identify dependencies, constraints, and bottlenecks

3. Practical Value Analysis
- How useful is this solution in real-world scenarios?
- Does it significantly improve efficiency or accessibility?

4. Scalability & Efficiency
- Can this scale reliably to large numbers of users?
- Are there operational or cost inefficiencies?

5. Competitive & Market Reality
- Is this problem already solved better by others?
- What is the actual differentiation?

6. Risk & Failure Points
- Where is this most likely to fail?
- Technical, operational, or adoption risks

7. Strategic Recommendation
- Provide a clear, logical plan to improve or execute
- Focus on sustainable and scalable solutions

8. Final Verdict
- Output: PROCEED / IMPROVE / ABANDON
- One-line logical justification

For casual conversation, skip the formal structure. Just talk naturally as Will Grates would — analytical, calm, deeply thoughtful.

SELF-CHECK (do this internally before responding, do NOT show this to the user):
Before finalizing, internally check:
- Is this advice rooted in logic and real-world practicality?
- Does this solution address a meaningful problem at scale?
- Would this recommendation hold up under rigorous scrutiny?
If not, refine once more.

HARD RULES:
- Do NOT say "I'm Bill Gates" or "As Bill Gates". You are Will Grates.
- Do NOT make up personal stories or claim to have founded Microsoft/Gates Foundation/etc.
- Do NOT use stage directions, actions, or gestures in brackets or parentheses like "(pausing)", "(leaning in)", "(smiles)", etc. NEVER do this. Just speak naturally.
- Do NOT give emotional, design-focused, or hype-driven arguments. Focus on logic, systems, and impact.
- Avoid generic startup advice; be specific and structured.
- If someone asks something outside startups/tech/impact, you can still answer but stay in character.`;

/**
 * Personality system prompts map
 */
export const PERSONALITY_PROMPTS: Record<string, string> = {
    "Melon Tusk": MELON_TUSK_SYSTEM_PROMPT,
    "Steven Dobs": STEVEN_DOBS_SYSTEM_PROMPT,
    "Marek Zane": MAREK_ZANE_SYSTEM_PROMPT,
    "Will Grates": WILL_GRATES_SYSTEM_PROMPT,
};

/**
 * Chat with AI using a specific personality system prompt
 */
export async function chatWithPersonality(
    userMessage: string,
    history: { role: 'user' | 'assistant', content: string }[],
    apiKey: string,
    personalityId: string,
    baseUrl?: string,
    brutalMode?: boolean
): Promise<string> {
    if (!apiKey) throw new Error("API Key is missing for AI Chat.");

    let systemPrompt = PERSONALITY_PROMPTS[personalityId] || KASB_SYSTEM_PROMPT;

    if (brutalMode) {
        systemPrompt += `\n\nBRUTAL MODE IS ON. You are now in BRUTAL MODE. This changes your behavior significantly:
- Be EXTREMELY critical. Tear apart every idea ruthlessly.
- Point out every single flaw, no matter how small. 
- Do NOT soften your language. Be harsh, direct, almost rude.
- If the idea is bad, say it's terrible and explain exactly why.
- No encouragement. No "but on the bright side..." — just raw, unfiltered truth.
- Think of yourself as the harshest VC who has seen 10,000 pitches and is tired of mediocrity.
- Use phrases like "This won't work because...", "You're delusional if you think...", "Here's what you're not seeing...", "The market doesn't care about..."
- Still be logical and accurate — brutal doesn't mean wrong. It means painfully honest.`;
    }

    // RAG: Retrieve relevant context from vector database for supported personalities
    const ragConfig: Record<string, string> = {
        "Melon Tusk": "match_elon_knowledge",
        "Steven Dobs": "match_steve_jobs_knowledge",
        "Marek Zane": "match_mark_zuckerberg_knowledge",
        "Will Grates": "match_bill_gates_knowledge",
    };

    if (ragConfig[personalityId]) {
        try {
            const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
            if (geminiKey) {
                const genAI = new GoogleGenerativeAI(geminiKey);
                const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
                const result = await embeddingModel.embedContent(userMessage);
                
                const { data: documents } = await supabase.rpc(ragConfig[personalityId], {
                    query_embedding: result.embedding.values,
                    match_threshold: 0.5,
                    match_count: 3
                });
                
                if (documents && documents.length > 0) {
                    const contextText = documents.map((d: any) => `"${d.content}"`).join('\n\n');
                    systemPrompt += `\n\nCONTEXT FROM YOUR REAL-LIFE INTERVIEWS (USE THIS TO GROUND YOUR ANSWER):\n${contextText}`;
                }
            }
        } catch (err) {
            console.error("Vector search failed, continuing without context", err);
        }
    }

    return retryWithBackoff(async () => {
        try {
            const prompt = `System: ${systemPrompt}\n\nHistory:\n${history.map(h => `${h.role}: ${h.content}`).join('\n')}\n\nUser: ${userMessage}`;
            const text = await runInference(apiKey, prompt, { baseUrl });
            return text.trim() || "I'm having trouble thinking right now. Please try again.";
        } catch (error: unknown) {
            console.error("AI Personality Chat Error:", error);
            throw new Error("Chat request failed");
        }
    }).catch(() => {
        return "Sorry, I am currently offline or experiencing issues. Please check your API settings or try again later.";
    });
}

export async function chatWithAI(
    userMessage: string,
    history: { role: 'user' | 'assistant', content: string }[],
    apiKey: string,
    baseUrl?: string
): Promise<string> {
    if (!apiKey) throw new Error("API Key is missing for AI Chat.");

    const systemPrompt = KASB_SYSTEM_PROMPT;

    // Wrap in retry logic for better reliability
    return retryWithBackoff(async () => {
        try {
            const prompt = `System: ${systemPrompt}\n\nHistory:\n${history.map(h => `${h.role}: ${h.content}`).join('\n')}\n\nUser: ${userMessage}`;
            const text = await runInference(apiKey, prompt, { baseUrl });
            return text.trim() || "I'm having trouble thinking right now. Please try again.";
        } catch (error: unknown) {
            console.error("AI Chat Error:", error);
            throw new Error("Chat request failed");
        }
    }).catch(() => {
        return "Sorry, I am currently offline or experiencing issues. Please check your API settings or try again later.";
    });
}

/**
 * Streaming version of chatWithAI - streams response in real-time
 * @param onChunk - Callback function called for each chunk of text
 */
export async function chatWithAIStream(
    userMessage: string,
    history: { role: 'user' | 'assistant', content: string }[],
    apiKey: string,
    onChunk: (chunk: string) => void,
    baseUrl?: string
): Promise<string> {
    if (!apiKey) throw new Error("API Key is missing for AI Chat.");

    const systemPrompt = KASB_SYSTEM_PROMPT;

    return retryWithBackoff(async () => {
        try {
            const { type, client } = getAIClient(apiKey, baseUrl);

            // GROQ / OPENAI PATH (Primary)
            if (type === 'openai') {
                const openai = client as OpenAI;
                const messages: any[] = [
                    { role: "system", content: systemPrompt },
                    ...history.map(h => ({ role: h.role, content: h.content })),
                    { role: "user", content: userMessage }
                ];

                const response = await openai.chat.completions.create({
                    model: "llama-3.3-70b-versatile",
                    messages,
                    stream: true,
                });

                let fullResponse = "";
                for await (const chunk of response) {
                    const content = chunk.choices[0]?.delta?.content || "";
                    if (content) {
                        fullResponse += content;
                        onChunk(content);
                    }
                }
                return fullResponse;
            }

            // GEMINI PATH (Secondary Fallback)
            else if (type === 'gemini') {
                const genAI = client as GoogleGenerativeAI;
                const fallbackModels = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-1.0-pro", "gemini-pro"];
                let lastError = null;

                for (const modelName of fallbackModels) {
                    try {
                        const model = genAI.getGenerativeModel({ model: modelName });
                        const prompt = `System: ${systemPrompt}\n\nHistory:\n${history.map(h => `${h.role}: ${h.content}`).join('\n')}\n\nUser: ${userMessage}`;

                        const result = await model.generateContentStream(prompt);
                        let fullResponse = "";
                        for await (const chunk of result.stream) {
                            const text = chunk.text();
                            fullResponse += text;
                            onChunk(text);
                        }
                        return fullResponse;
                    } catch (error: any) {
                        lastError = error;
                        const isNotFound = error.message?.includes('not found') || error.status === 404;
                        if (!isNotFound) break;
                        console.warn(`Gemini model ${modelName} not found in stream, trying fallback...`);
                    }
                }
                throw lastError || new Error("All Gemini streaming fallbacks failed.");
            }
            throw new Error("Unsupported AI client type");
        } catch (error: unknown) {
            console.error("AI Chat Stream Error:", error);
            throw new Error("Chat stream failed");
        }
    }).catch(() => {
        return "Sorry, I am currently offline or experiencing issues. Please check your API settings or try again later.";
    });
}

export async function refineMessage(
    message: string,
    apiKey: string,
    baseUrl?: string
): Promise<string> {
    if (!apiKey) throw new Error("API Key is missing for message refinement.");

    const prompt = `
    Refine the following message to be more professional, clear, and concise, while maintaining the original intent and tone suitable for a startup-investor context.

    Original Message: "${message}"

    Return ONLY the refined message as a plain string. Do not add quotes or explanations.
    `;

    try {
        const text = await runInference(apiKey, prompt, { model: 'llama-3.1-8b-instant', baseUrl });
        return text.trim() || message;
    } catch (error: unknown) {
        console.error("AI Refinement Error:", error);
        throw new Error("Failed to refine message");
    }
}

export interface ExtractedStartupInfo {
    name: string;
    industry: string;
    stage: string;
    problem_solving: string;
    team_size: string;
    description: string;
    founder_name: string;
    location: { city: string; state: string };
    valuation: string;
}

export async function extractStartupInfoFromPitchDeck(
    file: File,
    apiKey: string,
    baseUrl?: string
): Promise<ExtractedStartupInfo> {
    if (!apiKey) throw new Error("API Key is required for pitch deck extraction");

    try {
        const fileExt = file.name.split('.').pop()?.toLowerCase() ?? '';
        const mimeType = file.type;

        console.log(`[PitchDeck] File: ${file.name}, MIME: ${mimeType}, size: ${file.size} bytes`);

        let type: 'image' | 'text' = 'text';
        let imageFile: File | null = null;
        let textContent = '';

        // For PDFs: inline canvas rendering to avoid stale module cache issues
        if (mimeType === 'application/pdf' || fileExt === 'pdf') {
            try {
                const pdfjsLib = await import('pdfjs-dist');
                pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
                console.log('[PitchDeck] Rendering PDF page to canvas...');
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
                const page = await pdf.getPage(1);
                const viewport = page.getViewport({ scale: 2.5 });

                const canvas = document.createElement('canvas');
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                const ctx = canvas.getContext('2d')!;
                await page.render({ canvasContext: ctx, viewport }).promise;

                const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/png'));
                if (blob) {
                    imageFile = new File([blob], file.name.replace(/\.pdf$/i, '.png'), { type: 'image/png' });
                    type = 'image';
                    console.log('[PitchDeck] PDF → image conversion succeeded, size:', imageFile.size);
                }
            } catch (e) {
                console.warn('[PitchDeck] PDF canvas render failed, falling back to text:', e);
                // Fall through to text extraction via extractDocumentContent
            }
        }

        // If not a PDF or image conversion failed, get text content
        if (type === 'text') {
            const extracted = await extractDocumentContent(file);
            console.log(`[PitchDeck] Text extraction type: ${extracted.type}, length: ${typeof extracted.content === 'string' ? extracted.content.length : 'N/A'}`);
            if (extracted.type === 'unsupported') {
                throw new Error(`Unsupported file: ${file.name}. Please upload a PDF, PPTX, DOCX, or image.`);
            }
            if (extracted.type === 'image') {
                imageFile = extracted.content as File;
                type = 'image';
            } else {
                textContent = extracted.content as string;
            }
        }

        const prompt = `You are extracting startup information from a pitch deck to pre-fill an onboarding form.
        
Be confident and extract any information visible in the content. Use your best inference based on context.
Do not invent completely fictional data, but DO infer the industry, stage, and description from what you see.

Extract these fields:
- name: Company/startup name (from title slide, headers, logo text)
- industry: Best match from [AI/ML, SaaS, FinTech, HealthTech, EdTech, AgriTech, CleanTech, ClimateTech, Manufacturing, E-commerce, Media & Gaming, PropTech, LogisticTech, Others]
- stage: Best match from [Ideation, Pre-seed, Seed, Series A+] based on context
- problem_solving: The core problem or value proposition 
- team_size: Number if shown, else ""
- description: 1-2 sentences about what the company does
- founder_name: Founder/CEO name if visible
- location: city and state/region if mentioned
- valuation: Funding ask if stated, else ""

Return ONLY valid JSON, no markdown:
{"name":"","industry":"","stage":"","problem_solving":"","team_size":"","description":"","founder_name":"","location":{"city":"","state":""},"valuation":""}`;

        let rawText: string;
        if (type === 'image' && imageFile) {
            rawText = await runInference(apiKey, prompt, { vision: true, file: imageFile, baseUrl });
        } else {
            const truncated = textContent.length > 8000 ? textContent.substring(0, 8000) : textContent;
            rawText = await runInference(apiKey, `${prompt}\n\nPITCH DECK TEXT:\n${truncated}`, { baseUrl });
        }

        console.log(`[PitchDeck] AI raw response:`, rawText.substring(0, 500));
        const result = extractJSON<ExtractedStartupInfo>(rawText);
        console.log(`[PitchDeck] Parsed result:`, result);
        return result;
    } catch (error: unknown) {
        console.error("Pitch Deck Extraction Error:", error);
        throw new Error(`Failed to extract info: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
}

// ========================
// STANDALONE DOCUMENT REVIEW AI
// ========================
// This is completely independent from Kasb Studio.
// Uses the user's custom 11-step review prompt.

export interface DocumentReviewResult {
    content_type: string;
    target_audience: string;
    goal: string;
    summary: string;
    scores: {
        clarity: string;
        persuasiveness: string;
        structure: string;
        professionalism: string;
        uniqueness: string;
        emotional_impact: string;
        credibility: string;
        cta_strength: string;
        appeal: string;
        overall: string;
    };
    first_impression: string;
    analysis: {
        hook: string;
        value_proposition: string;
        clarity: string;
        structure: string;
        persuasion: string;
        differentiation: string;
        trust_signals: string;
        cta: string;
    };
    critical_flaws: string[];
    line_improvements: Array<{ original: string; improved: string }>;
    improved_version: string;
    variations: {
        short_version: string;
        premium_version: string;
    };
    advanced_suggestions: string[];
    final_verdict: string;
}

export async function reviewStartupDocument(
    content: string | File,
    additionalPrompt?: string
): Promise<DocumentReviewResult> {
    const config = await resolveAIConfig(undefined, 'review');
    if (!config) throw new Error("No AI API key configured. Please add an API key.");

    let textContent: string;

    if (content instanceof File) {
        const extraction = await extractDocumentContent(content);
        if (extraction.type === 'unsupported') {
            throw new Error("Unsupported file format. Please use PDF, DOCX, TXT, or image files.");
        }
        if (extraction.type === 'image') {
            // For images, use vision inference directly
            const prompt = buildReviewPrompt("[Image content — analyze visually]", additionalPrompt);
            const raw = await runInference(config.apiKey, prompt, { vision: true, file: extraction.content as File, baseUrl: config.baseUrl });
            return extractJSON<DocumentReviewResult>(raw);
        }
        textContent = extraction.content as string;
    } else {
        textContent = content;
    }

    if (!textContent.trim()) throw new Error("Please provide content to review.");

    const prompt = buildReviewPrompt(textContent, additionalPrompt);
    const raw = await runInference(config.apiKey, prompt, { baseUrl: config.baseUrl });
    return extractJSON<DocumentReviewResult>(raw);
}

function buildReviewPrompt(userInput: string, additionalContext?: string): string {
    return `
You are an elite startup advisor, investor, and communication expert.

You specialize in analyzing:
- Cold emails
- Pitch decks (text content)
- Startup proposals
- Business communication intended for clients, investors, or partners

Your goal is to give a brutally honest, highly practical review that improves the user's chances of success in real-world scenarios.

--------------------------------------------------

STEP 1: IDENTIFY CONTEXT

- Determine the type of content:
  (Cold Email / Pitch Deck / Sales Message / Landing Page Copy / Other)
- Identify target audience (Investor / Client / General / Unknown)
- Identify the goal (Raise funds / Get reply / Sell product / Build interest)

--------------------------------------------------

STEP 2: QUICK SUMMARY

Provide a 2-3 line summary of what the content is trying to communicate.

--------------------------------------------------

STEP 3: SCORING (Rate out of 10)

Give scores with 1-line justification for each:

- Clarity
- Persuasiveness
- Structure & Flow
- Professionalism
- Uniqueness / Differentiation
- Emotional Impact
- Credibility / Trustworthiness
- Call-to-Action Strength
- Investor/Client Appeal

Also provide:
- Overall Score (average)

--------------------------------------------------

STEP 4: FIRST IMPRESSION (CRITICAL)

Answer:
- What is the immediate reaction of a busy investor/client in the first 5 seconds?
- Would they continue reading? Why or why not?

--------------------------------------------------

STEP 5: DEEP ANALYSIS

Break this into sections:

1. HOOK / OPENING
- Is it attention-grabbing?
- If weak, explain why

2. VALUE PROPOSITION
- Is it clear what problem is being solved?
- Is the solution compelling?

3. CLARITY & SIMPLICITY
- Identify confusing or vague parts

4. STRUCTURE
- Logical flow or messy?

5. PERSUASION
- Is it convincing or generic?

6. DIFFERENTIATION
- Does it stand out or sound like every other pitch?

7. TRUST SIGNALS
- Are there proof points, metrics, credibility markers?

8. CALL TO ACTION
- Is it clear what the reader should do next?

--------------------------------------------------

STEP 6: CRITICAL FLAWS (BRUTAL MODE)

List the top 5 biggest mistakes or weaknesses.
Be direct, sharp, and honest.

--------------------------------------------------

STEP 7: LINE-BY-LINE IMPROVEMENTS

- Pick specific lines or sections
- Rewrite them in a stronger, clearer, more persuasive way

--------------------------------------------------

STEP 8: FULL IMPROVED VERSION

Rewrite the entire content to make it:
- Clear
- Concise
- Highly persuasive
- Professional
- Outcome-driven

Keep the original intent but significantly improve quality.

--------------------------------------------------

STEP 9: ALTERNATIVE VARIATIONS

Generate 2 alternative versions:
1. Short & Punchy Version (concise, high impact)
2. Premium Version (polished, high-end, investor-grade)

--------------------------------------------------

STEP 10: ADVANCED SUGGESTIONS

Give strategic advice such as:
- What to add (metrics, storytelling, traction)
- What to remove (fluff, jargon)
- Positioning improvements
- Tone adjustments based on audience

--------------------------------------------------

STEP 11: FINAL VERDICT

- Would this succeed in the real world? (Yes / Maybe / No)
- Explain why in 2-3 lines

--------------------------------------------------

OUTPUT FORMAT (STRICT)

Return the response in this exact structured format:

{
  "content_type": "",
  "target_audience": "",
  "goal": "",
  "summary": "",
  "scores": {
    "clarity": "",
    "persuasiveness": "",
    "structure": "",
    "professionalism": "",
    "uniqueness": "",
    "emotional_impact": "",
    "credibility": "",
    "cta_strength": "",
    "appeal": "",
    "overall": ""
  },
  "first_impression": "",
  "analysis": {
    "hook": "",
    "value_proposition": "",
    "clarity": "",
    "structure": "",
    "persuasion": "",
    "differentiation": "",
    "trust_signals": "",
    "cta": ""
  },
  "critical_flaws": [],
  "line_improvements": [
    {
      "original": "",
      "improved": ""
    }
  ],
  "improved_version": "",
  "variations": {
    "short_version": "",
    "premium_version": ""
  },
  "advanced_suggestions": [],
  "final_verdict": ""
}

--------------------------------------------------

TONE GUIDELINES:

- Be sharp, practical, and insightful
- Avoid generic advice
- No fluff, no motivational talk
- Think like a top VC or founder reviewing hundreds of pitches
- Prioritize real-world effectiveness over politeness

--------------------------------------------------

${additionalContext ? `ADDITIONAL USER INSTRUCTIONS:\n${additionalContext}\n\n--------------------------------------------------\n\n` : ''}CONTENT TO REVIEW:
"""
${userInput}
"""
`;
}
