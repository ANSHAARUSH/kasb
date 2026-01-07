export interface Startup {
    id: string
    name: string
    logo: string
    founder: {
        name: string
        avatar: string
        bio: string
        education: string
        workHistory: string
    }
    problemSolving: string
    description?: string
    history: string
    metrics: {
        valuation: string
        stage: string
        traction: string
    }
    tags: string[]
    emailVerified: boolean
    showInFeed: boolean
    verificationLevel?: 'basic' | 'verified' | 'trusted'
    industry?: string
    aiSummary?: string
    summaryStatus?: 'draft' | 'final'
}

export const MOCK_STARTUPS: Startup[] = [
    {
        id: "1",
        name: "NeoRamen",
        logo: "🍜",
        founder: {
            name: "Akira Tanaka",
            avatar: "https://i.pravatar.cc/150?u=akira",
            bio: "Veteren chef turned tech entrepreneur.",
            education: "Culinary Institute of Tokyo",
            workHistory: "Head Chef at Michelin Starred 'Ryu'"
        },
        problemSolving: "Long wait times and limited healthy food options in high-traffic urban areas.",
        description: "Automated ramen vending machines for high-traffic areas.",
        history: "Founded in 2023, piloted in 5 subway stations.",
        metrics: {
            valuation: "$15M",
            stage: "Series A",
            traction: "$2M ARR"
        },
        tags: ["FoodTech", "Robotics"],
        emailVerified: true,
        showInFeed: true
    },
    {
        id: "2",
        name: "AgriGrow",
        logo: "🌾",
        founder: {
            name: "Sarah Jenkins",
            avatar: "https://i.pravatar.cc/150?u=sarah",
            bio: "Agricultural engineer passionate about sustainability.",
            education: "MIT (AgriTech)",
            workHistory: "Researcher at Monsanto"
        },
        problemSolving: "Traditional farming methods are inefficient and unsustainable for growing urban populations.",
        description: "AI-driven crop yield optimization for vertical farms.",
        history: "Started as a university project, now deployed in 10 countries.",
        metrics: {
            valuation: "$8M",
            stage: "Seed",
            traction: "$500k ARR"
        },
        tags: ["AgriTech", "AI"],
        emailVerified: false,
        showInFeed: false
    },
    {
        id: "3",
        name: "CoinSafe",
        logo: "🪙",
        founder: {
            name: "David Chen",
            avatar: "https://i.pravatar.cc/150?u=david",
            bio: "Crypto security expert.",
            education: "Stanford (CS)",
            workHistory: "Security Lead at Coinbase"
        },
        problemSolving: "Cryptocurrency holders face constant security threats and complex wallet management.",
        description: "Next-gen cold storage wallet with biometric auth.",
        history: "Bootstrapped from 2022 to 2024.",
        metrics: {
            valuation: "$40M",
            stage: "Series B",
            traction: "$5M ARR"
        },
        tags: ["FinTech", "Blockchain"],
        emailVerified: true,
        showInFeed: false
    },
    {
        id: "4",
        name: "MediMatch",
        logo: "⚕️",
        founder: {
            name: "Dr. Emily Blunt",
            avatar: "https://i.pravatar.cc/150?u=emily",
            bio: "Former surgeon solving hospital staffing.",
            education: "Harvard Med",
            workHistory: "Surgeon at Johns Hopkins"
        },
        problemSolving: "Hospitals struggle with critical staffing shortages for specialized medical professionals.",
        description: "On-demand staffing platform for specialized nurses.",
        history: "Rapid growth during 2024 healthcare crisis.",
        metrics: {
            valuation: "$25M",
            stage: "Series A",
            traction: "$3.5M ARR"
        },
        tags: ["HealthTech", "SaaS"],
        emailVerified: true,
        showInFeed: true
    }
]

export interface Investor {
    id: string
    name: string
    avatar: string
    bio: string
    fundsAvailable: string
    investments: number
    expertise: string[]
}

export const MOCK_INVESTORS: Investor[] = [
    {
        id: "i1",
        name: "Marcus Aurelius",
        avatar: "https://i.pravatar.cc/150?u=marcus",
        bio: "Stoic investing in long-term value.",
        fundsAvailable: "$50M",
        investments: 12,
        expertise: ["SaaS", "FinTech"]
    },
    {
        id: "i2",
        name: "Elena Fisher",
        avatar: "https://i.pravatar.cc/150?u=elena",
        bio: "Backing diverse founders in consumer tech.",
        fundsAvailable: "$20M",
        investments: 8,
        expertise: ["Consumer", "HealthTech"]
    },
    {
        id: "i3",
        name: "Quantum Ventures",
        avatar: "https://i.pravatar.cc/150?u=quantum",
        bio: "Deep tech fund focused on AI and Robotics.",
        fundsAvailable: "$100M",
        investments: 25,
        expertise: ["AI", "Robotics", "DeepTech"]
    }
]
