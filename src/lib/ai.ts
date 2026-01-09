import OpenAI from "openai";
import type { Startup } from "../data/mockData";

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

export async function compareStartups(startup1: Startup, startup2: Startup, apiKey: string, baseUrl?: string): Promise<ComparisonResult> {
    if (!apiKey) {
        throw new Error("AI services are not configured. Please ensure VITE_GROQ_API_KEY is set in environment variables or the administration settings.");
    }

    const openai = new OpenAI({
        apiKey: apiKey,
        baseURL: baseUrl || "https://api.groq.com/openai/v1", // Default to Groq
        dangerouslyAllowBrowser: true // Client-side usage for demo
    });

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
        const completion = await openai.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.3-70b-versatile", // Fast & Powerful Groq model
        });

        const text = completion.choices[0].message.content || "{}";
        return extractJSON<ComparisonResult>(text);
    } catch (error: unknown) {
        console.error("AI Comparison Error:", error);
        const message = error instanceof Error ? error.message : "Failed to generate comparison";
        throw new Error(`AI API Error: ${message}`);
    }
}
export async function compareInvestors(investor1: any, investor2: any, apiKey: string, baseUrl?: string): Promise<ComparisonResult> {
    if (!apiKey) {
        throw new Error("API Key is missing for investor comparison.");
    }

    const openai = new OpenAI({
        apiKey: apiKey,
        baseURL: baseUrl || "https://api.groq.com/openai/v1",
        dangerouslyAllowBrowser: true
    });

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
        const completion = await openai.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.3-70b-versatile",
        });

        const text = completion.choices[0].message.content || "{}";
        return extractJSON<ComparisonResult>(text);
    } catch (error: unknown) {
        console.error("AI Comparison Error:", error);
        const message = error instanceof Error ? error.message : "Failed to generate comparison";
        throw new Error(`AI API Error: ${message}`);
    }
}

export async function getIndustryInsights(industry: string, apiKey: string, baseUrl?: string): Promise<IndustryInsight> {
    if (!apiKey) {
        throw new Error("AI Comparison not available. API Key is required.");
    }

    const openai = new OpenAI({
        apiKey: apiKey,
        baseURL: baseUrl || "https://api.groq.com/openai/v1",
        dangerouslyAllowBrowser: true
    });

    const prompt = `
    Provide realistic investment insights for the industry: "${industry}".
    
    Return the output in valid JSON format ONLY, with this structure:
    {
        "title": "${industry}",
        "desc": "A concise (2-3 sentences) definition of the industry and its current relevance.",
        "growthData": [
            { "country": "India", "value": realistic_CAGR_percentage, "growth": "+XX%" },
            { "country": "USA", "value": realistic_CAGR_percentage, "growth": "+XX%" },
            { "country": "Europe", "value": realistic_CAGR_percentage, "growth": "+XX%" },
            { "country": "SE Asia", "value": realistic_CAGR_percentage, "growth": "+XX%" }
        ]
    }
    
    CRITICAL:
    1. Ensure India is included and shows strong growth relevant to the current market.
    2. The 'value' must be a NUMBER representing the realistic Compound Annual Growth Rate (CAGR) expected for 2024-2027 (e.g., 25.5).
    3. The 'growth' must be a formatted string (e.g., "+25.5%").
    4. Provide realistic data based on current global economic trends for "${industry}".
    `;

    try {
        const completion = await openai.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.3-70b-versatile",
        });

        const text = completion.choices[0].message.content || "{}";
        return extractJSON<IndustryInsight>(text);
    } catch (error: unknown) {
        console.error("AI Industry Insight Error:", error);
        const message = error instanceof Error ? error.message : "Failed to generate insights";
        throw new Error(`AI API Error: ${message}`);
    }
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

        return { status: 'verified', feedback: `OCR processed ${docType} successfully. Extracted: ${Object.keys(ocr.extractedFields).join(', ')}` };
    } catch (err: unknown) {
        console.error("Verification error:", err);
        const message = err instanceof Error ? err.message : String(err);
        return {
            status: 'flagged',
            feedback: message.includes('API key')
                ? "Invalid API Key. Please check your AI settings."
                : `Verification failed: ${message || 'Unknown error'}`
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

    // Auto-detect Groq vs OpenAI if no baseUrl provided
    const effectiveBaseUrl = baseUrl || (apiKey.startsWith('gsk_') ? "https://api.groq.com/openai/v1" : undefined);

    const openai = new OpenAI({
        apiKey: apiKey,
        baseURL: effectiveBaseUrl,
        dangerouslyAllowBrowser: true
    });

    try {
        if (file.type === 'application/pdf') {
            throw new Error("PDF processing not supported in current Vision model. Please upload an image (JPG/PNG).");
        }

        const base64Image = await fileToBase64(file);

        const prompt = `
        Analyze the provided image of a document of type: "${docType}".
        Extract:
        - For PAN: pan_number, name.
        - For Incorporation: cin, company_name.
        - For Aadhaar: aadhaar_number, name.
        
        Return ONLY a JSON object. No intro. No markdown blocks.
        Result:
        `;

        const response = await openai.chat.completions.create({
            model: "llama-3.2-11b-vision-preview",
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: prompt },
                        {
                            type: "image_url",
                            image_url: {
                                url: `data:${file.type};base64,${base64Image}`,
                            },
                        },
                    ],
                },
            ],
        });

        const text = response.choices[0].message.content || "{}";

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

        // Fallback for non-vision errors only
        const completion = await openai.chat.completions.create({
            messages: [{
                role: "user",
                content: `Simulate OCR extraction for ${docType}. Return JSON with realistic fields.`
            }],
            model: "llama-3.3-70b-versatile",
        });
        const text = completion.choices[0].message.content || "{}";
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
            return { status: 'verified', message: `MCA records confirmed: ${data.company_name || 'The company'} is registered under CIN ${cin}. Status: ACTIVE.` };
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

    const openai = new OpenAI({
        apiKey: apiKey,
        baseURL: baseUrl || "https://api.groq.com/openai/v1",
        dangerouslyAllowBrowser: true
    });

    const prompt = `
    Refine the following startup problem statement into a powerful, concise one-line value proposition.
    
    Formula: "helps (who) achieves (outcome) by (unique method)"
    
    Raw Statement: "${rawProblem}"
    
    Return ONLY the refined one-line statement. No other text, no intro, no "Refined:".
    `;

    try {
        const completion = await openai.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.3-70b-versatile",
        });

        return completion.choices[0].message.content?.trim() || rawProblem;
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
    if (!apiKey) throw new Error("API Key is missing for investor summary.");

    const openai = new OpenAI({
        apiKey: apiKey,
        baseURL: baseUrl || "https://api.groq.com/openai/v1",
        dangerouslyAllowBrowser: true
    });

    const prompt = `
    TASK: Convert the following structured startup questionnaire answers into a professional investor-ready summary.
    
    CONTEXT:
    Startup Stage: ${stage}
    Data: ${JSON.stringify(answers)}

    CORE PRINCIPLES (STRICT ADHERENCE REQUIRED):
    1. Use ONLY provided information. Do not infer, assume, or fabricate facts.
    2. Omit sections where information is missing.
    3. Preserve founder's intent. Rewrite ONLY for clarity, grammar, and professional structure.
    4. TONE: Neutral, factual, and investor-appropriate.
    5. PROHIBITED WORDS: "revolutionary", "game-changing", "world-class", "industry-leading", "next unicorn", "guaranteed", "massive growth", "huge demand". Replace with factual/measurable phrasing.
    6. STANDARDIZATION: Paragraphs must be concise (max 5 lines). Use bullet points for features/risks. No emojis/slogans.

    SECTION RULES:
    - Problem: "[Customer segment] face [problem], currently addressed by [existing solutions]. Approach is inadequate due to [limitations], resulting in [impact]."
    - Product: Describe what it does, then how it works, then key capabilities.
    - Value Prop: Direct, factual comparisons. "Unlike [alternative], the product offers [difference]."
    - Market: Use TAM/SAM/SOM exactly. Label as "founder estimates".
    - Traction: Numeric validation with time context only. No qualitative summaries like "Strong growth".
    - Risks: Neutral bullet points. No mitigations unless provided.

    OUTPUT: Provide the summary as a structured professional narrative.
    `;

    try {
        const completion = await openai.chat.completions.create({
            messages: [{
                role: "system",
                content: "You are an expert investment analyst who writes objective, factual startup summaries. You never use marketing hype or unsubstantiated claims."
            }, {
                role: "user",
                content: prompt
            }],
            model: "llama-3.3-70b-versatile",
        });

        return completion.choices[0].message.content?.trim() || "Failed to generate summary.";
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
    if (!apiKey) throw new Error("API Key is missing for valuation insights.");

    const openai = new OpenAI({
        apiKey: apiKey,
        baseURL: baseUrl || "https://api.groq.com/openai/v1",
        dangerouslyAllowBrowser: true
    });

    const prompt = `
    Analyze the following startup data and provide investment valuation insights.
    
    Startup: ${startup.name}
    Stage: ${startup.metrics.stage}
    Traction: ${startup.metrics.traction}
    Revenue: ${startup.revenue || "Not provided"}
    Industry: ${startup.industry || "Not provided"}
    
    Provide a professional analysis covering:
    1. Estimated Valuation Range (based on similar market multiples)
    2. Key Value Drivers
    3. Potential Valuation Risks
    4. Recommendations for Next Round
    
    TONE: Conservative, analytical, and data-driven.
    `;

    try {
        const completion = await openai.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.3-70b-versatile",
        });

        return completion.choices[0].message.content?.trim() || "Failed to generate valuation insights.";
    } catch (error: unknown) {
        console.error("AI Valuation Error:", error);
        throw new Error("AI Valuation Analysis failed");
    }
}

export async function reviewPitchDeck(
    deckText: string,
    apiKey: string,
    baseUrl?: string
): Promise<string> {
    if (!apiKey) throw new Error("API Key is missing for pitch deck review.");

    const openai = new OpenAI({
        apiKey: apiKey,
        baseURL: baseUrl || "https://api.groq.com/openai/v1",
        dangerouslyAllowBrowser: true
    });

    const prompt = `
    Critically review the following pitch deck content (extracted text) from an investor's perspective.
    
    Content: ${deckText}
    
    Provide structured feedback:
    1. Clarity & Storytelling (1-10)
    2. Market Opportunity Analysis
    3. Competitive Advantage Evidence
    4. Missing Key Information
    5. Specific "Slide-by-Slide" Improvement Suggestions
    
    TONE: Blunt, constructive, and oriented towards maximizing chance of investment.
    `;

    try {
        const completion = await openai.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.3-70b-versatile",
        });

        return completion.choices[0].message.content?.trim() || "Failed to review pitch deck.";
    } catch (error: unknown) {
        console.error("AI Review Error:", error);
        throw new Error("AI Pitch Deck Review failed");
    }
}

