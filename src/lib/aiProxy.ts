/**
 * aiProxy.ts — Thin client that routes all AI calls through the Supabase Edge Function.
 * No API keys are stored or used in the browser. Only the user's JWT is sent.
 */
import { supabase } from "./supabase";

export interface AiProxyResponse<T = any> {
  data: T | null;
  error: string | null;
}

export interface ComparisonResult {
    startup1Analysis: string;
    startup2Analysis: string;
    analysis: {
        problem?: { winner: string, reason: string };
        market?: { winner: string, reason: string };
        risks?: { winner: string, reason: string };
        funds?: { winner: string, reason: string };
        expertise?: { winner: string, reason: string };
        track_record?: { winner: string, reason: string };
        [key: string]: { winner: string, reason: string } | undefined;
    };
    verdict: string;
}

export interface DocumentReviewResult {
    categories: Array<{
        title: string;
        score: number;
        feedback: string;
    }>;
    overall_sentiment: string;
    critical_missing_info: string[];
    investor_recommendation: 'strong_pass' | 'monitor' | 'potential_investment' | 'high_priority';
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

/**
 * Call the AI proxy Edge Function.
 * @param action - The action to perform (e.g., 'chat', 'eligibility', 'studio')
 * @param payload - Action-specific data (never includes API keys)
 */
export async function aiProxy<T = any>(action: string, payload: Record<string, any> = {}): Promise<T> {
  const { data, error } = await supabase.functions.invoke("ai-proxy", {
    body: { action, payload },
  });

  if (error) {
    console.error(`[aiProxy] ${action} error:`, error);
    throw new Error(error.message || `AI request failed: ${action}`);
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data as T;
}

// ─── Convenience wrappers ───────────────────────────────

/** Chat with a FounderGPT personality */
export async function proxyChat(
  personalityId: string,
  message: string,
  history: { role: string; content: string }[],
  opts?: { brutalMode?: boolean; founderContext?: string; ragContext?: string }
): Promise<string> {
  const result = await aiProxy<{ text: string }>("chat", {
    personalityId, message, history,
    brutalMode: opts?.brutalMode,
    founderContext: opts?.founderContext,
    ragContext: opts?.ragContext,
  });
  return result.text || "I'm having trouble thinking right now. Please try again.";
}

/** Chat with Kasb AI Assistant */
export async function proxyChatKasb(
  message: string,
  history: { role: string; content: string }[],
  founderContext?: string
): Promise<string> {
  const result = await aiProxy<{ text: string }>("chat_kasb", {
    message, history, founderContext,
  });
  return result.text || "I'm having trouble thinking right now. Please try again.";
}

/** Compare two startups */
export async function proxyCompareStartups(startup1: any, startup2: any) {
  return aiProxy("compare_startups", { startup1, startup2 });
}

/** Compare two investors */
export async function proxyCompareInvestors(investor1: any, investor2: any) {
  return aiProxy("compare_investors", { investor1, investor2 });
}

/** Check eligibility */
export async function proxyCheckEligibility(startup: any, criteria: string[]) {
  return aiProxy<{ percentage: number; reasoning: string }>("eligibility", { startup, criteria });
}

/** Identify missing fields */
export async function proxyMissingFields(profileSummary: string, criteria: string[]) {
  return aiProxy<Array<{ field: string; label: string; options: string[] }>>("missing_fields", { profileSummary, criteria });
}

/** Get industry insights */
export async function proxyIndustryInsights(industry: string) {
  return aiProxy("industry_insights", { industry });
}

/** Refine a message */
export async function proxyRefineMessage(message: string): Promise<string> {
  const result = await aiProxy<{ text: string }>("refine_message", { message });
  return result.text || message;
}

/** Refine a problem statement */
export async function proxyRefineProblem(problem: string): Promise<string> {
  const result = await aiProxy<{ text: string }>("refine_problem", { problem });
  return result.text || problem;
}

/** Kasb Studio */
export async function proxyStudio(query: string, previousContext?: { tool: string; blueprint: string }) {
  return aiProxy("studio", { query, previousContext });
}

/** Extract pitch deck details from text */
export async function proxyExtractPitch(text: string) {
  return aiProxy("extract_pitch", { text });
}

/** Extract startup info (supports vision via base64) */
export async function proxyExtractInfo(opts: { text?: string; imageBase64?: string }) {
  return aiProxy("extract_info", opts);
}

/** Document OCR */
export async function proxyDocumentOCR(docType: string, opts: { imageBase64?: string; mimeType?: string; text?: string }) {
  return aiProxy("document_ocr", { docType, ...opts });
}

/** Verify document with AI */
export async function proxyVerifyDocument(docType: string, text: string) {
  return aiProxy<{ valid: boolean; confidence: number; reason: string }>("verify_document", { docType, text });
}

/** AI recommendations (generic — caller builds the prompt) */
export async function proxyRecommend(prompt: string): Promise<string> {
  const result = await aiProxy<{ text: string }>("recommend", { prompt });
  return result.text || "";
}

/** Review document (11-step analysis) */
export async function proxyReview(prompt: string) {
  return aiProxy("review", { prompt });
}

/** Review pitch deck */
export async function proxyReviewPitch(prompt: string) {
  return aiProxy("review_pitch", { prompt });
}

/** Generate investor summary */
export async function proxyInvestorSummary(prompt: string): Promise<string> {
  const result = await aiProxy<{ text: string }>("investor_summary", { prompt });
  return result.text || "";
}

/** Valuation insights */
export async function proxyValuation(prompt: string): Promise<string> {
  const result = await aiProxy<{ text: string }>("valuation", { prompt });
  return result.text || "";
}

/** Founder analysis */
export async function proxyFounderAnalysis(prompt: string): Promise<string> {
  const result = await aiProxy<{ text: string }>("founder_analysis", { prompt });
  return result.text || "";
}

/** Analyze startup document */
export async function proxyAnalyzeDoc(prompt: string, imageBase64?: string) {
  return aiProxy("analyze_doc", { prompt, imageBase64 });
}

/** Semantic question match */
export async function proxySemanticMatch(prompt: string) {
  return aiProxy<{ matchKey: string | null }>("semantic_match", { prompt });
}

/** Vision OCR for pitch deck pages */
export async function proxyVisionOCR(imageBase64: string): Promise<string> {
  const result = await aiProxy<{ text: string }>("vision_ocr", { imageBase64 });
  return result.text || "";
}

/** KYC - Generate Aadhaar OTP */
export async function proxyKycGenerateOTP(aadhaarNumber: string) {
  return aiProxy<{ client_id: string }>("kyc_generate_otp", { aadhaarNumber });
}

/** KYC - Verify OTP */
export async function proxyKycVerifyOTP(clientId: string, otp: string) {
  return aiProxy("kyc_verify_otp", { clientId, otp });
}
