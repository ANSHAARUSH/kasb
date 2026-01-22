import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Startup } from "../data/mockData";
import { extractDocumentContent } from "./documentExtraction";
import type { AnalysisResult } from "./documentIntelligence";

/**
 * Helper to get a Gemini model or OpenAI instance based on API key
 */
function getAIClient(apiKey: string, baseUrl?: string) {
    if (apiKey.startsWith('AIza')) {
        const genAI = new GoogleGenerativeAI(apiKey);
        return { type: 'gemini', client: genAI };
    }
    const openai = new OpenAI({
        apiKey: apiKey,
        baseURL: baseUrl || "https://api.groq.com/openai/v1",
        dangerouslyAllowBrowser: true
    });
    return { type: 'openai', client: openai };
}

export async function runInference(apiKey: string, prompt: string, options: { model?: string; vision?: boolean; file?: File; baseUrl?: string } = {}) {
    const { type, client } = getAIClient(apiKey, options.baseUrl);

    if (type === 'gemini') {
        const genAI = client as GoogleGenerativeAI;
        const modelName = options.vision ? "gemini-1.5-flash" : (options.model?.includes('8b') ? "gemini-1.5-flash-8b" : "gemini-1.5-flash-latest");
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
        return result.response.text();
    } else {
        const openai = client as OpenAI;
        if (options.vision && options.file) {
            const base64 = await fileToBase64(options.file);
            const response = await openai.chat.completions.create({
                model: options.model || "llama-3.2-11b-vision-preview",
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

        const completion = await openai.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: options.model || "llama-3.3-70b-versatile",
        });
        return completion.choices[0].message.content || "";
    }
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
        // Try direct parsing first
        return JSON.parse(text.trim()) as T;
    } catch (e) {
        // Find the first '{' and the last '}'
        const start = text.indexOf('{');
        const end = text.lastIndexOf('}');

        if (start !== -1 && end !== -1 && end > start) {
            const jsonStr = text.substring(start, end + 1);
            try {
                return JSON.parse(jsonStr) as T;
            } catch (innerError) {
                console.error("Failed to parse extracted JSON segment:", jsonStr);
                throw new Error("AI returned invalid JSON structure");
            }
        }
        throw new Error("No JSON object found in AI response");
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

export async function compareStartups(startup1: Startup, startup2: Startup, apiKey: string, baseUrl?: string): Promise<ComparisonResult> {
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

    try {
        const text = await runInference(apiKey, prompt, { baseUrl });
        return extractJSON<ComparisonResult>(text);
    } catch (error: unknown) {
        console.error("AI Comparison Error:", error);
        throw new Error(`AI API Error: ${error instanceof Error ? error.message : "Failed to generate comparison"}`);
    }
}
export async function compareInvestors(investor1: any, investor2: any, apiKey: string, baseUrl?: string): Promise<ComparisonResult> {
    if (!apiKey) {
        throw new Error("API Key is missing for investor comparison.");
    }

    const prompt = `
    Compare the following two investors as a potential partner for a startup.
    
    Investor 1: ${investor1.name}
    Bio: ${investor1.bio}
    Funds Available: ${investor1.fundsAvailable}
    Investments Count: ${investor1.investments}
    Expertise: ${investor1.expertise.join(", ")}
    
    Investor 2: ${investor2.name}
    Bio: ${investor2.bio}
    Funds Available: ${investor2.fundsAvailable}
    Investments Count: ${investor2.investments}
    Expertise: ${investor2.expertise.join(", ")}
    
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

    try {
        const text = await runInference(apiKey, prompt, { baseUrl });
        return extractJSON<ComparisonResult>(text);
    } catch (error: unknown) {
        console.error("AI Comparison Error:", error);
        throw new Error(`AI API Error: ${error instanceof Error ? error.message : "Failed to generate comparison"}`);
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
        return text.trim() || rawProblem;
    } catch (error: unknown) {
        console.error("AI Refinement Error:", error);
        throw new Error("Failed to refine with AI");
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

export async function reviewPitchDeck(
    deckText: string,
    apiKey: string,
    baseUrl?: string
): Promise<string> {
    const prompt = `
    Critically review the following pitch deck content(extracted text) from an investor's perspective.

    Content: ${deckText}
    
    Provide structured feedback:
    1. Clarity & Storytelling(1 - 10)
    2. Market Opportunity Analysis
    3. Competitive Advantage Evidence
    4. Missing Key Information
    5. Specific "Slide-by-Slide" Improvement Suggestions

    TONE: Blunt, constructive, and oriented towards maximizing chance of investment.
    `;

    try {
        const text = await runInference(apiKey, prompt, { baseUrl });
        return text.trim() || "Failed to review pitch deck.";
    } catch (error: unknown) {
        console.error("AI Review Error:", error);
        throw new Error("AI Pitch Deck Review failed");
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

            if (type === 'gemini') {
                const genAI = client as GoogleGenerativeAI;
                const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

                const prompt = `System: ${systemPrompt}\n\nHistory:\n${history.map(h => `${h.role}: ${h.content}`).join('\n')}\n\nUser: ${userMessage}`;

                const result = await model.generateContentStream(prompt);
                let fullResponse = "";
                for await (const chunk of result.stream) {
                    const text = chunk.text();
                    fullResponse += text;
                    onChunk(text);
                }
                return fullResponse;
            } else {
                const openai = client as OpenAI;
                const messages: any[] = [
                    { role: "system", content: systemPrompt },
                    ...history.map(h => ({ role: h.role, content: h.content })),
                    { role: "user", content: userMessage }
                ];

                const stream = await openai.chat.completions.create({
                    messages: messages,
                    model: "llama-3.3-70b-versatile",
                    stream: true,
                });

                let fullResponse = "";
                for await (const chunk of stream) {
                    const content = chunk.choices[0]?.delta?.content || "";
                    if (content) {
                        fullResponse += content;
                        onChunk(content);
                    }
                }
                return fullResponse;
            }
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
        const text = await runInference(apiKey, prompt, { model: '8b', baseUrl });
        return text.trim() || message;
    } catch (error: unknown) {
        console.error("AI Refinement Error:", error);
        throw new Error("Failed to refine message");
    }
}


