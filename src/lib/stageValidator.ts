import { UNIVERSAL_DOCUMENTS, STAGE_SPECIFIC_LOGIC, type StartupStage } from '../data/startupChecklist';

export interface ValidationResult {
    isPassed: boolean;
    missingMandatory: string[];
    missingUniversal: string[];
    riskLevel: 'Low' | 'Medium' | 'High';
}

/**
 * Validates if the startup has met the baseline requirements for their stage.
 */
export function validateStageRequirements(uploadedDocIds: string[], stage: StartupStage): ValidationResult {
    const missingUniversal = UNIVERSAL_DOCUMENTS
        .filter(d => d.isMandatory && !uploadedDocIds.includes(d.id))
        .map(d => d.label);

    const missingMandatory = STAGE_SPECIFIC_LOGIC[stage].mandatory
        .filter(d => d.isMandatory && !uploadedDocIds.includes(d.id))
        .map(d => d.label);

    const isPassed = missingUniversal.length === 0 && missingMandatory.length === 0;

    let riskLevel: 'Low' | 'Medium' | 'High' = 'Low';
    if (missingUniversal.length > 0) {
        riskLevel = 'High';
    } else if (missingMandatory.length > 0) {
        riskLevel = 'Medium';
    }

    return {
        isPassed,
        missingMandatory,
        missingUniversal,
        riskLevel
    };
}
