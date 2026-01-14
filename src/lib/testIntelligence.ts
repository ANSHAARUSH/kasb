import { aggregateAnalysis } from './documentIntelligence';
import type { AnalysisResult } from './documentIntelligence';

/**
 * Verification function to simulate various scenarios and log results.
 */
export function verifyIntelligenceLogic() {
    console.log("--- DOCUMENT INTELLIGENCE VERIFICATION ---");

    // Scenario 1: Idea Stage with missing mandatory documents
    const scenario1 = aggregateAnalysis('Idea', ['pitch_deck'], []);
    console.log("Scenario 1 (Idea Stage, only Pitch Deck):", {
        score: scenario1.trust_score,
        risk: scenario1.risk_level,
        missing: scenario1.missing_mandatory_documents
    });

    // Scenario 2: MVP Stage with good documentation
    const mockAnalysis: AnalysisResult[] = [
        {
            document_type: "Pitch Deck",
            stage_relevance: "Mandatory",
            sections_detected: ["Problem", "Solution", "Market", "Traction"],
            summary: "Strong pitch deck",
            missing_sections: [],
            risk_signals: [],
            suggestions: []
        }
    ];
    const scenario2 = aggregateAnalysis('MVP',
        ['pitch_deck', 'startup_summary', 'vision_mission', 'problem_solution', 'founders_cv', 'roles_breakdown', 'time_commitment', 'mvp_demo', 'product_roadmap', 'moa_aoa', 'cap_table'],
        mockAnalysis
    );
    console.log("Scenario 2 (MVP Stage, good docs):", {
        score: scenario2.trust_score,
        risk: scenario2.risk_level,
        ready: scenario2.investor_ready
    });

    // Scenario 3: Seed Stage - High Risk
    const scenario3 = aggregateAnalysis('Seed', ['pitch_deck'], [{
        document_type: "Pitch Deck",
        stage_relevance: "Mandatory",
        sections_detected: ["Problem"],
        summary: "Weak deck",
        missing_sections: ["Financials"],
        risk_signals: ["Weak financials at Seed stage"],
        suggestions: []
    }]);
    console.log("Scenario 3 (Seed Stage, missing financials):", {
        score: scenario3.trust_score,
        risk: scenario3.risk_level,
        flags: scenario3.key_risks
    });

    // Scenario 4: Legacy Stage Mapping (Ideation -> Idea)
    const scenario4 = aggregateAnalysis('Ideation' as any, ['pitch_deck'], []);
    console.log("Scenario 4 (Ideation Stage - Legacy Mapping):", {
        stage: scenario4.startup_stage,
        score: scenario4.trust_score,
        risk: scenario4.risk_level
    });
}
