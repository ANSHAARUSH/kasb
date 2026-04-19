import { useState, useEffect, useCallback } from 'react';
import { generateInvestorRecommendations, generateStartupRecommendations, type RecommendationResult, clearRecommendationCache, getFriendlyErrorMessage } from '../lib/recommendations';
import type { Startup, Investor } from '../data/mockData';
import { getRecentViews } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { subscriptionManager } from '../lib/subscriptionManager';

interface UseRecommendationsProps {
    type: 'investor' | 'startup';
    currentProfile: Startup | Investor | null;
    availableEntities: (Startup | Investor)[];
}

export function useRecommendations({ type, currentProfile, availableEntities }: UseRecommendationsProps) {
    const { user } = useAuth();
    const [recommendations, setRecommendations] = useState<RecommendationResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchRecommendations = useCallback(async () => {
        if (!currentProfile || availableEntities.length === 0 || !subscriptionManager.canViewRecommendations()) {
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // API key is now server-side — pass empty string, recommendations module will be refactored
            const apiKey = 'proxy'; // Placeholder — will be removed when recommendations module is fully proxied

            let result: RecommendationResult;

            if (type === 'investor') {
                const recentViewIds = await getRecentViews(currentProfile.id, 5);
                const recentViews = (availableEntities as Startup[]).filter(s => recentViewIds.includes(s.id));

                result = await generateStartupRecommendations(
                    currentProfile as Investor,
                    availableEntities as Startup[],
                    apiKey,
                    recentViews as Startup[]
                );
            } else {
                result = await generateInvestorRecommendations(
                    currentProfile as Startup,
                    availableEntities as Investor[],
                    apiKey
                );
            }

            setRecommendations(result);
        } catch (err: any) {
            console.error('Recommendation error:', err);
            setError(getFriendlyErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }, [currentProfile, availableEntities, type, user]);

    const refresh = useCallback(() => {
        if (currentProfile) {
            clearRecommendationCache(currentProfile.id, type);
            fetchRecommendations();
        }
    }, [currentProfile, type, fetchRecommendations]);

    useEffect(() => {
        fetchRecommendations();
    }, [fetchRecommendations]);

    return {
        recommendations,
        loading,
        error,
        refresh
    };
}
