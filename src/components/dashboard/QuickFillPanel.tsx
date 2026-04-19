import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Copy, Check, Sparkles, User, Building2, TrendingUp, Info, Briefcase, Zap, Target, Plus, Search, Loader2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useDebounce } from '../../hooks/useDebounce';
import { proxySemanticMatch } from '../../lib/aiProxy';
import { useStartupProfile } from '../../hooks/useStartupProfile';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';

interface QuickFillPanelProps {
  isOpen: boolean;
  onClose: () => void;
  isRedirecting?: boolean;
  redirectTarget?: string;
}

const EditableField = ({ 
  label, 
  initialValue, 
  onSave, 
  onCopy,
  copiedField,
  fieldKey,
  isHighlighted
}: { 
  label: string; 
  initialValue: string; 
  onSave: (val: string) => Promise<void>;
  onCopy: () => void;
  copiedField: string | null;
  fieldKey: string;
  isHighlighted?: boolean;
}) => {
  const [value, setValue] = useState(initialValue || '');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleBlur = async () => {
    if (value && value !== initialValue) {
      setSaving(true);
      await onSave(value);
      setSaving(false);
      setIsEditing(false);
    } else {
      setIsEditing(false);
      setValue(initialValue || '');
    }
  };

  return (
    <div id={`field-${fieldKey}`} className={cn("group relative transition-all duration-500 rounded-2xl", isHighlighted ? "ring-2 ring-indigo-500 ring-offset-2 bg-indigo-50/50" : "")}>
      <label className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter mb-1 block ml-1">
        {label}
      </label>
      
      {isEditing || (!initialValue && !isEditing && document.activeElement === document.getElementById(`input-${fieldKey}`)) ? (
        <div className="relative">
          <textarea
            id={`input-${fieldKey}`}
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={handleBlur}
            placeholder="Type your answer here..."
            className="w-full text-sm font-medium text-gray-700 bg-white border-2 border-indigo-100 rounded-2xl p-3 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100/50 transition-all resize-none min-h-[80px]"
          />
          {saving && <span className="absolute bottom-3 right-3 text-[10px] text-indigo-400 font-bold">Saving...</span>}
        </div>
      ) : (
        <div 
          onClick={() => setIsEditing(true)}
          className={cn(
            "flex items-center justify-between gap-3 p-3 rounded-2xl border-2 transition-all duration-300 cursor-text",
            initialValue 
              ? "bg-gray-50 border-gray-100 hover:border-black/10 hover:bg-white" 
              : "bg-red-50/10 border-red-100 border-dashed hover:border-red-300 hover:bg-red-50"
          )}
        >
          <span className={cn("text-sm font-medium flex-1 line-clamp-3", !initialValue ? "text-red-400 italic" : "text-gray-700")}>
            {initialValue || 'Answer missing. Click to add your answer!'}
          </span>
          {initialValue && (
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => { e.stopPropagation(); onCopy(); }}
              className={cn(
                "h-8 w-8 p-0 rounded-xl transition-all shrink-0",
                copiedField === fieldKey 
                  ? "bg-emerald-500 text-white hover:bg-emerald-600" 
                  : "bg-white border border-gray-200 text-gray-500 hover:text-black hover:border-black shadow-sm"
              )}
            >
              {copiedField === fieldKey ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export function QuickFillPanel({ isOpen, onClose, isRedirecting, redirectTarget }: QuickFillPanelProps) {
  const { user } = useAuth();
  const { startup, loading, updateProfile } = useStartupProfile();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customLabel, setCustomLabel] = useState('');
  const [customValue, setCustomValue] = useState('');
  const [isSavingCustom, setIsSavingCustom] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchMatchKey, setSearchMatchKey] = useState<string | null>(null);
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const handleCopy = (field: string, value: string) => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const saveCustomAnswer = async (key: string, value: string, profileKey?: string) => {
    if (!startup) return;
    
    // If it maps directly to a root profile property, update that property
    if (profileKey) {
        await updateProfile({ [profileKey]: value });
        return;
    }

    // Otherwise, store in the arbitrary questionnaire JSONB
    const q = startup.questionnaire || {};
    const quickFill = (q.quick_fill as Record<string, string>) || {};
    
    const newQuestionnaire = {
        ...q,
        quick_fill: {
            ...quickFill,
            [key]: value
        }
    };
    
    await updateProfile({ questionnaire: newQuestionnaire });
  };

  const getFieldValue = (key: string, profileKey?: string) => {
      if (profileKey && startup) {
          const val = (startup as any)[profileKey];
          if (val) return val as string;
      }
      return (startup?.questionnaire?.quick_fill as any)?.[key] || '';
  };

  const sections = [
    {
      title: 'Company Identity',
      icon: <Building2 className="h-4 w-4 text-gray-700" />,
      fields: [
        { label: 'Startup Name', key: 'name', profileKey: 'name' },
        { label: 'Industry', key: 'industry', profileKey: 'industry' },
        { label: 'Category Keywords', key: 'tags', profileKey: 'tags' },
      ]
    },
    {
      title: 'VC Revenue & Financials',
      icon: <TrendingUp className="h-4 w-4 text-emerald-500" />,
      fields: [
        { label: 'Revenues last year and forecast this year?', key: 'vc_revenues' },
        { label: 'How do you calculate MRR, churn, and ACV?', key: 'vc_mrr_churn' },
        { label: 'Customer acquisition cost and lifetime value? (CAC/LTV)', key: 'vc_cac_ltv' },
      ]
    },
    {
      title: 'VC Funding & Term Sheets',
      icon: <Briefcase className="h-4 w-4 text-blue-500" />,
      fields: [
        { label: 'Round size, fund allocation, and KPIs?', key: 'vc_round_size' },
        { label: 'Other term sheets & valuation expectation?', key: 'vc_valuation', profileKey: 'valuation' },
      ]
    },
    {
       title: 'Product & Differentiation',
       icon: <Zap className="h-4 w-4 text-yellow-500" />,
       fields: [
           { label: 'What are you working on?', key: 'product_what', profileKey: 'problem_solving' },
           { label: 'Who would use your product?', key: 'product_who' },
           { label: 'How do you know customers need what you’re making?', key: 'product_need' },
           { label: 'What makes your product unique & traction?', key: 'product_unique', profileKey: 'traction' },
           { label: 'Why now for this solution?', key: 'product_whynow' },
           { label: 'How is this 10x better than existing solutions?', key: 'product_10x' },
       ]
    },
    {
       title: 'Market & Growth',
       icon: <Target className="h-4 w-4 text-red-500" />,
       fields: [
           { label: 'How will you make money? (Unit economics/margins)', key: 'market_makemoney' },
           { label: 'How much money could you make per year?', key: 'market_size' },
           { label: 'Why isn’t someone already doing this successfully?', key: 'market_competitors' },
           { label: 'How do you market it?', key: 'market_gtm' },
           { label: 'What is your user growth rate?', key: 'growth_rate' },
           { label: 'What’s the conversion rate?', key: 'growth_conversion' },
           { label: 'How many users are paying?', key: 'growth_paying' },
       ]
    },
    {
      title: 'Team & Founder',
      icon: <User className="h-4 w-4 text-purple-500" />,
      fields: [
        { label: 'Who is “the boss” / Founder?', key: 'founder_name', profileKey: 'founder_name' },
        { label: 'Founder Bio / Background', key: 'founder_bio', profileKey: 'founder_bio' },
        { label: 'Who’s on the team, and what gaps exist?', key: 'team_composition' },
        { label: 'Why are you the right team to execute this?', key: 'team_right' },
        { label: 'How do we know your team will stick together?', key: 'team_loyalty' },
      ]
    }
  ];

  const allStandardKeys = new Set(sections.flatMap(s => s.fields.map(f => f.key)));
  const customFields = Object.keys((startup?.questionnaire?.quick_fill as Record<string, string>) || {})
    .filter(key => !allStandardKeys.has(key))
    .map(key => ({ label: key, key: key }));

  const displaySections = [...sections];
  if (customFields.length > 0) {
      displaySections.push({
        title: 'Your Custom Details',
        icon: <User className="h-4 w-4 text-emerald-500" /> as any,
        fields: customFields
      });
  }

  useEffect(() => {
    if (!debouncedSearchQuery.trim() || debouncedSearchQuery.trim().length < 3) {
      setSearchMatchKey(null);
      setIsSearching(false);
      return;
    }

    let isMounted = true;
    setIsSearching(true);

    const performSearch = async () => {
      try {
        const allQuestions = displaySections.flatMap(s => s.fields.map(f => ({ key: f.key, label: f.label })));
        
        const prompt = `
    You are an intelligent semantic matching assistant.
    A user is searching through a form using their own words.

    USER QUERY: "${debouncedSearchQuery}"

    AVAILABLE FORM QUESTIONS:
    ${allQuestions.map((q, i) => `[${i}] Key: ${q.key} | Label: ${q.label}`).join('\n')}

    TASK:
    Identify which form question optimally matches the user's query contextually.
    If the user's query clearly implies one of the available questions, return its "Key".
    If there is strictly no relevant match, return null.

    OUTPUT FORMAT:
    Return valid JSON ONLY:
    { "matchKey": "the_key_here" } (or set to null)
    `;
        
        const { matchKey } = await proxySemanticMatch(prompt);
        
        if (isMounted) {
            setSearchMatchKey(matchKey || null);
            setIsSearching(false);
            
            if (matchKey) {
                setTimeout(() => {
                    const parent = document.getElementById('quick-fill-scroll-container');
                    if (parent) {
                        parent.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                }, 100);
            }
        }
      } catch (err) {
        console.error("Search err", err);
        if (isMounted) setIsSearching(false);
      }
    };
    performSearch();

    return () => { isMounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchQuery, startup, user]);

  let topMatchField: any = null;
  let topMatchFieldProfileKey: any = null;

  const contentSections = displaySections.map(section => {
    if (searchMatchKey) {
        const matchIdx = section.fields.findIndex(f => f.key === searchMatchKey);
        if (matchIdx > -1) {
            topMatchField = section.fields[matchIdx];
            topMatchFieldProfileKey = (topMatchField as any).profileKey;
            return {
                ...section,
                fields: section.fields.filter(f => f.key !== searchMatchKey)
            };
        }
    }
    return section;
  }).filter(section => section.fields.length > 0);

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
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998]"
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
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-black flex items-center justify-center shrink-0">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                  <h2 className="text-lg font-black tracking-tight uppercase">Kasb Quick-Fill</h2>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors shrink-0"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3 flex gap-3 items-start">
                  <Info className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] font-bold text-indigo-900/70 uppercase tracking-wide leading-relaxed">
                    {isRedirecting && redirectTarget && (
                        <span className="text-emerald-600 block mb-1.5 font-black tracking-widest text-[11px]">Opening {redirectTarget}...</span>
                    )}
                    Here are your details, carefully arranged for copy and paste! <br/><br/>
                    <span className="text-indigo-600 text-[11px]">If some questions are blank or missing, please answer them here once. We will securely save them so you can relieve yourself from the headache of filling these details out again and again!</span>
                  </p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="px-6 pb-4 pt-4 border-b border-gray-100 bg-gray-50/50 sticky top-0 z-20 shadow-sm">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input 
                  type="text"
                  placeholder="Ask Kasb to find a specific question..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-indigo-100 rounded-xl py-2.5 pl-9 pr-10 text-sm font-medium outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100/50 transition-all placeholder:font-normal placeholder:text-gray-400"
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                  </div>
                )}
                {!isSearching && searchQuery && searchMatchKey && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                  </div>
                )}
              </div>
            </div>

            {/* Content */}
            <div id="quick-fill-scroll-container" className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar scroll-smooth relative">
              {loading ? (
                <div className="space-y-6">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-32 w-full bg-gray-100 animate-pulse rounded-2xl" />
                  ))}
                </div>
              ) : (
                <>
                  {searchMatchKey && topMatchField && (() => {
                    let initialValue = getFieldValue(topMatchField.key, topMatchFieldProfileKey);
                    if (Array.isArray(initialValue)) initialValue = initialValue.join(', ');
                    
                    return (
                        <div className="mb-6 bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
                          <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-3 flex items-center gap-2">
                             <Sparkles className="h-3.5 w-3.5" /> AI Top Match
                          </h3>
                          <EditableField
                              key={`top-${topMatchField.key}`}
                              fieldKey={topMatchField.key}
                              label={topMatchField.label}
                              initialValue={initialValue}
                              copiedField={copiedField}
                              onCopy={() => handleCopy(topMatchField.key, initialValue)}
                              onSave={(val) => saveCustomAnswer(topMatchField.key, val, topMatchFieldProfileKey)}
                              isHighlighted={true}
                          />
                        </div>
                    );
                  })()}

                  {contentSections.map((section, idx) => (
                    <div key={idx} className="space-y-5">
                      <div className="flex items-center gap-2 pb-2 border-b border-gray-50">
                        {section.icon}
                        <h3 className="text-xs font-black uppercase tracking-widest text-gray-900">{section.title}</h3>
                      </div>
                      <div className="space-y-3">
                        {section.fields.map((field) => {
                          let initialValue = getFieldValue(field.key, (field as any).profileKey);
                          // Convert arrays to strings if necessary
                          if (Array.isArray(initialValue)) initialValue = initialValue.join(', ');

                          return (
                            <EditableField
                              key={field.key}
                              fieldKey={field.key}
                              label={field.label}
                              initialValue={initialValue}
                              copiedField={copiedField}
                              onCopy={() => handleCopy(field.key, initialValue)}
                              onSave={(val) => saveCustomAnswer(field.key, val, (field as any).profileKey)}
                            />
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  <div className="pt-4 mt-8 border-t border-gray-100">
                    {isAddingCustom ? (
                        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3">
                            <label className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter">Question / Label</label>
                            <input 
                                value={customLabel}
                                onChange={(e) => setCustomLabel(e.target.value)}
                                placeholder="E.g. Link to Demo Video"
                                className="w-full text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl p-2.5 outline-none focus:border-indigo-400"
                            />
                            <label className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter pt-1 block">Your Answer</label>
                            <textarea 
                                value={customValue}
                                onChange={(e) => setCustomValue(e.target.value)}
                                placeholder="Type your answer here..."
                                className="w-full text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl p-2.5 outline-none focus:border-indigo-400 resize-none min-h-[60px]"
                            />
                            <div className="flex gap-2 pt-2">
                                <Button 
                                    size="sm" 
                                    onClick={async () => {
                                        if (!customLabel.trim()) return;
                                        setIsSavingCustom(true);
                                        await saveCustomAnswer(customLabel.trim(), customValue.trim());
                                        setCustomLabel('');
                                        setCustomValue('');
                                        setIsAddingCustom(false);
                                        setIsSavingCustom(false);
                                    }}
                                    disabled={!customLabel.trim() || isSavingCustom}
                                    className="bg-black text-white hover:bg-gray-800 rounded-xl font-bold text-xs flex-1 h-9"
                                >
                                    {isSavingCustom ? 'Saving...' : 'Save Detail'}
                                </Button>
                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => { setIsAddingCustom(false); setCustomLabel(''); setCustomValue(''); }}
                                    className="rounded-xl font-bold text-xs h-9 border-gray-200 bg-white hover:bg-gray-50"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <Button 
                            variant="outline" 
                            onClick={() => setIsAddingCustom(true)}
                            className="w-full rounded-2xl h-12 border-2 border-dashed border-gray-300 text-gray-500 hover:border-black hover:text-black hover:bg-gray-50 transition-all font-bold tracking-wide text-xs"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Custom Detail
                        </Button>
                    )}
                  </div>
                </>
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
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
