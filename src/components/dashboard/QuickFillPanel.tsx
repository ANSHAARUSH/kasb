import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Copy, 
  Check, 
  Sparkles, 
  User, 
  Building2, 
  TrendingUp, 
  Info
} from 'lucide-react';
import { useStartupProfile } from '../../hooks/useStartupProfile';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';

interface QuickFillPanelProps {
  isOpen: boolean;
  onClose: () => void;
  isRedirecting?: boolean;
  redirectTarget?: string;
}

export function QuickFillPanel({ isOpen, onClose, isRedirecting, redirectTarget }: QuickFillPanelProps) {
  const { startup, loading } = useStartupProfile();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (field: string, value: string) => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const sections = [
    {
      title: 'Company Identity',
      icon: <Building2 className="h-4 w-4" />,
      fields: [
        { label: 'Startup Name', value: startup?.name, key: 'name' },
        { label: 'Industry', value: startup?.industry, key: 'industry' },
        { label: 'Category Keywords', value: startup?.tags?.join(', '), key: 'tags' },
      ]
    },
    {
      title: 'The Pitch',
      icon: <Sparkles className="h-4 w-4 text-purple-500" />,
      fields: [
        { label: 'Problem Statement', value: startup?.problem_solving, key: 'problem' },
        { label: 'Traction Summary', value: startup?.traction, key: 'traction' },
        { label: 'AI Summary', value: startup?.ai_summary, key: 'ai_summary' },
      ]
    },
    {
      title: 'Financials & Stage',
      icon: <TrendingUp className="h-4 w-4 text-emerald-500" />,
      fields: [
        { label: 'Current Stage', value: startup?.stage, key: 'stage' },
        { label: 'Valuation', value: startup?.valuation, key: 'valuation' },
      ]
    },
    {
      title: 'Founder Details',
      icon: <User className="h-4 w-4 text-blue-500" />,
      fields: [
        { label: 'Founder Name', value: startup?.founder_name, key: 'founder_name' },
        { label: 'Founder Bio', value: startup?.founder_bio, key: 'founder_bio' },
      ]
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[9998]"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-[9999] flex flex-col border-l border-gray-100"
          >
            {/* Redirecting Progress Bar */}
            {isRedirecting && (
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gray-100 z-[100] overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 2, ease: "linear" }}
                  className="h-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 shadow-[0_0_15px_rgba(79,70,229,0.5)] relative"
                >
                  {/* Shimmer effect */}
                  <motion.div 
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-full h-full"
                  />
                </motion.div>
              </div>
            )}

            {/* Header */}
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-black flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                  <h2 className="text-xl font-black tracking-tight uppercase">Kasb Quick-Fill</h2>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Info className="h-3 w-3" />
                {isRedirecting 
                  ? `Opening ${redirectTarget}'s website...` 
                  : "Your data is ready to be pasted on external forms"}
              </p>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
              {loading ? (
                <div className="space-y-6">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-32 w-full skeleton rounded-2xl" />
                  ))}
                </div>
              ) : (
                sections.map((section, idx) => (
                  <div key={idx} className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-50">
                      {section.icon}
                      <h3 className="text-xs font-black uppercase tracking-widest text-gray-900">{section.title}</h3>
                    </div>
                    <div className="space-y-3">
                      {section.fields.map((field) => (
                        <div key={field.key} className="group relative">
                          <label className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter mb-1 block ml-1">
                            {field.label}
                          </label>
                          <div 
                            className={cn(
                              "flex items-center justify-between gap-3 p-3 rounded-2xl border-2 transition-all duration-300",
                              field.value 
                                ? "bg-gray-50 border-gray-100 hover:border-black/10 hover:bg-white" 
                                : "bg-red-50/30 border-red-100 italic"
                            )}
                          >
                            <span className="text-sm font-medium text-gray-700 truncate flex-1">
                              {field.value || 'Not provided'}
                            </span>
                            {field.value && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleCopy(field.key, field.value!)}
                                className={cn(
                                  "h-8 w-8 p-0 rounded-xl transition-all",
                                  copiedField === field.key 
                                    ? "bg-emerald-500 text-white hover:bg-emerald-600" 
                                    : "bg-white border border-gray-200 text-gray-500 hover:text-black hover:border-black shadow-sm"
                                )}
                              >
                                {copiedField === field.key ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100 bg-gray-50/30">
              <Button 
                onClick={onClose}
                className="w-full bg-black text-white hover:bg-gray-800 rounded-2xl h-12 font-black uppercase tracking-widest text-xs"
              >
                Done Copying
              </Button>
              <p className="text-[9px] font-bold text-gray-400 text-center mt-4 uppercase tracking-tighter">
                Open the external form in your new tab and click the copy icons above.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
