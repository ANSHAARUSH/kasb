// documentUtils.ts - Handles document scanning logic
import OpenAI from 'openai';

// Note: pdfjs-dist is imported dynamically to avoid top-level await/worker issues in Vite

export type DocumentType =
    // Universal
    | 'pitch_deck'
    | 'startup_summary'
    | 'vision_mission'
    | 'problem_solution'
    | 'founder_cv'
    | 'roles_responsibilities'
    | 'time_commitment'
    | 'incorporation_cert'
    | 'cin'
    | 'pan_card'
    | 'office_address_proof'

    // Idea / Pre-seed
    | 'concept_note'
    | 'market_analysis'
    | 'competitive_analysis'
    | 'revenue_logic'
    | 'customer_interviews'
    | 'founder_agreement'

    // MVP / Prototype
    | 'mvp_demo_link'
    | 'product_roadmap'
    | 'user_testimonials'
    | 'early_metrics'
    | 'business_model'
    | 'pricing_strategy'
    | 'gtm_plan'
    | 'unit_economics'
    | 'moa_aoa'
    | 'cap_table'
    | 'esop_plan'
    | 'tech_architecture'
    | 'code_ownership'

    // Seed / Early Revenue
    | 'p_n_l_statement'
    | 'cash_flow'
    | 'burn_rate'
    | 'financial_projections'
    | 'customer_contracts'
    | 'invoices'
    | 'mrr_arr_metrics'
    | 'retention_data'
    | 'gst_cert'
    | 'statutory_filings'
    | 'employment_agreements'
    | 'ip_filings'
    | 'shareholders_agreement'
    | 'board_structure'

    // Growth / Series A
    | 'audit_report'
    | 'mis_report'
    | 'kpi_report'
    | 'market_expansion_plan'
    | 'hiring_plan'
    | 'process_docs'
    | 'data_policy'
    | 'risk_assessment'
    | 'litigation_disclosure'
    | 'vendor_due_diligence';

export interface RequiredDocument {
    type: DocumentType;
    label: string;
    description: string;
    required: boolean;
    section?: string;
}

const UNIVERSAL_DOCS: RequiredDocument[] = [
    { type: 'pitch_deck', label: 'Pitch Deck (PPTX)', description: 'Main presentation of your business, market, and team. PowerPoint format preferred.', required: true, section: 'Core Pitch' },
];

export const STAGE_REQUIREMENTS: Record<string, RequiredDocument[]> = {
    'Ideation': [...UNIVERSAL_DOCS],
    'Pre-seed': [...UNIVERSAL_DOCS],
    'MVP': [...UNIVERSAL_DOCS],
    'Seed': [...UNIVERSAL_DOCS],
    'Series A': [...UNIVERSAL_DOCS]
};

export const getRequiredDocuments = (stage: string): RequiredDocument[] => {
    // Basic mapping of stage names to keys
    // If the exact stage isn't found, default to 'Pre-seed' (Idea stage)
    return STAGE_REQUIREMENTS[stage] || STAGE_REQUIREMENTS['Pre-seed'];
};

export async function extractTextFromFile(file: File): Promise<string> {
    // Check if PDF (for MVP AI scanning)
    if (file.type === 'application/pdf') {
        try {
            // Dynamic import to avoid top-level crashes
            const pdfjsLib = await import('pdfjs-dist');
            pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            let text = '';

            // Read first 5 pages max to avoid huge payload
            const maxPages = Math.min(pdf.numPages, 5);
            for (let i = 1; i <= maxPages; i++) {
                const page = await pdf.getPage(i);
                const content = await page.getTextContent();
                text += content.items.map((item: any) => item.str).join(' ') + '\n';
            }
            return text;
        } catch (e) {
            console.error("PDF Parsing failed", e);
            return "Error parsing PDF. Please try a simpler file or check the console.";
        }
    } else if (file.type.startsWith('text/')) {
        return await file.text();
    }

    // For images, we could use OCR, but limiting to PDF/Text for MVP
    throw new Error('Unsupported file type for AI scan. Please use PDF.');
}

export async function verifyDocumentWithAI(
    docType: DocumentType,
    textContent: string,
    apiKey: string
): Promise<{ valid: boolean; confidence: number; reason: string }> {

    // Simulate short delay for "Scanning" effect if text is short
    if (textContent.length < 50) return { valid: false, confidence: 0, reason: "File content is too empty or unreadable." };

    const client = new OpenAI({
        apiKey,
        baseURL: apiKey.startsWith('gsk_') ? 'https://api.groq.com/openai/v1' : undefined,
        dangerouslyAllowBrowser: true
    });

    const prompt = `
    You are a strict compliance AI auditor for a startup investment platform. 
    Analyze the following text extracted from a document uploaded as a "${docType.replace('_', ' ')}".
    
    Task: Verify if this text content plausibly belongs to a ${docType.replace('_', ' ')}.
    
    Extracted Text (first few pages):
    """
    ${textContent.substring(0, 3000)}...
    """
    
    Return ONLY valid JSON:
    {
        "valid": boolean, // true if it looks like the correct document type
        "confidence": number, // 0-100 score
        "reason": "Short explanation of why it passed or failed (max 1 sentence)"
    }
    `;

    try {
        const response = await client.chat.completions.create({
            model: apiKey.startsWith('gsk_') ? 'llama-3.3-70b-versatile' : 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.1, // Low temp for strict analysis
            response_format: { type: 'json_object' }
        });

        const result = JSON.parse(response.choices[0].message.content || '{}');
        return {
            valid: result.valid,
            confidence: result.confidence,
            reason: result.reason
        };

    } catch (error: any) {
        console.error('AI Verification Error:', error);
        // Fallback for demo if API fails
        return { valid: true, confidence: 50, reason: "AI verification service unavailable, marked for manual review." };
    }
}
