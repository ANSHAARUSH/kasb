export type SubscriptionTier =
    | 'discovery' | 'starter' | 'growth' | 'fundraise_pro'
    | 'explore' | 'investor_basic' | 'investor_pro' | 'institutional';

export type UserRegion = 'India' | 'UAE' | 'Global';

export interface TierConfig {
    id: SubscriptionTier;
    name: string;
    price: number;
    currency: string;
    features: string[];
    isPopular?: boolean;
}

export const REGION_CONFIG: Record<UserRegion, { multiplier: number; exchangeRate: number; symbol: string }> = {
    'India': { multiplier: 1, exchangeRate: 1, symbol: '₹' },
    'UAE': { multiplier: 1.3, exchangeRate: 22.7, symbol: 'AED ' },
    'Global': { multiplier: 1.5, exchangeRate: 83, symbol: '$' }
};

export const TIER_LIMITS: Record<SubscriptionTier, { profileViews: number; contacts: number }> = {
    'discovery': { profileViews: 2, contacts: 0 },
    'starter': { profileViews: 100, contacts: 10 },
    'growth': { profileViews: Infinity, contacts: Infinity },
    'fundraise_pro': { profileViews: Infinity, contacts: Infinity },
    'explore': { profileViews: 5, contacts: 0 },
    'investor_basic': { profileViews: 100, contacts: 20 },
    'investor_pro': { profileViews: Infinity, contacts: Infinity },
    'institutional': { profileViews: Infinity, contacts: Infinity }
};

export const STARTUP_TIERS: TierConfig[] = [
    {
        id: 'discovery',
        name: 'Discovery',
        price: 0,
        currency: 'INR',
        features: ['Basic visibility', 'Limited investor discovery', '2 profile views/month', 'AI match previews (blurred)']
    },
    {
        id: 'starter',
        name: 'Starter',
        price: 999,
        currency: 'INR',
        features: ['AI investor matching', '10 investor contacts/month', 'Basic pitch analytics', 'Standard support']
    },
    {
        id: 'growth',
        name: 'Growth',
        price: 2499,
        currency: 'INR',
        features: ['Unlimited discovery', 'Advanced AI match scoring', 'AI pitch deck feedback', 'Investor interest signals'],
        isPopular: true
    },
    {
        id: 'fundraise_pro',
        name: 'Fundraise Pro',
        price: 4999,
        currency: 'INR',
        features: ['Featured startup badge', 'AI warm intros', 'Fundraising timeline tracking', 'Dedicated success manager']
    }
];

export const INVESTOR_TIERS: TierConfig[] = [
    {
        id: 'explore',
        name: 'Explore',
        price: 0,
        currency: 'INR',
        features: ['Browse startups', '5 AI matches/month', 'Basic filters', 'No direct contact']
    },
    {
        id: 'investor_basic',
        name: 'Investor Basic',
        price: 4999,
        currency: 'INR',
        features: ['AI-curated startup feed', '20 startup contacts/month', 'Industry/Geo filters', 'Bookmarking tools']
    },
    {
        id: 'investor_pro',
        name: 'Investor Pro',
        price: 9999,
        currency: 'INR',
        features: ['Unlimited startup access', 'Advanced AI scoring (Team/Risk)', 'Deal-flow analytics', 'CRM-style tracking'],
        isPopular: true
    },
    {
        id: 'institutional',
        name: 'Institutional / VC+',
        price: 24999,
        currency: 'INR',
        features: ['Custom AI thesis matching', 'API & data export', 'Multiple team seats', 'White-label reports']
    }
];

class SubscriptionManager {
    private currentRegion: UserRegion = 'India';
    private activeTier: SubscriptionTier = 'explore'; // Default

    setRegion(region: UserRegion) {
        this.currentRegion = region;
        localStorage.setItem('kasb_user_region', region);
    }

    getRegion(): UserRegion {
        const saved = localStorage.getItem('kasb_user_region') as UserRegion;
        return saved || this.currentRegion;
    }

    setTier(tier: SubscriptionTier) {
        this.activeTier = tier;
        localStorage.setItem('kasb_user_tier', tier);
    }

    getTier(): SubscriptionTier {
        const saved = localStorage.getItem('kasb_user_tier') as SubscriptionTier;
        return saved || this.activeTier;
    }

    formatPrice(basePrice: number): { value: string; symbol: string } {
        const config = REGION_CONFIG[this.getRegion()];
        const adjustedPrice = Math.round((basePrice * config.multiplier) / config.exchangeRate);

        return {
            value: adjustedPrice === 0 ? '0' : adjustedPrice.toLocaleString(),
            symbol: config.symbol
        };
    }

    hasFeature(feature: string): boolean {
        // Mock logic: check tier lists for feature existence
        const allTiers = [...STARTUP_TIERS, ...INVESTOR_TIERS];
        const tier = allTiers.find(t => t.id === this.getTier());
        return tier?.features.some(f => f.toLowerCase().includes(feature.toLowerCase())) || false;
    }

    getUsage() {
        const saved = localStorage.getItem('kasb_usage');
        return saved ? JSON.parse(saved) : { profileViews: 0, contacts: 0 };
    }

    trackView() {
        const usage = this.getUsage();
        usage.profileViews += 1;
        localStorage.setItem('kasb_usage', JSON.stringify(usage));
    }

    canViewProfile(): boolean {
        const tier = this.getTier();
        const limits = TIER_LIMITS[tier];
        const usage = this.getUsage();
        return usage.profileViews < limits.profileViews;
    }
}

export const subscriptionManager = new SubscriptionManager();
