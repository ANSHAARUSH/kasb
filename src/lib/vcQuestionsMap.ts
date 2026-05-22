export type StartupProfileData = {
    name: string | null;
    founder_name: string | null;
    industry: string | null;
    stage: string | null;
    traction: string | null;
    valuation: string | null;
    elevator_pitch: string | null;
    description: string | null;
    website_url: string | null;
    linkedin_url: string | null;
};

export const getQuestionsForVC = (hostname: string, profile: StartupProfileData): Record<string, string | null> => {
    const domain = hostname.toLowerCase().replace('www.', '');

    if (domain.includes('sequoiacap.com') || domain.includes('surge')) {
        return {
            "1. Company Name": profile.name,
            "2. Company Website URL": profile.website_url,
            "3. Primary Founder Name": profile.founder_name,
            "4. Founder LinkedIn Profile": profile.linkedin_url,
            "5. What is the primary industry or sector?": profile.industry,
            "6. Describe your company in 50 characters or less (Elevator Pitch)": profile.elevator_pitch,
            "7. What problem are you solving?": profile.description,
            "8. What is your product and how does it work?": profile.description,
            "9. How far along are you? (Stage of development)": profile.stage,
            "10. What is your current traction, revenue, or user base?": profile.traction,
            "11. How much are you looking to raise and at what valuation?": profile.valuation,
            "12. Who are your main competitors?": null,
            "13. What is your competitive advantage or 'moat'?": null,
            "14. How do you plan to acquire customers?": null,
            "15. How does your business model work? (How do you make money?)": null,
            "16. What is the total addressable market (TAM)?": null,
            "17. Tell us about your founding team. How did you meet?": null,
            "18. Why are you the right team to build this?": null,
            "19. Have you raised any prior funding? If so, from whom?": null,
            "20. Where is the company headquartered/incorporated?": null,
            "21. Please provide a link to a demo video (optional)": null,
        };
    }

    if (domain.includes('ycombinator.com')) {
        return {
            "Company name:": profile.name,
            "Company url, if any:": profile.website_url,
            "What is your company going to make? Please describe your product.": profile.description,
            "How far along are you?": profile.stage,
            "Founder LinkedIn Profile:": profile.linkedin_url,
        };
    }

    // Default generic application questions that show up for ALL other websites
    return {
        "Company Name": profile.name,
        "Primary Contact / Founder Name": profile.founder_name,
        "Company Website": profile.website_url,
        "LinkedIn Profile": profile.linkedin_url,
        "Briefly describe your company's product or service": profile.elevator_pitch,
        "Detailed Description": profile.description,
        "What is your current stage of development?": profile.stage,
        "What is your current traction / revenue?": profile.traction,
        "Industry / Sector": profile.industry,
        "Current Valuation Ask": profile.valuation,
    };
};
