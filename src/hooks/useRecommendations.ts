import { useState, useEffect, useCallback } from 'react';
import { generateInvestorRecommendations, generateStartupRecommendations, type RecommendationResult, clearRecommendationCache, getFriendlyErrorMessage } from '../lib/recommendations';
import type { Startup, Investor } from '../data/mockData';
import { getGlobalConfig, getUserSetting, getRecentViews } from '../lib/supabase';
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
            // Get API key - Prioritize Gemini, but ignore placeholders
            const envKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GROQ_API_KEY || import.meta.env.VITE_OPENAI_API_KEY;
            let apiKey = (envKey && !envKey.includes('your_') && !envKey.includes('here')) ? envKey : '';

            if (!apiKey) apiKey = await getGlobalConfig('ai_api_key') || '';
            if (!apiKey && user) apiKey = await getUserSetting(user.id, 'ai_api_key') || '';

            if (!apiKey) {
                throw new Error('AI API key not configured. Please set it in your environment or settings.');
            }

            let result: RecommendationResult;

            if (type === 'investor') {
                // Fetch recent views to provide behavioral context
                const recentViewIds = await getRecentViews(currentProfile.id, 5);
                const recentViews = (availableEntities as Startup[]).filter(s => recentViewIds.includes(s.id));

                // Current user is an investor, recommend startups
                result = await generateStartupRecommendations(
                    currentProfile as Investor,
                    availableEntities as Startup[],
                    apiKey,
                    recentViews as Startup[]
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
