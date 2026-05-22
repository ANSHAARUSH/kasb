import { UNIVERSAL_DOCUMENTS, STAGE_SPECIFIC_LOGIC, normalizeStage } from '../data/startupChecklist';
import type { StartupStage } from '../data/startupChecklist';

export interface AnalysisResult {
    document_type: string;
    stage_relevance: 'Mandatory' | 'Optional';
    sections_detected: string[];
    summary: string;
    missing_sections: string[];
    risk_signals: string[];
    suggestions: string[];
}

export interface AggregatedOutput {
    startup_stage: StartupStage;
    trust_score: number;
    risk_level: 'Low' | 'Medium' | 'High';
    missing_mandatory_documents: string[];
    missing_optional_documents: string[];
    key_risks: string[];
    recommendations: string[];
    investor_ready: boolean;
    data_room: Record<string, string[]>;
}

/**
 * Calculates a Trust Score (0-100) based on requirements:
 * - Document completeness (40%)
 * - Stage-fit alignment (25%)
 * - Consistency across documents (20%) - Placeholder for now
 * - Legal & ownership clarity (15%)
 */
export function calculateTrustScore(
    stage: StartupStage,
    analysisResults: AnalysisResult[]
): number {
    const normalizedStage = normalizeStage(stage);
    const universalMandatory = UNIVERSAL_DOCUMENTS.filter(d => d.isMandatory || d.category === '07_Legal');
    const stageLogic = STAGE_SPECIFIC_LOGIC[normalizedStage] || STAGE_SPECIFIC_LOGIC['Idea'];
    const stageMandatory = stageLogic.mandatory;

    const allMandatory = [...universalMandatory, ...stageMandatory];
    const mandatoryCount = allMandatory.length;


    // We only give full credit if analysis exists and is valid
    const qualityValidatedMandatoryCount = allMandatory.filter(m => {
        const result = analysisResults.find(r => r.document_type === m.label);
        if (!result) return false;
        return result.sections_detected.length > 1 && !result.risk_signals.some(s => s.toLowerCase().includes('irrelevant'));
    }).length;

    // 1. Completeness (40%) - Weighted by quality
    const completenessScore = (qualityValidatedMandatoryCount / mandatoryCount) * 40;

    // 2. Stage-fit (25%)
    const qualityStageMandatory = stageMandatory.filter(m => {
        const result = analysisResults.find(r => r.document_type === m.label);
        return result && result.sections_detected.length > 1;
    }).length;
    const stageFitScore = (qualityStageMandatory / stageMandatory.length) * 25;

    // 3. Consistency & Detail (20%)
    // Reward more detected sections and fewer missing sections
    const avgSections = analysisResults.length > 0
        ? analysisResults.reduce((acc, r) => acc + r.sections_detected.length, 0) / analysisResults.length
        : 0;
    const consistencyScore = Math.min(20, avgSections * 4);

    // 4. Legal Clarity (15%)
    const legalDocIds = UNIVERSAL_DOCUMENTS.filter(d => d.category === '07_Legal').map(d => d.id);
    const qualityLegal = legalDocIds.filter(id => {
        const doc = UNIVERSAL_DOCUMENTS.find(d => d.id === id);
        const result = analysisResults.find(r => r.document_type === doc?.label);
        return result && result.sections_detected.length > 0;
    }).length;
    const legalScore = (qualityLegal / legalDocIds.length) * 15;

    // Final Adjustment: Penalize heavily for risk signals
    const totalRisks = analysisResults.reduce((acc, r) => acc + r.risk_signals.length, 0);
    const riskPenalty = Math.min(30, totalRisks * 5); // Max 30% penalty

    const baseScore = completenessScore + stageFitScore + consistencyScore + legalScore;
    return Math.max(0, Math.round(baseScore - riskPenalty));
}

/**
 * Detects risk flags based on missing mandatory documents and AI findings.
 */
export function detectRisks(
    uploadedDocIds: string[],
    stage: StartupStage,
    aiFindings: string[]
): { level: 'Low' | 'Medium' | 'High'; flags: string[] } {
    const normalizedStage = normalizeStage(stage);
    const stageLogic = STAGE_SPECIFIC_LOGIC[normalizedStage] || STAGE_SPECIFIC_LOGIC['Idea'];
    const flags: string[] = [...aiFindings];

    const universalMandatoryMissing = UNIVERSAL_DOCUMENTS.filter(d => d.isMandatory && !uploadedDocIds.includes(d.id));
    const stageMandatoryMissing = stageLogic.mandatory.filter(d => !uploadedDocIds.includes(d.id));

    if (universalMandatoryMissing.length > 0) {
        flags.push(`Missing Universal Mandatory: ${universalMandatoryMissing.map(d => d.label).join(', ')}`);
    }

    if (stageMandatoryMissing.length > 0) {
        flags.push(`Missing ${stage} Stage Mandatory: ${stageMandatoryMissing.map(d => d.label).join(', ')}`);
    }

    let level: 'Low' | 'Medium' | 'High' = 'Low';
    if (universalMandatoryMissing.length > 0 || stageMandatoryMissing.some(d => d.isMandatory)) {
        level = 'High';
    } else if (flags.length > 2) {
        level = 'Medium';
    }

    return { level, flags };
}

/**
 * Aggregates all document data into the final investor-ready JSON format.
 */
export function aggregateAnalysis(
    stage: StartupStage,
    uploadedDocIds: string[],
    analysisResults: AnalysisResult[]
): AggregatedOutput {
    const normalizedStage = normalizeStage(stage);
    const stageLogic = STAGE_SPECIFIC_LOGIC[normalizedStage] || STAGE_SPECIFIC_LOGIC['Idea'];
    const score = calculateTrustScore(normalizedStage, analysisResults);
    const { level, flags } = detectRisks(uploadedDocIds, normalizedStage, analysisResults.flatMap(r => r.risk_signals));

    const missingMandatory = [
        ...UNIVERSAL_DOCUMENTS.filter(d => d.isMandatory && !uploadedDocIds.includes(d.id)),
        ...stageLogic.mandatory.filter(d => !uploadedDocIds.includes(d.id))
    ].map(d => d.label);

    const missingOptional = stageLogic.optional
        .filter(d => !uploadedDocIds.includes(d.id))
        .map(d => d.label);

    // Map to Data Room
    const dataRoom: Record<string, string[]> = {};
    const allExpected = [...UNIVERSAL_DOCUMENTS, ...stageLogic.mandatory, ...stageLogic.optional];

    allExpected.forEach(doc => {
        if (!dataRoom[doc.category]) dataRoom[doc.category] = [];
        if (uploadedDocIds.includes(doc.id)) {
            dataRoom[doc.category].push(doc.label);
        }
    });

    return {
        startup_stage: stage,
        trust_score: score,
        risk_level: level,
        missing_mandatory_documents: missingMandatory,
        missing_optional_documents: missingOptional,
        key_risks: flags,
        recommendations: [
            ...missingMandatory.map(m => `Upload ${m}`),
            ...analysisResults.flatMap(r => r.suggestions).slice(0, 3)
        ],
        investor_ready: score > 80 && level === 'Low',
        data_room: dataRoom
    };
}
