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
    questionnaire?: Record<string, Record<string, string>>
    impactPoints?: number
    communityBoosts?: number
    last_active_at?: string
}

export const MOCK_STARTUPS: Startup[] = [
    {
        "id": "1",
        "name": "CleanTechSky 1",
        "logo": "🚀",
        "founder": {
            "name": "Michael Adams",
            "avatar": "",
            "bio": "Serial entrepreneur scaling CleanTech solutions.",
            "education": "Harvard University",
            "workHistory": "Ex-Google"
        },
        "problemSolving": "Solving critical inefficiencies in CleanTech through automation and AI.",
        "description": "A cutting-edge CleanTech platform.",
        "history": "Founded in 2023.",
        "metrics": {
            "valuation": "$48M",
            "stage": "Pre-seed",
            "traction": "$5.5M ARR"
        },
        "tags": [
            "CleanTech",
            "AI"
        ],
        "emailVerified": true,
        "showInFeed": true,
        "verificationLevel": "basic"
    },
    {
        "id": "2",
        "name": "FinTechNet 2",
        "logo": "⚕️",
        "founder": {
            "name": "Joshua Torres",
            "avatar": "",
            "bio": "Serial entrepreneur scaling FinTech solutions.",
            "education": "IIT University",
            "workHistory": "Ex-Meta"
        },
        "problemSolving": "Solving critical inefficiencies in FinTech through automation and AI.",
        "description": "A cutting-edge FinTech platform.",
        "history": "Founded in 2022.",
        "metrics": {
            "valuation": "$1M",
            "stage": "Series A",
            "traction": "$9.5M ARR"
        },
        "tags": [
            "FinTech",
            "AI"
        ],
        "emailVerified": true,
        "showInFeed": true,
        "verificationLevel": "verified"
    },
    {
        "id": "3",
        "name": "HealthTechFlow 3",
        "logo": "🍜",
        "founder": {
            "name": "Anthony Rodriguez",
            "avatar": "",
            "bio": "Serial entrepreneur scaling HealthTech solutions.",
            "education": "Oxford University",
            "workHistory": "Ex-Meta"
        },
        "problemSolving": "Solving critical inefficiencies in HealthTech through automation and AI.",
        "description": "A cutting-edge HealthTech platform.",
        "history": "Founded in 2022.",
        "metrics": {
            "valuation": "$43M",
            "stage": "Series B",
            "traction": "$2.5M ARR"
        },
        "tags": [
            "HealthTech",
            "AI"
        ],
        "emailVerified": true,
        "showInFeed": true,
        "verificationLevel": "verified"
    },
    {
        "id": "4",
        "name": "DeepTechCore 4",
        "logo": "🌾",
        "founder": {
            "name": "Anthony Martinez",
            "avatar": "",
            "bio": "Serial entrepreneur scaling DeepTech solutions.",
            "education": "IIT University",
            "workHistory": "Ex-Amazon"
        },
        "problemSolving": "Solving critical inefficiencies in DeepTech through automation and AI.",
        "description": "A cutting-edge DeepTech platform.",
        "history": "Founded in 2020.",
        "metrics": {
            "valuation": "$29M",
            "stage": "Series B",
            "traction": "$1.5M ARR"
        },
        "tags": [
            "DeepTech",
            "AI"
        ],
        "emailVerified": true,
        "showInFeed": true,
        "verificationLevel": "basic"
    },
    {
        "id": "5",
        "name": "PropTechGrid 5",
        "logo": "🔋",
        "founder": {
            "name": "Lisa Carter",
            "avatar": "",
            "bio": "Serial entrepreneur scaling PropTech solutions.",
            "education": "Stanford University",
            "workHistory": "Ex-Amazon"
        },
        "problemSolving": "Solving critical inefficiencies in PropTech through automation and AI.",
        "description": "A cutting-edge PropTech platform.",
        "history": "Founded in 2023.",
        "metrics": {
            "valuation": "$5M",
            "stage": "Series A",
            "traction": "$9.5M ARR"
        },
        "tags": [
            "PropTech",
            "AI"
        ],
        "emailVerified": true,
        "showInFeed": true,
        "verificationLevel": "verified"
    },
    {
        "id": "6",
        "name": "FinTechFlow 6",
        "logo": "🛡️",
        "founder": {
            "name": "Margaret Wright",
            "avatar": "",
            "bio": "Serial entrepreneur scaling FinTech solutions.",
            "education": "Harvard University",
            "workHistory": "Ex-Google"
        },
        "problemSolving": "Solving critical inefficiencies in FinTech through automation and AI.",
        "description": "A cutting-edge FinTech platform.",
        "history": "Founded in 2021.",
        "metrics": {
            "valuation": "$44M",
            "stage": "Series A",
            "traction": "$9.5M ARR"
        },
        "tags": [
            "FinTech",
            "AI"
        ],
        "emailVerified": true,
        "showInFeed": true,
        "verificationLevel": "verified"
    },
    {
        "id": "7",
        "name": "FinTechSky 7",
        "logo": "🌐",
        "founder": {
            "name": "Carol Campbell",
            "avatar": "",
            "bio": "Serial entrepreneur scaling FinTech solutions.",
            "education": "MIT University",
            "workHistory": "Ex-Google"
        },
        "problemSolving": "Solving critical inefficiencies in FinTech through automation and AI.",
        "description": "A cutting-edge FinTech platform.",
        "history": "Founded in 2023.",
        "metrics": {
            "valuation": "$15M",
            "stage": "Pre-seed",
            "traction": "$7.5M ARR"
        },
        "tags": [
            "FinTech",
            "AI"
        ],
        "emailVerified": true,
        "showInFeed": true,
        "verificationLevel": "basic"
    },
    {
        "id": "8",
        "name": "SaaSCore 8",
        "logo": "🌐",
        "founder": {
            "name": "Susan Martinez",
            "avatar": "",
            "bio": "Serial entrepreneur scaling SaaS solutions.",
            "education": "Harvard University",
            "workHistory": "Ex-Goldman Sachs"
        },
        "problemSolving": "Solving critical inefficiencies in SaaS through automation and AI.",
        "description": "A cutting-edge SaaS platform.",
        "history": "Founded in 2020.",
        "metrics": {
            "valuation": "$41M",
            "stage": "Series B",
            "traction": "$9.5M ARR"
        },
        "tags": [
            "SaaS",
            "AI"
        ],
        "emailVerified": true,
        "showInFeed": true,
        "verificationLevel": "verified"
    },
    {
        "id": "9",
        "name": "EdTechGrid 9",
        "logo": "🎨",
        "founder": {
            "name": "Daniel Young",
            "avatar": "",
            "bio": "Serial entrepreneur scaling EdTech solutions.",
            "education": "Oxford University",
            "workHistory": "Ex-Google"
        },
        "problemSolving": "Solving critical inefficiencies in EdTech through automation and AI.",
        "description": "A cutting-edge EdTech platform.",
        "history": "Founded in 2020.",
        "metrics": {
            "valuation": "$38M",
            "stage": "Pre-seed",
            "traction": "$8.5M ARR"
        },
        "tags": [
            "EdTech",
            "AI"
        ],
        "emailVerified": true,
        "showInFeed": true,
        "verificationLevel": "basic"
    },
    {
        "id": "10",
        "name": "AgriTechSky 10",
        "logo": "⚙️",
        "founder": {
            "name": "Steven Wilson",
            "avatar": "",
            "bio": "Serial entrepreneur scaling AgriTech solutions.",
            "education": "Harvard University",
            "workHistory": "Ex-Goldman Sachs"
        },
        "problemSolving": "Solving critical inefficiencies in AgriTech through automation and AI.",
        "description": "A cutting-edge AgriTech platform.",
        "history": "Founded in 2023.",
        "metrics": {
            "valuation": "$2M",
            "stage": "Series B",
            "traction": "$7.5M ARR"
        },
        "tags": [
            "AgriTech",
            "AI"
        ],
        "emailVerified": true,
        "showInFeed": true,
        "verificationLevel": "verified"
    },
    {
        "id": "11",
        "name": "E-commerceSky 11",
        "logo": "📦",
        "founder": {
            "name": "Michelle Scott",
            "avatar": "",
            "bio": "Serial entrepreneur scaling E-commerce solutions.",
            "education": "Stanford University",
            "workHistory": "Ex-Amazon"
        },
        "problemSolving": "Solving critical inefficiencies in E-commerce through automation and AI.",
        "description": "A cutting-edge E-commerce platform.",
        "history": "Founded in 2024.",
        "metrics": {
            "valuation": "$3M",
            "stage": "Ideation",
            "traction": "$2.5M ARR"
        },
        "tags": [
            "E-commerce",
            "AI"
        ],
        "emailVerified": true,
        "showInFeed": true,
        "verificationLevel": "basic"
    },
    {
        "id": "12",
        "name": "EdTechCore 12",
        "logo": "🍜",
        "founder": {
            "name": "Kimberly Thomas",
            "avatar": "",
            "bio": "Serial entrepreneur scaling EdTech solutions.",
            "education": "Stanford University",
            "workHistory": "Ex-Amazon"
        },
        "problemSolving": "Solving critical inefficiencies in EdTech through automation and AI.",
        "description": "A cutting-edge EdTech platform.",
        "history": "Founded in 2023.",
        "metrics": {
            "valuation": "$16M",
            "stage": "Ideation",
            "traction": "$4.5M ARR"
        },
        "tags": [
            "EdTech",
            "AI"
        ],
        "emailVerified": true,
        "showInFeed": true,
        "verificationLevel": "verified"
    },
    {
        "id": "13",
        "name": "E-commerceNet 13",
        "logo": "⚙️",
        "founder": {
            "name": "Kenneth Green",
            "avatar": "",
            "bio": "Serial entrepreneur scaling E-commerce solutions.",
            "education": "Oxford University",
            "workHistory": "Ex-Apple"
        },
        "problemSolving": "Solving critical inefficiencies in E-commerce through automation and AI.",
        "description": "A cutting-edge E-commerce platform.",
        "history": "Founded in 2023.",
        "metrics": {
            "valuation": "$28M",
            "stage": "Ideation",
            "traction": "$8.5M ARR"
        },
        "tags": [
            "E-commerce",
            "AI"
        ],
        "emailVerified": true,
        "showInFeed": true,
        "verificationLevel": "basic"
    },
    {
        "id": "14",
        "name": "HealthTechFlow 14",
        "logo": "🔋",
        "founder": {
            "name": "Steven King",
            "avatar": "",
            "bio": "Serial entrepreneur scaling HealthTech solutions.",
            "education": "Harvard University",
            "workHistory": "Ex-Goldman Sachs"
        },
        "problemSolving": "Solving critical inefficiencies in HealthTech through automation and AI.",
        "description": "A cutting-edge HealthTech platform.",
        "history": "Founded in 2024.",
        "metrics": {
            "valuation": "$12M",
            "stage": "Seed",
            "traction": "$1.5M ARR"
        },
        "tags": [
            "HealthTech",
            "AI"
        ],
        "emailVerified": true,
        "showInFeed": true,
        "verificationLevel": "basic"
    },
    {
        "id": "15",
        "name": "AgriTechBase 15",
        "logo": "🍜",
        "founder": {
            "name": "Michael Carter",
            "avatar": "",
            "bio": "Serial entrepreneur scaling AgriTech solutions.",
            "education": "MIT University",
            "workHistory": "Ex-Apple"
        },
        "problemSolving": "Solving critical inefficiencies in AgriTech through automation and AI.",
        "description": "A cutting-edge AgriTech platform.",
        "history": "Founded in 2023.",
        "metrics": {
            "valuation": "$4M",
            "stage": "Pre-seed",
            "traction": "$5.5M ARR"
        },
        "tags": [
            "AgriTech",
            "AI"
        ],
        "emailVerified": true,
        "showInFeed": true,
        "verificationLevel": "basic"
    },
    {
        "id": "16",
        "name": "LogisticsGrid 16",
        "logo": "🌐",
        "founder": {
            "name": "Betty Nelson",
            "avatar": "",
            "bio": "Serial entrepreneur scaling Logistics solutions.",
            "education": "Stanford University",
            "workHistory": "Ex-Apple"
        },
        "problemSolving": "Solving critical inefficiencies in Logistics through automation and AI.",
        "description": "A cutting-edge Logistics platform.",
        "history": "Founded in 2021.",
        "metrics": {
            "valuation": "$5M",
            "stage": "Seed",
            "traction": "$0.5M ARR"
        },
        "tags": [
            "Logistics",
            "AI"
        ],
        "emailVerified": true,
        "showInFeed": true,
        "verificationLevel": "basic"
    },
    {
        "id": "17",
        "name": "CleanTechNet 17",
        "logo": "🪙",
        "founder": {
            "name": "Brian Clark",
            "avatar": "",
            "bio": "Serial entrepreneur scaling CleanTech solutions.",
            "education": "Oxford University",
            "workHistory": "Ex-Goldman Sachs"
        },
        "problemSolving": "Solving critical inefficiencies in CleanTech through automation and AI.",
        "description": "A cutting-edge CleanTech platform.",
        "history": "Founded in 2022.",
        "metrics": {
            "valuation": "$11M",
            "stage": "Series B",
            "traction": "$9.5M ARR"
        },
        "tags": [
            "CleanTech",
            "AI"
        ],
        "emailVerified": true,
        "showInFeed": true,
        "verificationLevel": "basic"
    },
    {
        "id": "18",
        "name": "EdTechBase 18",
        "logo": "⚙️",
        "founder": {
            "name": "Barbara Anderson",
            "avatar": "",
            "bio": "Serial entrepreneur scaling EdTech solutions.",
            "education": "Stanford University",
            "workHistory": "Ex-Meta"
        },
        "problemSolving": "Solving critical inefficiencies in EdTech through automation and AI.",
        "description": "A cutting-edge EdTech platform.",
        "history": "Founded in 2020.",
        "metrics": {
            "valuation": "$29M",
            "stage": "Seed",
            "traction": "$6.5M ARR"
        },
        "tags": [
            "EdTech",
            "AI"
        ],
        "emailVerified": true,
        "showInFeed": true,
        "verificationLevel": "basic"
    },
    {
        "id": "19",
        "name": "DeepTechBase 19",
        "logo": "🪙",
        "founder": {
            "name": "Mary Scott",
            "avatar": "",
            "bio": "Serial entrepreneur scaling DeepTech solutions.",
            "education": "MIT University",
            "workHistory": "Ex-Google"
        },
        "problemSolving": "Solving critical inefficiencies in DeepTech through automation and AI.",
        "description": "A cutting-edge DeepTech platform.",
        "history": "Founded in 2022.",
        "metrics": {
            "valuation": "$16M",
            "stage": "Seed",
            "traction": "$8.5M ARR"
        },
        "tags": [
            "DeepTech",
            "AI"
        ],
        "emailVerified": true,
        "showInFeed": true,
        "verificationLevel": "verified"
    },
    {
        "id": "20",
        "name": "E-commerceSky 20",
        "logo": "🔋",
        "founder": {
            "name": "Donna Martinez",
            "avatar": "",
            "bio": "Serial entrepreneur scaling E-commerce solutions.",
            "education": "MIT University",
            "workHistory": "Ex-Meta"
        },
        "problemSolving": "Solving critical inefficiencies in E-commerce through automation and AI.",
        "description": "A cutting-edge E-commerce platform.",
        "history": "Founded in 2022.",
        "metrics": {
            "valuation": "$34M",
            "stage": "Pre-seed",
            "traction": "$8.5M ARR"
        },
        "tags": [
            "E-commerce",
            "AI"
        ],
        "emailVerified": true,
        "showInFeed": true,
        "verificationLevel": "basic"
    },
    {
        "id": "21",
        "name": "FinTechSky 21",
        "logo": "🌐",
        "founder": {
            "name": "Melissa Moore",
            "avatar": "",
            "bio": "Serial entrepreneur scaling FinTech solutions.",
            "education": "Oxford University",
            "workHistory": "Ex-Amazon"
        },
        "problemSolving": "Solving critical inefficiencies in FinTech through automation and AI.",
        "description": "A cutting-edge FinTech platform.",
        "history": "Founded in 2022.",
        "metrics": {
            "valuation": "$26M",
            "stage": "Series B",
            "traction": "$7.5M ARR"
        },
        "tags": [
            "FinTech",
            "AI"
        ],
        "emailVerified": true,
        "showInFeed": true,
        "verificationLevel": "basic"
    },
    {
        "id": "22",
        "name": "PropTechCore 22",
        "logo": "🎨",
        "founder": {
            "name": "Susan Carter",
            "avatar": "",
            "bio": "Serial entrepreneur scaling PropTech solutions.",
            "education": "Harvard University",
            "workHistory": "Ex-Apple"
        },
        "problemSolving": "Solving critical inefficiencies in PropTech through automation and AI.",
        "description": "A cutting-edge PropTech platform.",
        "history": "Founded in 2020.",
        "metrics": {
            "valuation": "$20M",
            "stage": "Series B",
            "traction": "$9.5M ARR"
        },
        "tags": [
            "PropTech",
            "AI"
        ],
        "emailVerified": true,
        "showInFeed": true,
        "verificationLevel": "basic"
    },
    {
        "id": "23",
        "name": "EdTechGrid 23",
        "logo": "⚕️",
        "founder": {
            "name": "Kimberly Allen",
            "avatar": "",
            "bio": "Serial entrepreneur scaling EdTech solutions.",
            "education": "IIT University",
            "workHistory": "Ex-Amazon"
        },
        "problemSolving": "Solving critical inefficiencies in EdTech through automation and AI.",
        "description": "A cutting-edge EdTech platform.",
        "history": "Founded in 2020.",
        "metrics": {
            "valuation": "$50M",
            "stage": "Seed",
            "traction": "$0.5M ARR"
        },
        "tags": [
            "EdTech",
            "AI"
        ],
        "emailVerified": true,
        "showInFeed": true,
        "verificationLevel": "verified"
    },
    {
        "id": "24",
        "name": "EdTechCore 24",
        "logo": "🌐",
        "founder": {
            "name": "Donald Harris",
            "avatar": "",
            "bio": "Serial entrepreneur scaling EdTech solutions.",
            "education": "Oxford University",
            "workHistory": "Ex-Meta"
        },
        "problemSolving": "Solving critical inefficiencies in EdTech through automation and AI.",
        "description": "A cutting-edge EdTech platform.",
        "history": "Founded in 2023.",
        "metrics": {
            "valuation": "$14M",
            "stage": "Series A",
            "traction": "$6.5M ARR"
        },
        "tags": [
            "EdTech",
            "AI"
        ],
        "emailVerified": true,
        "showInFeed": true,
        "verificationLevel": "verified"
    },
    {
        "id": "25",
        "name": "CleanTechSky 25",
        "logo": "📱",
        "founder": {
            "name": "Anthony Anderson",
            "avatar": "",
            "bio": "Serial entrepreneur scaling CleanTech solutions.",
            "education": "Harvard University",
            "workHistory": "Ex-Goldman Sachs"
        },
        "problemSolving": "Solving critical inefficiencies in CleanTech through automation and AI.",
        "description": "A cutting-edge CleanTech platform.",
        "history": "Founded in 2021.",
        "metrics": {
            "valuation": "$27M",
            "stage": "Ideation",
            "traction": "$4.5M ARR"
        },
        "tags": [
            "CleanTech",
            "AI"
        ],
        "emailVerified": true,
        "showInFeed": true,
        "verificationLevel": "basic"
    },
    {
        "id": "26",
        "name": "LogisticsBase 26",
        "logo": "🪙",
        "founder": {
            "name": "David Torres",
            "avatar": "",
            "bio": "Serial entrepreneur scaling Logistics solutions.",
            "education": "Oxford University",
            "workHistory": "Ex-Google"
        },
        "problemSolving": "Solving critical inefficiencies in Logistics through automation and AI.",
        "description": "A cutting-edge Logistics platform.",
        "history": "Founded in 2024.",
        "metrics": {
            "valuation": "$14M",
            "stage": "Pre-seed",
            "traction": "$8.5M ARR"
        },
        "tags": [
            "Logistics",
            "AI"
        ],
        "emailVerified": true,
        "showInFeed": true,
        "verificationLevel": "basic"
    },
    {
        "id": "27",
        "name": "PropTechCore 27",
        "logo": "🌾",
        "founder": {
            "name": "Matthew Lopez",
            "avatar": "",
            "bio": "Serial entrepreneur scaling PropTech solutions.",
            "education": "Oxford University",
            "workHistory": "Ex-Goldman Sachs"
        },
        "problemSolving": "Solving critical inefficiencies in PropTech through automation and AI.",
        "description": "A cutting-edge PropTech platform.",
        "history": "Founded in 2022.",
        "metrics": {
            "valuation": "$32M",
            "stage": "Ideation",
            "traction": "$1.5M ARR"
        },
        "tags": [
            "PropTech",
            "AI"
        ],
        "emailVerified": true,
        "showInFeed": true,
        "verificationLevel": "basic"
    },
    {
        "id": "28",
        "name": "LogisticsBase 28",
        "logo": "🪙",
        "founder": {
            "name": "Jessica Sanchez",
            "avatar": "",
            "bio": "Serial entrepreneur scaling Logistics solutions.",
            "education": "Oxford University",
            "workHistory": "Ex-Goldman Sachs"
        },
        "problemSolving": "Solving critical inefficiencies in Logistics through automation and AI.",
        "description": "A cutting-edge Logistics platform.",
        "history": "Founded in 2024.",
        "metrics": {
            "valuation": "$22M",
            "stage": "Series A",
            "traction": "$0.5M ARR"
        },
        "tags": [
            "Logistics",
            "AI"
        ],
        "emailVerified": true,
        "showInFeed": true,
        "verificationLevel": "basic"
    },
    {
        "id": "29",
        "name": "HealthTechFlow 29",
        "logo": "⚙️",
        "founder": {
            "name": "Kevin Moore",
            "avatar": "",
            "bio": "Serial entrepreneur scaling HealthTech solutions.",
            "education": "Stanford University",
            "workHistory": "Ex-Meta"
        },
        "problemSolving": "Solving critical inefficiencies in HealthTech through automation and AI.",
        "description": "A cutting-edge HealthTech platform.",
        "history": "Founded in 2022.",
        "metrics": {
            "valuation": "$39M",
            "stage": "Seed",
            "traction": "$8.5M ARR"
        },
        "tags": [
            "HealthTech",
            "AI"
        ],
        "emailVerified": true,
        "showInFeed": true,
        "verificationLevel": "basic"
    },
    {
        "id": "30",
        "name": "E-commerceGrid 30",
        "logo": "🚀",
        "founder": {
            "name": "Sarah Rivera",
            "avatar": "",
            "bio": "Serial entrepreneur scaling E-commerce solutions.",
            "education": "MIT University",
            "workHistory": "Ex-Meta"
        },
        "problemSolving": "Solving critical inefficiencies in E-commerce through automation and AI.",
        "description": "A cutting-edge E-commerce platform.",
        "history": "Founded in 2021.",
        "metrics": {
            "valuation": "$14M",
            "stage": "Seed",
            "traction": "$7.5M ARR"
        },
        "tags": [
            "E-commerce",
            "AI"
        ],
        "emailVerified": true,
        "showInFeed": true,
        "verificationLevel": "basic"
    },
    {
        "id": "31",
        "name": "PropTechCore 31",
        "logo": "🌾",
        "founder": {
            "name": "Sandra Lewis",
            "avatar": "",
            "bio": "Serial entrepreneur scaling PropTech solutions.",
            "education": "Oxford University",
            "workHistory": "Ex-Amazon"
        },
        "problemSolving": "Solving critical inefficiencies in PropTech through automation and AI.",
        "description": "A cutting-edge PropTech platform.",
        "history": "Founded in 2020.",
        "metrics": {
            "valuation": "$4M",
            "stage": "Seed",
            "traction": "$7.5M ARR"
        },
        "tags": [
            "PropTech",
            "AI"
        ],
        "emailVerified": true,
        "showInFeed": true,
        "verificationLevel": "basic"
    },
    {
        "id": "32",
        "name": "DeepTechNet 32",
        "logo": "🧠",
        "founder": {
            "name": "Andrew Nguyen",
            "avatar": "",
            "bio": "Serial entrepreneur scaling DeepTech solutions.",
            "education": "Harvard University",
            "workHistory": "Ex-Goldman Sachs"
        },
        "problemSolving": "Solving critical inefficiencies in DeepTech through automation and AI.",
        "description": "A cutting-edge DeepTech platform.",
        "history": "Founded in 2022.",
        "metrics": {
            "valuation": "$37M",
            "stage": "Pre-seed",
            "traction": "$0.5M ARR"
        },
        "tags": [
            "DeepTech",
            "AI"
        ],
        "emailVerified": true,
        "showInFeed": true,
        "verificationLevel": "basic"
    },
    {
        "id": "33",
        "name": "AgriTechBase 33",
        "logo": "🎨",
        "founder": {
            "name": "Carol Clark",
            "avatar": "",
            "bio": "Serial entrepreneur scaling AgriTech solutions.",
            "education": "Oxford University",
            "workHistory": "Ex-Meta"
        },
        "problemSolving": "Solving critical inefficiencies in AgriTech through automation and AI.",
        "description": "A cutting-edge AgriTech platform.",
        "history": "Founded in 2023.",
        "metrics": {
            "valuation": "$38M",
            "stage": "Pre-seed",
            "traction": "$4.5M ARR"
        },
        "tags": [
            "AgriTech",
            "AI"
        ],
        "emailVerified": true,
        "showInFeed": true,
        "verificationLevel": "basic"
    },
    {
        "id": "34",
        "name": "FinTechGrid 34",
        "logo": "🛡️",
        "founder": {
            "name": "Donald Torres",
            "avatar": "",
            "bio": "Serial entrepreneur scaling FinTech solutions.",
            "education": "Stanford University",
            "workHistory": "Ex-Goldman Sachs"
        },
        "problemSolving": "Solving critical inefficiencies in FinTech through automation and AI.",
        "description": "A cutting-edge FinTech platform.",
        "history": "Founded in 2023.",
        "metrics": {
            "valuation": "$3M",
            "stage": "Ideation",
            "traction": "$8.5M ARR"
        },
        "tags": [
            "FinTech",
            "AI"
        ],
        "emailVerified": true,
        "showInFeed": true,
        "verificationLevel": "basic"
    },
    {
        "id": "35",
        "name": "CleanTechNet 35",
        "logo": "📱",
        "founder": {
            "name": "Joseph Taylor",
            "avatar": "",
            "bio": "Serial entrepreneur scaling CleanTech solutions.",
            "education": "Harvard University",
            "workHistory": "Ex-Apple"
        },
        "problemSolving": "Solving critical inefficiencies in CleanTech through automation and AI.",
        "description": "A cutting-edge CleanTech platform.",
        "history": "Founded in 2021.",
        "metrics": {
            "valuation": "$24M",
            "stage": "Ideation",
            "traction": "$8.5M ARR"
        },
        "tags": [
            "CleanTech",
            "AI"
        ],
        "emailVerified": true,
        "showInFeed": true,
        "verificationLevel": "verified"
    },
    {
        "id": "36",
        "name": "DeepTechGrid 36",
        "logo": "🌾",
        "founder": {
            "name": "Amanda Young",
            "avatar": "",
            "bio": "Serial entrepreneur scaling DeepTech solutions.",
            "education": "Oxford University",
            "workHistory": "Ex-Apple"
        },
        "problemSolving": "Solving critical inefficiencies in DeepTech through automation and AI.",
        "description": "A cutting-edge DeepTech platform.",
        "history": "Founded in 2022.",
        "metrics": {
            "valuation": "$35M",
            "stage": "Seed",
            "traction": "$9.5M ARR"
        },
        "tags": [
            "DeepTech",
            "AI"
        ],
        "emailVerified": true,
        "showInFeed": true,
        "verificationLevel": "verified"
    },
    {
        "id": "37",
        "name": "EdTechBase 37",
        "logo": "⚙️",
        "founder": {
            "name": "Matthew Baker",
            "avatar": "",
            "bio": "Serial entrepreneur scaling EdTech solutions.",
            "education": "Harvard University",
            "workHistory": "Ex-Meta"
        },
        "problemSolving": "Solving critical inefficiencies in EdTech through automation and AI.",
        "description": "A cutting-edge EdTech platform.",
        "history": "Founded in 2021.",
        "metrics": {
            "valuation": "$14M",
            "stage": "Pre-seed",
            "traction": "$5.5M ARR"
        },
        "tags": [
            "EdTech",
            "AI"
        ],
        "emailVerified": true,
        "showInFeed": true,
        "verificationLevel": "verified"
    },
    {
        "id": "38",
        "name": "FinTechFlow 38",
        "logo": "🌐",
        "founder": {
            "name": "Mary Campbell",
            "avatar": "",
            "bio": "Serial entrepreneur scaling FinTech solutions.",
            "education": "Harvard University",
            "workHistory": "Ex-Amazon"
        },
        "problemSolving": "Solving critical inefficiencies in FinTech through automation and AI.",
        "description": "A cutting-edge FinTech platform.",
        "history": "Founded in 2022.",
        "metrics": {
            "valuation": "$1M",
            "stage": "Pre-seed",
            "traction": "$9.5M ARR"
        },
        "tags": [
            "FinTech",
            "AI"
        ],
        "emailVerified": true,
        "showInFeed": true,
        "verificationLevel": "basic"
    },
    {
        "id": "39",
        "name": "EdTechGrid 39",
        "logo": "☁️",
        "founder": {
            "name": "Michelle Johnson",
            "avatar": "",
            "bio": "Serial entrepreneur scaling EdTech solutions.",
            "education": "Oxford University",
            "workHistory": "Ex-Amazon"
        },
        "problemSolving": "Solving critical inefficiencies in EdTech through automation and AI.",
        "description": "A cutting-edge EdTech platform.",
        "history": "Founded in 2023.",
        "metrics": {
            "valuation": "$29M",
            "stage": "Series B",
            "traction": "$1.5M ARR"
        },
        "tags": [
            "EdTech",
            "AI"
        ],
        "emailVerified": true,
        "showInFeed": true,
        "verificationLevel": "verified"
    },
    {
        "id": "40",
        "name": "PropTechSky 40",
        "logo": "🧬",
        "founder": {
            "name": "Amanda Taylor",
            "avatar": "",
            "bio": "Serial entrepreneur scaling PropTech solutions.",
            "education": "Oxford University",
            "workHistory": "Ex-Google"
        },
        "problemSolving": "Solving critical inefficiencies in PropTech through automation and AI.",
        "description": "A cutting-edge PropTech platform.",
        "history": "Founded in 2023.",
        "metrics": {
            "valuation": "$13M",
            "stage": "Series A",
            "traction": "$7.5M ARR"
        },
        "tags": [
            "PropTech",
            "AI"
        ],
        "emailVerified": true,
        "showInFeed": true,
        "verificationLevel": "verified"
    },
    {
        "id": "41",
        "name": "HealthTechNet 41",
        "logo": "⚙️",
        "founder": {
            "name": "Kevin Miller",
            "avatar": "",
            "bio": "Serial entrepreneur scaling HealthTech solutions.",
            "education": "Harvard University",
            "workHistory": "Ex-Google"
        },
        "problemSolving": "Solving critical inefficiencies in HealthTech through automation and AI.",
        "description": "A cutting-edge HealthTech platform.",
        "history": "Founded in 2021.",
        "metrics": {
            "valuation": "$33M",
            "stage": "Series B",
            "traction": "$4.5M ARR"
        },
        "tags": [
            "HealthTech",
            "AI"
        ],
        "emailVerified": true,
        "showInFeed": true,
        "verificationLevel": "verified"
    },
    {
        "id": "42",
        "name": "FinTechCore 42",
        "logo": "⚙️",
        "founder": {
            "name": "Jessica Nguyen",
            "avatar": "",
            "bio": "Serial entrepreneur scaling FinTech solutions.",
            "education": "IIT University",
            "workHistory": "Ex-Google"
        },
        "problemSolving": "Solving critical inefficiencies in FinTech through automation and AI.",
        "description": "A cutting-edge FinTech platform.",
        "history": "Founded in 2022.",
        "metrics": {
            "valuation": "$41M",
            "stage": "Series B",
            "traction": "$9.5M ARR"
        },
        "tags": [
            "FinTech",
            "AI"
        ],
        "emailVerified": true,
        "showInFeed": true,
        "verificationLevel": "verified"
    },
    {
        "id": "43",
        "name": "LogisticsSky 43",
        "logo": "☁️",
        "founder": {
            "name": "Robert Martin",
            "avatar": "",
            "bio": "Serial entrepreneur scaling Logistics solutions.",
            "education": "Oxford University",
            "workHistory": "Ex-Google"
        },
        "problemSolving": "Solving critical inefficiencies in Logistics through automation and AI.",
        "description": "A cutting-edge Logistics platform.",
        "history": "Founded in 2021.",
        "metrics": {
            "valuation": "$49M",
            "stage": "Series B",
            "traction": "$5.5M ARR"
        },
        "tags": [
            "Logistics",
            "AI"
        ],
        "emailVerified": true,
        "showInFeed": true,
        "verificationLevel": "basic"
    },
    {
        "id": "44",
        "name": "AgriTechGrid 44",
        "logo": "☁️",
        "founder": {
            "name": "Linda Flores",
            "avatar": "",
            "bio": "Serial entrepreneur scaling AgriTech solutions.",
            "education": "Oxford University",
            "workHistory": "Ex-Goldman Sachs"
        },
        "problemSolving": "Solving critical inefficiencies in AgriTech through automation and AI.",
        "description": "A cutting-edge AgriTech platform.",
        "history": "Founded in 2024.",
        "metrics": {
            "valuation": "$38M",
            "stage": "Series B",
            "traction": "$6.5M ARR"
        },
        "tags": [
            "AgriTech",
            "AI"
        ],
        "emailVerified": true,
        "showInFeed": true,
        "verificationLevel": "basic"
    },
    {
        "id": "45",
        "name": "E-commerceNet 45",
        "logo": "📱",
        "founder": {
            "name": "Melissa Lopez",
            "avatar": "",
            "bio": "Serial entrepreneur scaling E-commerce solutions.",
            "education": "Oxford University",
            "workHistory": "Ex-Goldman Sachs"
        },
        "problemSolving": "Solving critical inefficiencies in E-commerce through automation and AI.",
        "description": "A cutting-edge E-commerce platform.",
        "history": "Founded in 2022.",
        "metrics": {
            "valuation": "$50M",
            "stage": "Series A",
            "traction": "$4.5M ARR"
        },
        "tags": [
            "E-commerce",
            "AI"
        ],
        "emailVerified": true,
        "showInFeed": true,
        "verificationLevel": "verified"
    },
    {
        "id": "46",
        "name": "CleanTechFlow 46",
        "logo": "🧬",
        "founder": {
            "name": "Michael Hall",
            "avatar": "",
            "bio": "Serial entrepreneur scaling CleanTech solutions.",
            "education": "Harvard University",
            "workHistory": "Ex-Meta"
        },
        "problemSolving": "Solving critical inefficiencies in CleanTech through automation and AI.",
        "description": "A cutting-edge CleanTech platform.",
        "history": "Founded in 2021.",
        "metrics": {
            "valuation": "$43M",
            "stage": "Ideation",
            "traction": "$6.5M ARR"
        },
        "tags": [
            "CleanTech",
            "AI"
        ],
        "emailVerified": true,
        "showInFeed": true,
        "verificationLevel": "verified"
    },
    {
        "id": "47",
        "name": "CleanTechBase 47",
        "logo": "🛡️",
        "founder": {
            "name": "Thomas Anderson",
            "avatar": "",
            "bio": "Serial entrepreneur scaling CleanTech solutions.",
            "education": "Harvard University",
            "workHistory": "Ex-Amazon"
        },
        "problemSolving": "Solving critical inefficiencies in CleanTech through automation and AI.",
        "description": "A cutting-edge CleanTech platform.",
        "history": "Founded in 2022.",
        "metrics": {
            "valuation": "$14M",
            "stage": "Ideation",
            "traction": "$7.5M ARR"
        },
        "tags": [
            "CleanTech",
            "AI"
        ],
        "emailVerified": true,
        "showInFeed": true,
        "verificationLevel": "verified"
    },
    {
        "id": "48",
        "name": "PropTechNet 48",
        "logo": "☁️",
        "founder": {
            "name": "Sandra Hill",
            "avatar": "",
            "bio": "Serial entrepreneur scaling PropTech solutions.",
            "education": "IIT University",
            "workHistory": "Ex-Apple"
        },
        "problemSolving": "Solving critical inefficiencies in PropTech through automation and AI.",
        "description": "A cutting-edge PropTech platform.",
        "history": "Founded in 2021.",
        "metrics": {
            "valuation": "$28M",
            "stage": "Seed",
            "traction": "$9.5M ARR"
        },
        "tags": [
            "PropTech",
            "AI"
        ],
        "emailVerified": true,
        "showInFeed": true,
        "verificationLevel": "basic"
    },
    {
        "id": "49",
        "name": "PropTechBase 49",
        "logo": "🌾",
        "founder": {
            "name": "Charles Thomas",
            "avatar": "",
            "bio": "Serial entrepreneur scaling PropTech solutions.",
            "education": "Stanford University",
            "workHistory": "Ex-Google"
        },
        "problemSolving": "Solving critical inefficiencies in PropTech through automation and AI.",
        "description": "A cutting-edge PropTech platform.",
        "history": "Founded in 2023.",
        "metrics": {
            "valuation": "$5M",
            "stage": "Pre-seed",
            "traction": "$5.5M ARR"
        },
        "tags": [
            "PropTech",
            "AI"
        ],
        "emailVerified": true,
        "showInFeed": true,
        "verificationLevel": "verified"
    },
    {
        "id": "50",
        "name": "E-commerceNet 50",
        "logo": "🍜",
        "founder": {
            "name": "Donna Lee",
            "avatar": "",
            "bio": "Serial entrepreneur scaling E-commerce solutions.",
            "education": "Stanford University",
            "workHistory": "Ex-Goldman Sachs"
        },
        "problemSolving": "Solving critical inefficiencies in E-commerce through automation and AI.",
        "description": "A cutting-edge E-commerce platform.",
        "history": "Founded in 2024.",
        "metrics": {
            "valuation": "$34M",
            "stage": "Series B",
            "traction": "$0.5M ARR"
        },
        "tags": [
            "E-commerce",
            "AI"
        ],
        "emailVerified": true,
        "showInFeed": true,
        "verificationLevel": "basic"
    }
];

export interface InvestorProfileDetails {
    investment_preferences?: {
        stage: string[]
        ticket_size_min: number
        ticket_size_max: number
        industry_focus: string[]
        geographic_preference: string[]
        business_model: string[]
        revenue_preference: string
        ownership_percentage_min: number
        ownership_percentage_max: number
    }
    decision_process?: {
        speed: 'Fast' | 'Moderate' | 'Long-term'
        due_diligence: 'Light' | 'Standard' | 'Deep'
        follow_on: boolean
        syndication: 'Solo' | 'Co-invests' | 'Lead'
        hands_on_level: 'Mentor' | 'Board Member' | 'Strategic Advisor' | 'Passive'
    }
    value_add?: {
        expertise: string[]
        network: string[]
        has_founder_experience: boolean
        exits_count: number
    }
    portfolio?: {
        stage_breakdown: Record<string, number>
        active_count: number
        exited_count: number
        notable_investments: string[]
        average_check_size: number
        success_stories: string[]
    }
    communication?: {
        pitch_format: string[]
        contact_mode: string[]
        office_hours: string
        response_time: string
    }
    social_proof?: {
        linkedin: string
        website: string
        investor_type: string
        references: string[]
    }
}

export interface Investor {
    id: string
    name: string
    avatar: string
    title?: string
    bio: string
    fundsAvailable: string
    investments: number
    expertise: string[]
    impactPoints?: number
    verificationLevel?: 'basic' | 'verified' | 'trusted'
    profile_details?: InvestorProfileDetails
    last_active_at?: string
}

export const MOCK_INVESTORS: Investor[] = [
    {
        "id": "i1",
        "name": "Anthony Smith",
        "avatar": "",
        "bio": "Angel investor focused on early-stage CleanTech and PropTech.",
        "fundsAvailable": "$295M",
        "investments": 28,
        "expertise": [
            "CleanTech",
            "PropTech"
        ]
    },
    {
        "id": "i2",
        "name": "Lisa Adams",
        "avatar": "",
        "bio": "Angel investor focused on early-stage FinTech and EdTech.",
        "fundsAvailable": "$325M",
        "investments": 8,
        "expertise": [
            "FinTech",
            "EdTech"
        ],
        "last_active_at": new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString()
    },
    {
        "id": "i3",
        "name": "Sarah Green",
        "avatar": "",
        "bio": "Angel investor focused on early-stage FinTech and Logistics.",
        "fundsAvailable": "$417M",
        "investments": 6,
        "expertise": [
            "FinTech",
            "Logistics"
        ]
    },
    {
        "id": "i4",
        "name": "Betty Allen",
        "avatar": "",
        "bio": "Angel investor focused on early-stage PropTech and FinTech.",
        "fundsAvailable": "$80M",
        "investments": 22,
        "expertise": [
            "PropTech",
            "FinTech"
        ]
    },
    {
        "id": "i5",
        "name": "David Lewis",
        "avatar": "",
        "bio": "Angel investor focused on early-stage EdTech and AgriTech.",
        "fundsAvailable": "$296M",
        "investments": 21,
        "expertise": [
            "EdTech",
            "AgriTech"
        ]
    },
    {
        "id": "i6",
        "name": "Michelle Gonzalez",
        "avatar": "",
        "bio": "Angel investor focused on early-stage Logistics and SaaS.",
        "fundsAvailable": "$347M",
        "investments": 13,
        "expertise": [
            "Logistics",
            "SaaS"
        ]
    },
    {
        "id": "i7",
        "name": "Jennifer Jackson",
        "avatar": "",
        "bio": "Angel investor focused on early-stage HealthTech and E-commerce.",
        "fundsAvailable": "$457M",
        "investments": 29,
        "expertise": [
            "HealthTech",
            "E-commerce"
        ]
    },
    {
        "id": "i8",
        "name": "James Nguyen",
        "avatar": "",
        "bio": "Angel investor focused on early-stage SaaS and CleanTech.",
        "fundsAvailable": "$64M",
        "investments": 28,
        "expertise": [
            "SaaS",
            "CleanTech"
        ]
    },
    {
        "id": "i9",
        "name": "Richard Hall",
        "avatar": "",
        "bio": "Angel investor focused on early-stage DeepTech and DeepTech.",
        "fundsAvailable": "$191M",
        "investments": 24,
        "expertise": [
            "DeepTech"
        ]
    },
    {
        "id": "i10",
        "name": "Richard Allen",
        "avatar": "",
        "bio": "Angel investor focused on early-stage PropTech and Logistics.",
        "fundsAvailable": "$493M",
        "investments": 22,
        "expertise": [
            "PropTech",
            "Logistics"
        ]
    },
    {
        "id": "i11",
        "name": "Robert Lee",
        "avatar": "",
        "bio": "Angel investor focused on early-stage HealthTech and DeepTech.",
        "fundsAvailable": "$86M",
        "investments": 14,
        "expertise": [
            "HealthTech",
            "DeepTech"
        ]
    },
    {
        "id": "i12",
        "name": "Dorothy Clark",
        "avatar": "",
        "bio": "Angel investor focused on early-stage DeepTech and HealthTech.",
        "fundsAvailable": "$460M",
        "investments": 16,
        "expertise": [
            "DeepTech",
            "HealthTech"
        ]
    },
    {
        "id": "i13",
        "name": "Richard Anderson",
        "avatar": "",
        "bio": "Angel investor focused on early-stage FinTech and PropTech.",
        "fundsAvailable": "$143M",
        "investments": 25,
        "expertise": [
            "FinTech",
            "PropTech"
        ]
    },
    {
        "id": "i14",
        "name": "Joshua Lee",
        "avatar": "",
        "bio": "Angel investor focused on early-stage Logistics and E-commerce.",
        "fundsAvailable": "$261M",
        "investments": 31,
        "expertise": [
            "Logistics",
            "E-commerce"
        ]
    },
    {
        "id": "i15",
        "name": "Ashley Rodriguez",
        "avatar": "",
        "bio": "Angel investor focused on early-stage HealthTech and DeepTech.",
        "fundsAvailable": "$467M",
        "investments": 7,
        "expertise": [
            "HealthTech",
            "DeepTech"
        ]
    },
    {
        "id": "i16",
        "name": "Robert Gonzalez",
        "avatar": "",
        "bio": "Angel investor focused on early-stage FinTech and AgriTech.",
        "fundsAvailable": "$410M",
        "investments": 7,
        "expertise": [
            "FinTech",
            "AgriTech"
        ]
    },
    {
        "id": "i17",
        "name": "Deborah Adams",
        "avatar": "",
        "bio": "Angel investor focused on early-stage AgriTech and Logistics.",
        "fundsAvailable": "$108M",
        "investments": 9,
        "expertise": [
            "AgriTech",
            "Logistics"
        ]
    },
    {
        "id": "i18",
        "name": "Brian Hall",
        "avatar": "",
        "bio": "Angel investor focused on early-stage HealthTech and CleanTech.",
        "fundsAvailable": "$482M",
        "investments": 27,
        "expertise": [
            "HealthTech",
            "CleanTech"
        ]
    },
    {
        "id": "i19",
        "name": "William Mitchell",
        "avatar": "",
        "bio": "Angel investor focused on early-stage Logistics and DeepTech.",
        "fundsAvailable": "$37M",
        "investments": 25,
        "expertise": [
            "Logistics",
            "DeepTech"
        ]
    },
    {
        "id": "i20",
        "name": "Amanda Rivera",
        "avatar": "",
        "bio": "Angel investor focused on early-stage FinTech and DeepTech.",
        "fundsAvailable": "$124M",
        "investments": 17,
        "expertise": [
            "FinTech",
            "DeepTech"
        ]
    },
    {
        "id": "i21",
        "name": "Edward Rivera",
        "avatar": "",
        "bio": "Angel investor focused on early-stage FinTech and E-commerce.",
        "fundsAvailable": "$20M",
        "investments": 25,
        "expertise": [
            "FinTech",
            "E-commerce"
        ]
    },
    {
        "id": "i22",
        "name": "Kimberly Sanchez",
        "avatar": "",
        "bio": "Angel investor focused on early-stage SaaS and Logistics.",
        "fundsAvailable": "$158M",
        "investments": 26,
        "expertise": [
            "SaaS",
            "Logistics"
        ]
    },
    {
        "id": "i23",
        "name": "Matthew Roberts",
        "avatar": "",
        "bio": "Angel investor focused on early-stage HealthTech and FinTech.",
        "fundsAvailable": "$322M",
        "investments": 17,
        "expertise": [
            "HealthTech",
            "FinTech"
        ]
    },
    {
        "id": "i24",
        "name": "Kimberly Rodriguez",
        "avatar": "",
        "bio": "Angel investor focused on early-stage SaaS and PropTech.",
        "fundsAvailable": "$119M",
        "investments": 30,
        "expertise": [
            "SaaS",
            "PropTech"
        ]
    },
    {
        "id": "i25",
        "name": "Emily Ramirez",
        "avatar": "",
        "bio": "Angel investor focused on early-stage HealthTech and Logistics.",
        "fundsAvailable": "$238M",
        "investments": 13,
        "expertise": [
            "HealthTech",
            "Logistics"
        ]
    },
    {
        "id": "i26",
        "name": "Kimberly Jones",
        "avatar": "",
        "bio": "Angel investor focused on early-stage PropTech and DeepTech.",
        "fundsAvailable": "$435M",
        "investments": 13,
        "expertise": [
            "PropTech",
            "DeepTech"
        ]
    },
    {
        "id": "i27",
        "name": "Edward King",
        "avatar": "",
        "bio": "Angel investor focused on early-stage AgriTech and E-commerce.",
        "fundsAvailable": "$287M",
        "investments": 26,
        "expertise": [
            "AgriTech",
            "E-commerce"
        ]
    },
    {
        "id": "i28",
        "name": "Karen Moore",
        "avatar": "",
        "bio": "Angel investor focused on early-stage DeepTech and EdTech.",
        "fundsAvailable": "$180M",
        "investments": 11,
        "expertise": [
            "DeepTech",
            "EdTech"
        ]
    },
    {
        "id": "i29",
        "name": "Elizabeth Wright",
        "avatar": "",
        "bio": "Angel investor focused on early-stage DeepTech and Logistics.",
        "fundsAvailable": "$372M",
        "investments": 32,
        "expertise": [
            "DeepTech",
            "Logistics"
        ]
    },
    {
        "id": "i30",
        "name": "Mark Moore",
        "avatar": "",
        "bio": "Angel investor focused on early-stage E-commerce and CleanTech.",
        "fundsAvailable": "$21M",
        "investments": 13,
        "expertise": [
            "E-commerce",
            "CleanTech"
        ]
    },
    {
        "id": "i31",
        "name": "Matthew Anderson",
        "avatar": "",
        "bio": "Angel investor focused on early-stage CleanTech and CleanTech.",
        "fundsAvailable": "$274M",
        "investments": 14,
        "expertise": [
            "CleanTech"
        ]
    },
    {
        "id": "i32",
        "name": "Steven Rodriguez",
        "avatar": "",
        "bio": "Angel investor focused on early-stage CleanTech and PropTech.",
        "fundsAvailable": "$71M",
        "investments": 16,
        "expertise": [
            "CleanTech",
            "PropTech"
        ]
    },
    {
        "id": "i33",
        "name": "Deborah Moore",
        "avatar": "",
        "bio": "Angel investor focused on early-stage PropTech and E-commerce.",
        "fundsAvailable": "$107M",
        "investments": 30,
        "expertise": [
            "PropTech",
            "E-commerce"
        ]
    },
    {
        "id": "i34",
        "name": "John Martin",
        "avatar": "",
        "bio": "Angel investor focused on early-stage Logistics and AgriTech.",
        "fundsAvailable": "$46M",
        "investments": 7,
        "expertise": [
            "Logistics",
            "AgriTech"
        ]
    },
    {
        "id": "i35",
        "name": "James Carter",
        "avatar": "",
        "bio": "Angel investor focused on early-stage Logistics and AgriTech.",
        "fundsAvailable": "$155M",
        "investments": 27,
        "expertise": [
            "Logistics",
            "AgriTech"
        ]
    },
    {
        "id": "i36",
        "name": "Edward Perez",
        "avatar": "",
        "bio": "Angel investor focused on early-stage FinTech and PropTech.",
        "fundsAvailable": "$154M",
        "investments": 30,
        "expertise": [
            "FinTech",
            "PropTech"
        ]
    },
    {
        "id": "i37",
        "name": "Sarah Walker",
        "avatar": "",
        "bio": "Angel investor focused on early-stage HealthTech and E-commerce.",
        "fundsAvailable": "$208M",
        "investments": 12,
        "expertise": [
            "HealthTech",
            "E-commerce"
        ]
    },
    {
        "id": "i38",
        "name": "Matthew Nguyen",
        "avatar": "",
        "bio": "Angel investor focused on early-stage SaaS and HealthTech.",
        "fundsAvailable": "$86M",
        "investments": 23,
        "expertise": [
            "SaaS",
            "HealthTech"
        ]
    },
    {
        "id": "i39",
        "name": "Elizabeth Campbell",
        "avatar": "",
        "bio": "Angel investor focused on early-stage FinTech and FinTech.",
        "fundsAvailable": "$291M",
        "investments": 15,
        "expertise": [
            "FinTech"
        ]
    },
    {
        "id": "i40",
        "name": "Patricia Thomas",
        "avatar": "",
        "bio": "Angel investor focused on early-stage PropTech and PropTech.",
        "fundsAvailable": "$218M",
        "investments": 10,
        "expertise": [
            "PropTech"
        ]
    },
    {
        "id": "i41",
        "name": "Emily Scott",
        "avatar": "",
        "bio": "Angel investor focused on early-stage CleanTech and PropTech.",
        "fundsAvailable": "$373M",
        "investments": 18,
        "expertise": [
            "CleanTech",
            "PropTech"
        ]
    },
    {
        "id": "i42",
        "name": "Melissa Wilson",
        "avatar": "",
        "bio": "Angel investor focused on early-stage Logistics and DeepTech.",
        "fundsAvailable": "$481M",
        "investments": 34,
        "expertise": [
            "Logistics",
            "DeepTech"
        ]
    },
    {
        "id": "i43",
        "name": "Steven Nguyen",
        "avatar": "",
        "bio": "Angel investor focused on early-stage CleanTech and FinTech.",
        "fundsAvailable": "$309M",
        "investments": 21,
        "expertise": [
            "CleanTech",
            "FinTech"
        ]
    },
    {
        "id": "i44",
        "name": "Richard Baker",
        "avatar": "",
        "bio": "Angel investor focused on early-stage Logistics and SaaS.",
        "fundsAvailable": "$468M",
        "investments": 6,
        "expertise": [
            "Logistics",
            "SaaS"
        ]
    },
    {
        "id": "i45",
        "name": "Daniel Anderson",
        "avatar": "",
        "bio": "Angel investor focused on early-stage EdTech and Logistics.",
        "fundsAvailable": "$327M",
        "investments": 13,
        "expertise": [
            "EdTech",
            "Logistics"
        ]
    },
    {
        "id": "i46",
        "name": "Kenneth Anderson",
        "avatar": "",
        "bio": "Angel investor focused on early-stage HealthTech and SaaS.",
        "fundsAvailable": "$238M",
        "investments": 21,
        "expertise": [
            "HealthTech",
            "SaaS"
        ]
    },
    {
        "id": "i47",
        "name": "Jessica Baker",
        "avatar": "",
        "bio": "Angel investor focused on early-stage E-commerce and DeepTech.",
        "fundsAvailable": "$311M",
        "investments": 29,
        "expertise": [
            "E-commerce",
            "DeepTech"
        ]
    },
    {
        "id": "i48",
        "name": "Joshua Allen",
        "avatar": "",
        "bio": "Angel investor focused on early-stage AgriTech and EdTech.",
        "fundsAvailable": "$392M",
        "investments": 19,
        "expertise": [
            "AgriTech",
            "EdTech"
        ]
    },
    {
        "id": "i49",
        "name": "Matthew Perez",
        "avatar": "",
        "bio": "Angel investor focused on early-stage AgriTech and CleanTech.",
        "fundsAvailable": "$114M",
        "investments": 8,
        "expertise": [
            "AgriTech",
            "CleanTech"
        ]
    },
    {
        "id": "i50",
        "name": "Patricia Brown",
        "avatar": "",
        "bio": "Angel investor focused on early-stage Logistics and DeepTech.",
        "fundsAvailable": "$485M",
        "investments": 6,
        "expertise": [
            "Logistics",
            "DeepTech"
        ]
    }
];
