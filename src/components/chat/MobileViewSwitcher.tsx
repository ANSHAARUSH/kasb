import React from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';

interface MobileViewSwitcherProps {
    currentView: 'foundergpt' | 'studio';
}

export const MobileViewSwitcher: React.FC<MobileViewSwitcherProps> = ({ currentView }) => {
    const navigate = useNavigate();
    
    return (
        <div className="md:hidden px-2 mb-6">
            <div className={cn(
                "flex p-1 rounded-2xl border transition-colors shadow-inner",
                currentView === 'studio' 
                    ? "bg-gray-900 border-gray-800" 
                    : "bg-[#111] border-white/10"
            )}>
                <button 
                    onClick={() => navigate('/dashboard/startup/foundergpt')}
                    className={cn(
                        "flex-1 py-2 px-3 rounded-[14px] text-[10px] font-extrabold uppercase tracking-widest transition-all",
                        currentView === 'foundergpt'
                            ? "bg-white text-black shadow-sm"
                            : "text-gray-500 hover:text-white"
                    )}
                >
                    Founder GPT
                </button>
                <button 
                    onClick={() => navigate('/dashboard/startup/studio')}
                    className={cn(
                        "flex-1 py-2 px-3 rounded-[14px] text-[10px] font-extrabold uppercase tracking-widest transition-all",
                        currentView === 'studio'
                            ? "bg-white/10 text-white shadow-sm"
                            : currentView === 'foundergpt'
                                ? "text-gray-500 hover:text-white"
                                : "text-gray-500 hover:text-gray-300"
                    )}
                >
                    Kasb Studio
                </button>
            </div>
        </div>
    );
};
