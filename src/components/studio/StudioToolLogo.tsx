import React, { useState, useEffect } from 'react';
import { Wrench } from 'lucide-react';

export const TOOL_DOMAINS: Record<string, string> = {
    "lovable": "lovable.dev",
    "base44": "base44.com",
    "replit": "replit.com",
    "bolt": "bolt.new",
    "cursor": "cursor.com",
    "claude": "claude.ai",
    "antigravity": "deepmind.google",
    "manus": "manus.im",
    "gemini": "gemini.google.com",
    "gamma": "gamma.app",
    "canva": "canva.com",
    "anthropic": "anthropic.com",
    "copy.ai": "copy.ai",
    "jasper": "jasper.ai",
    "google": "google.com",
    "chatgpt": "openai.com",
    "vercel": "vercel.com",
    "v0": "v0.dev",
    "figma": "figma.com",
    "perplexity": "perplexity.ai",
    "synthesia": "synthesia.io",
    "runway": "runwayml.com",
    "sora": "openai.com",
    "midjourney": "midjourney.com",
    "notion": "notion.so",
    "apollo.io": "apollo.io",
    "hubspot": "hubspot.com",
    "zapier": "zapier.com"
};

interface ToolLogoProps {
    toolName: string;
}

export const StudioToolLogo: React.FC<ToolLogoProps> = ({ toolName }) => {
    const [failed, setFailed] = useState(false);
    useEffect(() => { setFailed(false); }, [toolName]);

    const raw = toolName.toLowerCase();
    let domain = null;
    let fallbackAlt = "Tool";

    for (const [key, d] of Object.entries(TOOL_DOMAINS)) {
        if (raw.includes(key)) {
            domain = d;
            fallbackAlt = key;
            break;
        }
    }
    
    if (!domain || failed) {
        return (
            <div className="h-12 w-12 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                <Wrench className="h-6 w-6 text-indigo-400" />
            </div>
        );
    }
    
    return (
        <div className="h-12 w-12 rounded-lg bg-white border border-gray-800 flex items-center justify-center shrink-0 overflow-hidden p-1.5 shadow-lg">
            <img 
                src={`https://www.google.com/s2/favicons?domain=${domain}&sz=128`}
                alt={fallbackAlt}
                className="w-full h-full object-contain"
                onError={() => setFailed(true)}
            />
        </div>
    );
};
