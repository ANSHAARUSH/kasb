import { useState, useEffect, useCallback } from 'react';
import { generateInvestorRecommendations, generateStartupRecommendations, type RecommendationResult, clearRecommendationCache } from '../lib/recommendations';
import type { Startup, Investor } from '../data/mockData';
import { getGlobalConfig, getUserSetting } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

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
        if (!currentProfile || availableEntities.length === 0) {
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Get API key
            let apiKey = import.meta.env.VITE_GROQ_API_KEY || import.meta.env.VITE_OPENAI_API_KEY;
            if (!apiKey) apiKey = await getGlobalConfig('ai_api_key') || '';
            if (!apiKey && user) apiKey = await getUserSetting(user.id, 'ai_api_key') || '';

            if (!apiKey) {
                throw new Error('AI API key not configured. Please set it in your environment or settings.');
            }

            let result: RecommendationResult;

            if (type === 'investor') {
                // Current user is an investor, recommend startups
                result = await generateStartupRecommendations(
                    currentProfile as Investor,
                    availableEntities as Startup[],
                    apiKey
                );
            } else {
                // Current user is a startup, recommend investors
                result = await generateInvestorRecommendations(
                    currentProfile as Startup,
                    availableEntities as Investor[],
                    apiKey
                );
            }

            setRecommendations(result);
        } catch (err: any) {
            console.error('Recommendation error:', err);
            setError(err.message || 'Failed to generate recommendations');
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
