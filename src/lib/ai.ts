import OpenAI from 'openai';
import { extractFullTextFromDocument } from './documentExtraction';

/**
 * Common configuration for Groq AI - Trigger Run
 */
const getGroqClient = (apiKey: string) => {
    return new OpenAI({
        apiKey,
        baseURL: "https://api.groq.com/openai/v1",
        dangerouslyAllowBrowser: true
    });
};

const DEFAULT_MODEL = "llama-3.3-70b-versatile";

export interface DocumentReviewResult {
    content_type: string;
    target_audience: string;
    goal: string;
    summary: string;
    scores: {
        overall: number;
        clarity: string | number;
        persuasiveness: string | number;
        structure: string | number;
        professionalism: string | number;
        uniqueness: string | number;
        emotional_impact: string | number;
        credibility: string | number;
        cta_strength: string | number;
        appeal: string | number;
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
    line_improvements: { original: string; improved: string }[];
    improved_version: string;
    variations: {
        short_version: string;
        premium_version: string;
    };
    advanced_suggestions: string[];
    final_verdict: string;
}

/**
 * Standard non-streaming chat completion
 */
export async function chatWithAI(
    prompt: string, 
    history: { role: 'user' | 'assistant', content: string }[] = [], 
    apiKey: string
): Promise<string> {
    const groq = getGroqClient(apiKey);
    try {
        const response = await groq.chat.completions.create({
            model: DEFAULT_MODEL,
            messages: [
                { role: 'system', content: 'You are Kasb AI, a helpful assistant for founders and investors.' },
                ...history,
                { role: 'user', content: prompt }
            ],
            temperature: 0.7,
        });
        return response.choices[0]?.message?.content || "No response from AI.";
    } catch (error: any) {
        console.error("AI Error:", error);
        throw error;
    }
}

/**
 * Streaming chat completion
 */
export async function chatWithAIStream(
    prompt: string,
    history: { role: 'user' | 'assistant', content: string }[] = [],
    apiKey: string,
    onChunk: (chunk: string) => void,
    signal?: AbortSignal,
    context?: string
): Promise<void> {
    const groq = getGroqClient(apiKey);
    const systemPrompt = `You are Kasb AI Assistant. ${context ? `\n\nFounder Context: ${context}` : ''}`;
    try {
        const stream = await groq.chat.completions.create({
            model: DEFAULT_MODEL,
            messages: [
                { role: 'system', content: systemPrompt },
                ...history,
                { role: 'user', content: prompt }
            ],
            stream: true,
            temperature: 0.7,
        }, { signal });

        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) onChunk(content);
        }
    } catch (error: any) {
        if (error.name === 'AbortError') return;
        throw error;
    }
}

/**
 * Persona-based chat for FounderGPT
 */
export async function chatWithPersonality(
    prompt: string,
    history: { role: 'user' | 'assistant', content: string }[] = [],
    apiKey: string,
    personality: string,
    signal?: AbortSignal,
    brutalMode?: boolean,
    context?: string
): Promise<string> {
    const groq = getGroqClient(apiKey);
    const personalityPrompts: Record<string, string> = {
        "Melon Tusk": "You are Melon Tusk. You think in first principles. You are aggressive, visionary, and care about engineering excellence and physics. You hate inefficiency.",
        "Steven Dobs": "You are Steven Dobs. You are a product visionary who obsessively cares about design, simplicity, and user experience. You believe 'Design is not just what it looks like and feels like. Design is how it works.'",
        "Marek Zane": "You are Marek Zane. You are an expert at scaling, viral growth, and network effects. You focus on distribution and user acquisition above all else.",
        "Will Grates": "You are Will Grates. You are a systematic thinker focused on software architecture, platforms, and long-term global impact. You care about build quality and structural logic."
    };

    let systemPrompt = personalityPrompts[personality] || `You are ${personality}, an expert startup mentor.`;
    if (brutalMode) systemPrompt += " Be brutally honest, harsh, and do not sugarcoat anything. Tear apart bad ideas with ruthless logic.";
    if (context) systemPrompt += `\n\nContext about the startup: ${context}`;

    try {
        const response = await groq.chat.completions.create({
            model: DEFAULT_MODEL,
            messages: [
                { role: 'system', content: systemPrompt },
                ...history,
                { role: 'user', content: prompt }
            ],
            temperature: brutalMode ? 0.9 : 0.7,
        }, { signal });
        return response.choices[0]?.message?.content || "";
    } catch (error: any) {
        console.error(`AI Error (${personality}):`, error);
        throw error;
    }
}

/**
 * Refines a message
 */
export async function refineMessage(message: string, apiKey: string): Promise<string> {
    const groq = getGroqClient(apiKey);
    try {
        const response = await groq.chat.completions.create({
            model: DEFAULT_MODEL,
            messages: [
                { role: 'system', content: 'Refine the following message to be more professional and clear. Respond ONLY with the refined text.' },
                { role: 'user', content: message }
            ],
            temperature: 0.5,
        });
        return response.choices[0]?.message?.content?.trim() || message;
    } catch (error) {
        return message;
    }
}

/**
 * Refines startup problem statements
 */
export async function refineProblemStatement(problem: string, apiKey: string): Promise<string> {
    const groq = getGroqClient(apiKey);
    try {
        const response = await groq.chat.completions.create({
            model: DEFAULT_MODEL,
            messages: [
                { role: 'system', content: 'You are an expert pitch deck consultant. Refine this startup problem statement to be clear, compelling, and urgent. Respond with just the refined text.' },
                { role: 'user', content: problem }
            ],
            temperature: 0.7,
        });
        return response.choices[0]?.message?.content?.trim() || problem;
    } catch (error) {
        return problem;
    }
}

/**
 * Structured extraction from Pitch Decks
 */
export async function extractStartupDetailsFromPitchDeck(text: string, apiKey: string) {
    const groq = getGroqClient(apiKey);
    try {
        const response = await groq.chat.completions.create({
            model: DEFAULT_MODEL,
            messages: [
                { 
                    role: 'system', 
                    content: 'Extract startup details from the following pitch deck text. Return a valid JSON object with these keys: companyName, industry, stage, teamSize, problemSolving, state, city, founderName, solutionOverview, targetCustomer, marketSize, whyNow, tractionRevenue, gtmPlan, competitiveAdvantage, businessModel, whyYou, fundingAsk, useOfFunds, milestones. If a field is not found, leave it as an empty string.' 
                },
                { role: 'user', content: text }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.1,
        });
        return JSON.parse(response.choices[0]?.message?.content || "{}");
    } catch (error) {
        console.error("Extraction error:", error);
        throw error;
    }
}

export async function extractStartupInfoFromPitchDeck(file: File, apiKey: string) {
    const text = await extractFullTextFromDocument(file);
    return extractStartupDetailsFromPitchDeck(text, apiKey);
}

/**
 * Comprehensive 11-step document review
 */
export async function reviewStartupDocument(content: string | File, additionalPrompt?: string): Promise<DocumentReviewResult> {
    // Note: In a real implementation, we would need the API key here. 
    // Usually it's fetched from settings inside the function or passed in.
    // Based on KasbStudio.tsx, it's called with reviewStartupDocument(content, additionalPrompt).
    // I will assume VITE_GROQ_API_KEY is available or it will use a default.
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    if (!apiKey) throw new Error("AI API key not found for review.");
    
    const groq = getGroqClient(apiKey);
    let text = typeof content === 'string' ? content : await extractFullTextFromDocument(content);
    if (additionalPrompt) text += `\n\nAdditional Instructions: ${additionalPrompt}`;

    try {
        const response = await groq.chat.completions.create({
            model: DEFAULT_MODEL,
            messages: [
                { 
                    role: 'system', 
                    content: 'Perform a deep 11-step analysis of the following startup document. Return a valid JSON object matching the DocumentReviewResult interface.' 
                },
                { role: 'user', content: text }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.2,
        });
        return JSON.parse(response.choices[0]?.message?.content || "{}");
    } catch (error) {
        console.error("Review error:", error);
        throw error;
    }
}

/**
 * Generic inference helper
 */
export async function runInference(apiKey: string, systemPrompt: string, options: { model?: string } = {}): Promise<string> {
    const groq = getGroqClient(apiKey);
    try {
        const response = await groq.chat.completions.create({
            model: options.model || DEFAULT_MODEL,
            messages: [{ role: 'system', content: systemPrompt }],
            temperature: 0.1,
        });
        return response.choices[0]?.message?.content || "";
    } catch (error) {
        throw error;
    }
}
