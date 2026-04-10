import React from 'react';
import { cn } from '../../lib/utils';
import { Sparkles, Fish } from 'lucide-react';

interface ModeSwitcherProps {
    activeMode: 'foundergpt' | 'piranhatank';
    onModeChange: (mode: 'foundergpt' | 'piranhatank') => void;
}

export const ModeSwitcher: React.FC<ModeSwitcherProps> = ({ activeMode, onModeChange }) => {
    return (
        <div className="px-2 mb-8">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-4 px-2 flex items-center justify-between">
                <span>Select Experience</span>
                {activeMode === 'piranhatank' ? (
                    <span className="text-red-500 animate-pulse flex items-center gap-1">
                        <div className="h-1 w-1 rounded-full bg-red-500" />
                        Live
                    </span>
                ) : (
                    <span className="text-green-500 flex items-center gap-1">
                        <div className="h-1 w-1 rounded-full bg-green-500" />
                        AI Mode
                    </span>
                )}
            </h3>
            <div className={cn(
                "flex flex-col p-2 rounded-[24px] border transition-all duration-700 shadow-2xl overflow-hidden",
                activeMode === 'piranhatank' 
                    ? "bg-[#0c0c0c] border-red-900/40 shadow-[0_0_40px_rgba(255,0,0,0.05)]" 
                    : "bg-[#0d0d0d] border-white/10 shadow-[0_0_40px_rgba(255,255,255,0.02)]"
            )}>
                <button 
                    onClick={() => onModeChange('foundergpt')}
                    className={cn(
                        "flex items-center gap-4 py-4 px-5 rounded-[18px] text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-500 relative group",
                        activeMode === 'foundergpt'
                            ? "bg-white text-black shadow-[0_10px_30px_rgba(255,255,255,0.15)] scale-[1.02] z-10"
                            : "text-gray-500 hover:text-white"
                    )}
                >
                    <div className={cn(
                        "h-8 w-8 rounded-xl flex items-center justify-center transition-all",
                        activeMode === 'foundergpt' ? "bg-indigo-600 text-white" : "bg-white/5 text-gray-600 group-hover:bg-white/10"
                    )}>
                        <Sparkles className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col items-start gap-0.5">
                        <span className="leading-none">Founder GPT</span>
                        <span className={cn("text-[8px] font-bold lowercase opacity-60", activeMode === 'foundergpt' ? "text-indigo-900" : "text-gray-600")}>AI Mentor Sessions</span>
                    </div>
                    {activeMode === 'foundergpt' && (
                        <div className="absolute inset-0 bg-white/5 blur-2xl rounded-full opacity-50" />
                    )}
                </button>

                <div className="h-2 w-full flex items-center justify-center">
                    <div className={cn("w-12 h-[1px]", activeMode === 'piranhatank' ? "bg-red-900/30" : "bg-white/10")} />
                </div>

                <button 
                    onClick={() => onModeChange('piranhatank')}
                    className={cn(
                        "flex items-center gap-4 py-4 px-5 rounded-[18px] text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-500 relative group overflow-hidden",
                        activeMode === 'piranhatank'
                            ? "bg-[#DC143C] text-white shadow-[0_15px_40px_rgba(220,20,60,0.3)] scale-[1.02] z-10"
                            : "text-gray-500 hover:text-red-500"
                    )}
                >
                    <div className={cn(
                        "h-8 w-8 rounded-xl flex items-center justify-center transition-all",
                        activeMode === 'piranhatank' ? "bg-white/20 text-white" : "bg-red-500/5 text-gray-600 group-hover:bg-red-500/10"
                    )}>
                        <Fish className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col items-start gap-0.5">
                        <span className="leading-none">Piranha Tank</span>
                        <span className={cn("text-[8px] font-bold lowercase opacity-60", activeMode === 'piranhatank' ? "text-red-100" : "text-gray-600")}>Reality Pitching</span>
                    </div>
                    {activeMode === 'piranhatank' && (
                        <div className="absolute inset-0 bg-red-400/10 blur-2xl rounded-full opacity-50" />
                    )}
                </button>
            </div>
        </div>
    );
};
