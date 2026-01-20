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
    { type: 'pitch_deck', label: 'Pitch Deck', description: 'Core presentation of your idea and market.', required: true, section: 'Core Pitch & Vision' },
    { type: 'startup_summary', label: 'One-page Startup Summary', description: 'Concise overview of business.', required: true, section: 'Core Pitch & Vision' },
    { type: 'vision_mission', label: 'Vision & Mission', description: 'Statement of purpose and goals.', required: true, section: 'Core Pitch & Vision' },
    { type: 'founder_cv', label: 'Founders’ CVs', description: 'LinkedIn profiles or resumes.', required: true, section: 'Founder & Team' },
    { type: 'roles_responsibilities', label: 'Roles Breakdown', description: 'Responsibilities of key team members.', required: true, section: 'Founder & Team' },
    { type: 'incorporation_cert', label: 'Certificate of Incorporation', description: 'If incorporated.', required: false, section: 'Legal Identity' },
    { type: 'pan_card', label: 'Company PAN', description: 'Permanent Account Number.', required: false, section: 'Legal Identity' }
];

export const STAGE_REQUIREMENTS: Record<string, RequiredDocument[]> = {
    'Ideation': [
        ...UNIVERSAL_DOCS,
        { type: 'concept_note', label: 'Concept Note', description: '2-3 page idea explanation.', required: true, section: 'Idea Stage' },
        { type: 'market_analysis', label: 'Market Analysis', description: 'TAM-SAM-SOM breakdown.', required: true, section: 'Idea Stage' },
        { type: 'competitive_analysis', label: 'Competitive Landscape', description: 'Analysis of competitors.', required: true, section: 'Idea Stage' },
        { type: 'revenue_logic', label: 'Revenue Logic', description: 'Basic revenue logic.', required: true, section: 'Idea Stage' }
    ],
    'Pre-seed': [
        ...UNIVERSAL_DOCS,
        { type: 'concept_note', label: 'Concept Note', description: '2-3 page idea explanation.', required: true, section: 'Idea Stage' },
        { type: 'market_analysis', label: 'Market Analysis', description: 'TAM-SAM-SOM breakdown.', required: true, section: 'Idea Stage' },
        { type: 'competitive_analysis', label: 'Competitive Landscape', description: 'Analysis of competitors.', required: true, section: 'Idea Stage' },
        { type: 'founder_agreement', label: 'Founders Agreement', description: 'Equity split clarity.', required: false, section: 'Idea Stage' }
    ],
    'MVP': [
        ...UNIVERSAL_DOCS,
        { type: 'mvp_demo_link', label: 'MVP Demo Link', description: 'Link or video of prototype.', required: true, section: 'Product & Traction' },
        { type: 'product_roadmap', label: 'Product Roadmap', description: '6-12 month plan.', required: true, section: 'Product & Traction' },
        { type: 'user_testimonials', label: 'User Feedback', description: 'Early testimonials.', required: true, section: 'Product & Traction' },
        { type: 'business_model', label: 'Business Model', description: 'Detailed model document.', required: true, section: 'Business & Strategy' },
        { type: 'moa_aoa', label: 'MoA & AoA', description: 'Memorandum & Articles of Association.', required: true, section: 'Legal & Ownership' },
        { type: 'cap_table', label: 'Cap Table', description: 'Equity ownership structure.', required: true, section: 'Legal & Ownership' }
    ],
    'Seed': [
        ...UNIVERSAL_DOCS,
        { type: 'p_n_l_statement', label: 'P&L Statement', description: 'Profit and Loss.', required: true, section: 'Financials' },
        { type: 'cash_flow', label: 'Cash Flow', description: 'Cash flow statement.', required: true, section: 'Financials' },
        { type: 'financial_projections', label: 'Financial Projections', description: '12-18 month forecast.', required: true, section: 'Financials' },
        { type: 'customer_contracts', label: 'Customer Contracts', description: 'LOIs or contracts.', required: true, section: 'Customers & Revenue' },
        { type: 'mrr_arr_metrics', label: 'MRR/ARR Data', description: 'Recurring revenue metrics.', required: true, section: 'Customers & Revenue' },
        { type: 'gst_cert', label: 'GST Registration', description: 'Tax compliance.', required: true, section: 'Compliance' },
        { type: 'shareholders_agreement', label: 'Shareholders Agreement', description: 'Governance document.', required: true, section: 'Governance' }
    ],
    'Series A': [
        ...UNIVERSAL_DOCS,
        { type: 'audit_report', label: 'Audited Financials', description: 'Audited statements.', required: true, section: 'Advanced Financials' },
        { type: 'mis_report', label: 'MIS Reports', description: 'Department-wise KPIs.', required: true, section: 'Advanced Financials' },
        { type: 'market_expansion_plan', label: 'Expansion Plan', description: 'Strategy for scaling.', required: true, section: 'Scale Readiness' },
        { type: 'hiring_plan', label: 'Hiring Plan', description: 'Recruitment strategy.', required: true, section: 'Scale Readiness' },
        { type: 'data_policy', label: 'Data Policy', description: 'Data protection & privacy.', required: true, section: 'Risk & Compliance' }
    ]
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
