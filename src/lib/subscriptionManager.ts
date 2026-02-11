import { supabase } from "./supabase";

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
    freePoints?: number;
}

export const REGION_CONFIG: Record<UserRegion, { multiplier: number; exchangeRate: number; symbol: string }> = {
    'India': { multiplier: 1, exchangeRate: 1, symbol: '₹' },
    'UAE': { multiplier: 1.3, exchangeRate: 22.7, symbol: 'AED ' },
    'Global': { multiplier: 1.5, exchangeRate: 83, symbol: '$' }
};

export const TIER_LIMITS: Record<SubscriptionTier, { profileViews: number; contacts: number; compares: number }> = {
    'discovery': { profileViews: Infinity, contacts: 0, compares: 0 },
    'starter': { profileViews: Infinity, contacts: 50, compares: 50 },
    'growth': { profileViews: Infinity, contacts: 150, compares: 200 },
    'fundraise_pro': { profileViews: Infinity, contacts: Infinity, compares: Infinity },
    'explore': { profileViews: Infinity, contacts: 0, compares: 0 },
    'investor_basic': { profileViews: Infinity, contacts: 50, compares: 50 },
    'investor_pro': { profileViews: Infinity, contacts: 150, compares: 200 },
    'institutional': { profileViews: Infinity, contacts: Infinity, compares: Infinity }
};

export const STARTUP_TIERS: TierConfig[] = [
    {
        id: 'discovery',
        name: 'Discovery',
        price: 0,
        currency: 'INR',
        features: ['Unlimited investor viewing', 'Randomized investor feed', 'No comparison tools', 'No direct contact']
    },
    {
        id: 'starter',
        name: 'Starter',
        price: 999,
        currency: 'INR',
        features: [
            'Unlimited investor viewing',
            '50 investor contacts/month',
            '50 comparisons/month',
            'Enhanced feed visibility',
            'AI-curated recommendations',
            'Recommended label with insights',
            'Full Industry/Geo filters (State/City)',
            'Standard Customer Support'
        ]
    },
    {
        id: 'growth',
        name: 'Growth',
        price: 2499,
        currency: 'INR',
        features: [
            'Unlimited investor viewing',
            '150 investor contacts/month',
            '200 comparisons/month',
            'Top-tier feed visibility',
            'AI-curated recommendations',
            'AI Insights Summary',
            'Deep Founder Profile Analysis',
            'Full Geography filters (State/City)',
            'Export Deal-flow to CSV',
            'Priority Email & Chat Support',
            'Early access to new startups'
        ],
        isPopular: true
    },
    {
        id: 'fundraise_pro',
        name: 'Fundraise Pro',
        price: 4999,
        currency: 'INR',
        features: [
            'Unlimited investor viewing',
            'Unlimited investor contacts',
            'Unlimited comparisons',
            'Top-tier feed visibility',
            'AI-curated recommendations',
            'AI Insights Summary',
            'Deep investor Profile Analysis',
            'Full Geography filters (State/City)',
            'Export Deal-flow to CSV',
            'Priority Email & Chat Support',
            'Early access to Beta features',
            'Personalized investment matching',
            'And more features coming soon...'
        ]
    }
];

export const INVESTOR_TIERS: TierConfig[] = [
    {
        id: 'explore',
        name: 'Explore',
        price: 0,
        currency: 'INR',
        features: ['Unlimited startup viewing', 'Randomized startup feed', 'No comparison tools', 'No direct contact']
    },
    {
        id: 'investor_basic',
        name: 'Investor Basic',
        price: 8999,
        currency: 'INR',
        freePoints: 150,
        features: [
            'Unlimited startup viewing',
            '50 startup contacts/month',
            '50 comparisons/month',
            'Enhanced feed visibility',
            'AI-curated recommendations',
            'Recommended label with insights',
            'Full Industry/Geo filters (State/City)',
            'Standard Customer Support'
        ]
    },
    {
        id: 'investor_pro',
        name: 'Investor Pro',
        price: 12999,
        currency: 'INR',
        freePoints: 250,
        features: [
            'Unlimited startup viewing',
            '150 startup contacts/month',
            '200 comparisons/month',
            'Top-tier feed visibility',
            'AI-curated recommendations',
            'AI Insights Summary',
            'Deep Founder Profile Analysis',
            'Full Geography filters (State/City)',
            'Export Deal-flow to CSV',
            'Priority Email & Chat Support',
            'Early access to new startups'
        ],
        isPopular: true
    },
    {
        id: 'institutional',
        name: 'Institutional / VC+',
        price: 17999,
        currency: 'INR',
        freePoints: 350,
        features: [
            'Unlimited startup viewing',
            'Unlimited startup contacts',
            'Unlimited comparisons',
            'Top-tier feed visibility',
            'AI-curated recommendations',
            'AI Insights Summary',
            'Deep Founder Profile Analysis',
            'Full Geography filters (State/City)',
            'Export Deal-flow to CSV',
            'Priority Email & Chat Support',
            'Early access to new startups',
            'Early access to Beta features',
            'Personalized investment matching',
            'And more features coming soon...'
        ]
    }
];

class SubscriptionManager {
    private currentRegion: UserRegion = 'India';
    private activeTier: SubscriptionTier = 'explore'; // Default
    private userId: string | null = null;

    setUserId(userId: string | null) {
        this.userId = userId;
        // Reset in-memory cache to prevent state leakage between accounts
        this.activeTier = 'explore';
        this.currentRegion = 'India';
    }

    private getStorageKey(key: string): string {
        return this.userId ? `${key}_${this.userId}` : key;
    }

    setRegion(region: UserRegion) {
        this.currentRegion = region;
        localStorage.setItem(this.getStorageKey('kasb_user_region'), region);
    }

    getRegion(): UserRegion {
        const saved = localStorage.getItem(this.getStorageKey('kasb_user_region')) as UserRegion;
        return saved || this.currentRegion;
    }

    /**
     * Updates the local active tier without triggering a Supabase sync.
     * Useful for initial load or when tiers are fetched from AuthContext.
     */
    updateLocalTier(tier: SubscriptionTier) {
        this.activeTier = tier;
        localStorage.setItem(this.getStorageKey('kasb_user_tier'), tier);
    }

    async setTier(tier: SubscriptionTier) {
        this.updateLocalTier(tier);

        if (this.userId) {
            const { error } = await supabase
                .from('user_subscriptions')
                .upsert({
                    user_id: this.userId,
                    tier,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id' });

            if (error) {
                console.error('Error saving subscription to Supabase:', error);
                throw new Error(`Sync failed: ${error.message}`);
            }

            // Also sync to main tables for public visibility in feed (fallback)
            const syncTiers = async () => {
                try {
                    const startupTiers = ['discovery', 'starter', 'growth', 'fundraise_pro']
                    const investorTiers = ['explore', 'investor_basic', 'investor_pro', 'institutional']

                    const promises = []
                    if (startupTiers.includes(tier)) {
                        promises.push(supabase.from('startups').update({ subscription_tier: tier }).eq('id', this.userId))
                    }
                    if (investorTiers.includes(tier)) {
                        promises.push(supabase.from('investors').update({ subscription_tier: tier }).eq('id', this.userId))
                    }

                    if (promises.length > 0) {
                        await Promise.all(promises)
                    }
                } catch (syncErr) {
                    console.error('Fallback tier sync failed:', syncErr);
                }
            };
            syncTiers();
        }
    }

    getTier(): SubscriptionTier {
        if (!this.userId) return this.activeTier;
        const saved = localStorage.getItem(this.getStorageKey('kasb_user_tier')) as SubscriptionTier;
        return saved || this.activeTier;
    }

    async refreshTier(): Promise<SubscriptionTier> {
        if (!this.userId) return this.activeTier;

        try {
            const { data, error } = await supabase
                .from('user_subscriptions')
                .select('tier')
                .eq('user_id', this.userId)
                .single();

            if (error) {
                if (error.code !== 'PGRST116') {
                    console.error('Error fetching subscription from Supabase:', error);
                }
                return this.getTier();
            }

            if (data?.tier) {
                const tier = data.tier as SubscriptionTier;
                this.activeTier = tier;
                localStorage.setItem(this.getStorageKey('kasb_user_tier'), tier);
                return tier;
            }
        } catch (err) {
            console.error('Failed to refresh tier from Supabase:', err);
        }

        return this.getTier();
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
        const allTiers = [...STARTUP_TIERS, ...INVESTOR_TIERS];
        const tier = allTiers.find(t => t.id === this.getTier());
        return tier?.features.some(f => f.toLowerCase().includes(feature.toLowerCase())) || false;
    }

    getUsage() {
        if (!this.userId) return { profileViews: 0, contacts: 0, compares: 0, viewedIds: [], contactedIds: [], comparedPairs: [] };
        const saved = localStorage.getItem(this.getStorageKey('kasb_usage'));
        const defaultUsage = { profileViews: 0, contacts: 0, compares: 0, viewedIds: [], contactedIds: [], comparedPairs: [] };
        if (!saved) return defaultUsage;
        try {
            const usage = JSON.parse(saved);
            return { ...defaultUsage, ...usage };
        } catch {
            return defaultUsage;
        }
    }

    resetUsage() {
        if (!this.userId) return;
        localStorage.setItem(this.getStorageKey('kasb_usage'), JSON.stringify({
            profileViews: 0,
            contacts: 0,
            compares: 0,
            viewedIds: [],
            contactedIds: [],
            comparedPairs: []
        }));
    }

    trackView(entityId: string) {
        if (!entityId || !this.userId) return;
        const usage = this.getUsage();
        const viewedIds = new Set(usage.viewedIds || []);

        if (!viewedIds.has(entityId)) {
            viewedIds.add(entityId);
            usage.profileViews = viewedIds.size;
            usage.viewedIds = Array.from(viewedIds);
            localStorage.setItem(this.getStorageKey('kasb_usage'), JSON.stringify(usage));
        }
    }

    trackContact(entityId: string) {
        if (!entityId || !this.userId) return;
        const usage = this.getUsage();
        const contactedIds = new Set(usage.contactedIds || []);

        if (!contactedIds.has(entityId)) {
            contactedIds.add(entityId);
            usage.contacts = contactedIds.size;
            usage.contactedIds = Array.from(contactedIds);
            localStorage.setItem(this.getStorageKey('kasb_usage'), JSON.stringify(usage));
        }
    }

    trackCompare(id1: string, id2: string) {
        if (!id1 || !id2 || !this.userId) return;
        const usage = this.getUsage();
        const comparedPairs = usage.comparedPairs || [];

        // Sort IDs to ensure order doesn't matter (A-B is same as B-A)
        const pair = [id1, id2].sort().join(':');

        if (!comparedPairs.includes(pair)) {
            comparedPairs.push(pair);
            usage.compares = comparedPairs.length;
            usage.comparedPairs = comparedPairs;
            localStorage.setItem(this.getStorageKey('kasb_usage'), JSON.stringify(usage));
        }
    }

    canViewProfile(): boolean {
        // Unlimited viewing for everyone
        return true;
    }

    hasPaidPlan(): boolean {
        if (!this.userId) return false;
        const tier = this.getTier();
        if (!tier) return false;

        // Free tiers are 'discovery' and 'explore'
        const freeTiers = ['discovery', 'explore'];
        return !freeTiers.includes(tier);
    }

    hasGeoFilters(): boolean {
        const tier = this.getTier();
        const allowedTiers = ['starter', 'growth', 'fundraise_pro', 'investor_basic', 'investor_pro', 'institutional'];
        return allowedTiers.includes(tier) || tier === 'admin' as any;
    }

    canViewRecommendations(): boolean {
        const tier = this.getTier();
        const allowedTiers = ['starter', 'growth', 'fundraise_pro', 'investor_basic', 'investor_pro', 'institutional'];
        return allowedTiers.includes(tier) || tier === 'admin' as any;
    }

    canExportData(): boolean {
        const tier = this.getTier();
        const allowedTiers = ['growth', 'fundraise_pro', 'investor_pro', 'institutional'];
        return allowedTiers.includes(tier) || tier === 'admin' as any;
    }

    isPro(): boolean {
        const tier = this.getTier();
        const proTiers = ['growth', 'fundraise_pro', 'investor_pro', 'institutional'];
        return proTiers.includes(tier) || tier === 'admin' as any;
    }

    canContact(entityId?: string): boolean {
        const tier = this.getTier();

        // Strict gating for free tiers
        if (tier === 'discovery' || tier === 'explore') {
            return false;
        }

        const limits = TIER_LIMITS[tier] || { contacts: 0 };
        const usage = this.getUsage();

        // If we've already contacted this specific entity, we can always contact it again
        if (entityId && (usage.contactedIds || []).includes(entityId)) {
            return true;
        }

        return usage.contacts < limits.contacts;
    }

    canCompare(id1?: string, id2?: string): boolean {
        const tier = this.getTier();
        const limits = TIER_LIMITS[tier] || { compares: 0 };
        const usage = this.getUsage();

        if (id1 && id2) {
            const pair = [id1, id2].sort().join(':');
            if ((usage.comparedPairs || []).includes(pair)) {
                return true;
            }
        }

        return usage.compares < limits.compares;
    }

    canViewFounderDetails(): boolean {
        return this.isPro();
    }

    canViewAISummary(): boolean {
        return this.isPro();
    }

    canViewDetailedAnalytics(): boolean {
        return this.isPro();
    }

    canUseAIChat(): boolean {
        return this.hasPaidPlan();
    }

    canRefineMessages(): boolean {
        return this.hasPaidPlan();
    }
}

export const subscriptionManager = new SubscriptionManager();
