import { useState, useEffect } from "react"
import { InvestorCard } from "../../components/dashboard/InvestorCard"
import { InvestorDetail } from "../../components/dashboard/InvestorDetail"
import { cn } from "../../lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "../../context/AuthContext"
import { supabase, getClosedDeals, getUserSetting, getGlobalConfig } from "../../lib/supabase"
import { useToast } from "../../hooks/useToast"
import type { Investor } from "../../data/mockData"
import type { InvestorDB } from "../../types"
import { compareInvestors, type ComparisonResult } from "../../lib/ai"
import { InvestorComparisonView } from "../../components/dashboard/InvestorComparisonView"
import { Button } from "../../components/ui/button"
import { Sparkles } from "lucide-react"
import { subscriptionManager } from "../../lib/subscriptionManager"
import { ensureArray } from "../../lib/utils"
import { SearchInput } from "../../components/dashboard/SearchInput"
import { useDebounce } from "../../hooks/useDebounce"


export default function StartupHistoryPage() {
   const { user } = useAuth()
   const { toast } = useToast()
   const [activeTab, setActiveTab] = useState<'history' | 'future'>('future')
   const [savedInvestors, setSavedInvestors] = useState<Investor[]>([])
   const [historyInvestors, setHistoryInvestors] = useState<Investor[]>([])
   const [loading, setLoading] = useState(false)

   // Comparison State
   const [selectedIds, setSelectedIds] = useState<string[]>([])
   const [isComparing, setIsComparing] = useState(false)
   const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null)
   const [detailInvestor, setDetailInvestor] = useState<Investor | null>(null)
   const [searchQuery, setSearchQuery] = useState("")
   const debouncedSearchQuery = useDebounce(searchQuery, 300)

   useEffect(() => {
      if (!user || activeTab !== 'future') return

      const fetchSavedInvestors = async () => {
         setLoading(true)
         const { data, error } = await supabase
            .from('saved_investors')
            .select(`
                    investor:investors (*)
                `)
            .eq('startup_id', user.id)

         if (data) {
            const mapped = (data as unknown as { investor: InvestorDB }[]).map(item => {
               const i = item.investor
               return {
                  id: i.id,
                  name: i.name,
                  avatar: i.avatar || '',
                  bio: i.bio || 'Active Investor',
                  fundsAvailable: i.funds_available || '$0',
                  investments: i.investments_count || 0,
                  expertise: i.expertise || [],
                  last_active_at: i.last_active_at,
                  investor_type: (i as any).investor_type,
                  grant_scheme: (i as any).grant_scheme,
                  grant_advantages: ensureArray((i as any).grant_advantages),
                  grant_eligibility: ensureArray((i as any).grant_eligibility),
                  check_size_range: (i as any).check_size_range,
                  target_stages: ensureArray((i as any).target_stages),
                  sector_focus: ensureArray((i as any).sector_focus),
                  geography_focus: ensureArray((i as any).geography_focus),
                  portfolio_highlights: ensureArray((i as any).portfolio_highlights)
               } as Investor
            })
            setSavedInvestors(mapped)
         }
         if (error) console.error("Error fetching saved investors:", error)
         setLoading(false)
      }

      fetchSavedInvestors()
   }, [user, activeTab])

   useEffect(() => {
      if (!user || activeTab !== 'history') return

      const fetchClosedDeals = async () => {
         setLoading(true)
         try {
            const closedDealIds = await getClosedDeals(user.id)

            if (closedDealIds.length === 0) {
               setHistoryInvestors([])
               setLoading(false)
               return
            }

            // Fetch investor data for closed deals
            const { data, error } = await supabase
               .from('investors')
               .select('*')
               .in('id', closedDealIds)

            if (data) {
               const mapped = data.map((i: InvestorDB) => ({
                  id: i.id,
                  name: i.name,
                  avatar: i.avatar || '',
                  bio: i.bio || 'Active Investor',
                  fundsAvailable: i.funds_available || '$0',
                  investments: i.investments_count || 0,
                  expertise: i.expertise || [],
                  last_active_at: i.last_active_at,
                  investor_type: (i as any).investor_type,
                  grant_scheme: (i as any).grant_scheme,
                  grant_advantages: ensureArray((i as any).grant_advantages),
                  grant_eligibility: ensureArray((i as any).grant_eligibility),
                  check_size_range: (i as any).check_size_range,
                  target_stages: ensureArray((i as any).target_stages),
                  sector_focus: ensureArray((i as any).sector_focus),
                  geography_focus: ensureArray((i as any).geography_focus),
                  portfolio_highlights: ensureArray((i as any).portfolio_highlights)
               } as Investor))
               setHistoryInvestors(mapped)
            }
            if (error) console.error("Error fetching closed deals:", error)
         } catch (err) {
            console.error("Error:", err)
         }
         setLoading(false)
      }

      fetchClosedDeals()
   }, [user, activeTab])

   const handleRemove = async (investor: Investor) => {
      if (!user) return

      try {
         const { error } = await supabase
            .from('saved_investors')
            .delete()
            .eq('startup_id', user.id)
            .eq('investor_id', investor.id)

         if (error) throw error

         setSavedInvestors(prev => prev.filter(i => i.id !== investor.id))
         setSelectedIds(prev => prev.filter(id => id !== investor.id)) // Clear selection if removed
         toast("Removed from Future Plans", "info")
      } catch (err: unknown) {
         console.error("Error removing:", err)
         const message = err instanceof Error ? err.message : "Failed to remove. Please try again.";
         toast(message, "error")
      }
   }

   const handleSelect = (id: string) => {
      if (selectedIds.includes(id)) {
         setSelectedIds(selectedIds.filter(s => s !== id))
      } else {
         if (selectedIds.length < 2) {
            setSelectedIds([...selectedIds, id])
         } else {
            setSelectedIds([selectedIds[1], id])
         }
      }
   }

   const handleCompare = async () => {
      if (selectedIds.length !== 2) {
         if (selectedIds.length === 0) toast("Please select 2 investors to compare first.", "info")
         return
      }

      // Check limits
      if (!subscriptionManager.canCompare(selectedIds[0], selectedIds[1])) {
         toast("You have reached your AI comparison limit for this month. Please upgrade your plan for more comparisons.", "error")
         return
      }

      const val1 = displayedInvestors.find(i => i.id === selectedIds[0])
      const val2 = displayedInvestors.find(i => i.id === selectedIds[1])

      if (!val1 || !val2) {
         toast("Error: Could not find investor data.", "error")
         return
      }

      setIsComparing(true)

      try {
         // Priority: Groq -> Env -> DB Global -> DB User
         const envKey = import.meta.env.VITE_GROQ_API_KEY || import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_OPENAI_API_KEY;
         let apiKey = (envKey && !envKey.includes('your_') && !envKey.includes('here')) ? envKey : '';

         if (!apiKey) {
            const globalKey = await getGlobalConfig('ai_api_key')
            if (globalKey) apiKey = globalKey
         }

         if (!apiKey && user) {
            const storedKey = await getUserSetting(user.id, 'ai_api_key')
            if (storedKey) apiKey = storedKey
         }

         if (!apiKey) {
            toast("AI features are not setup. Please contact the administrator.", "error")
            return
         }

         const baseUrl = import.meta.env.VITE_OPENAI_BASE_URL
         const result = await compareInvestors(val1, val2, apiKey, baseUrl)

         // Track successful comparison
         subscriptionManager.trackCompare(val1.id, val2.id)

         setComparisonResult(result)

      } catch (error: unknown) {
         console.error("Comparison Error:", error)
         const message = error instanceof Error ? error.message : "Comparison failed";
         toast(`Comparison failed: ${message}`, "error")
      } finally {
         setIsComparing(false)
      }
   }

   const baseInvestors = activeTab === 'history' ? historyInvestors : savedInvestors

   const filteredInvestors = baseInvestors.filter(investor => {
      const query = debouncedSearchQuery.toLowerCase()
      return (
         investor.name.toLowerCase().includes(query) ||
         investor.bio?.toLowerCase().includes(query) ||
         investor.expertise?.some(e => e.toLowerCase().includes(query))
      )
   })

   const displayedInvestors = filteredInvestors

   return (
      <div className="flex flex-col gap-6 relative min-h-[50vh] px-6 pt-6 md:px-0 md:pt-0">
         {/* Toggle Switch */}
         <div className="mx-auto flex w-full max-w-xs items-center justify-center rounded-full bg-gray-100 p-1">
            {(['history', 'future'] as const).map(tab => (
               <button
                  key={tab}
                  onClick={() => {
                     setActiveTab(tab)
                     setSelectedIds([]) // Clear selection on tab switch
                  }}
                  className={cn(
                     "relative flex-1 rounded-full px-4 py-2 text-sm font-medium transition-colors z-10",
                     activeTab === tab ? "text-black" : "text-gray-500 hover:text-gray-900"
                  )}
               >
                  {activeTab === tab && (
                     <motion.div
                        layoutId="activeTabStartup"
                        className="absolute inset-0 rounded-full bg-white shadow-sm -z-10"
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                     />
                  )}
                  {tab === 'history' ? 'History' : 'Future Plans'}
               </button>
            ))}
         </div>

         {/* Hint for comparison */}
         {activeTab === 'future' && savedInvestors.length >= 2 && selectedIds.length < 2 && (
            <div className="text-center text-sm text-gray-500 animate-in fade-in slide-in-from-top-1">
               Select 2 investors to compare with AI
            </div>
         )}

         <AnimatePresence mode="wait">
            <motion.div
               key={activeTab}
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -20 }}
               transition={{ duration: 0.2 }}
               className="flex flex-col gap-4 pb-24 max-w-2xl mx-auto px-4 w-full"
            >
               {loading && <div className="text-center text-gray-400">Loading...</div>}

               {!loading && displayedInvestors.map(investor => (
                  <div
                     key={investor.id}
                     className="transform transition-all duration-200 hover:scale-[1.01]"
                  >
                     <InvestorCard
                        investor={investor}
                        isSelected={selectedIds.includes(investor.id)}
                        isSaved={true}
                        onClick={() => handleSelect(investor.id)}
                        onDoubleClick={() => setDetailInvestor(investor)}
                        onToggleSave={handleRemove}
                     />
                  </div>
               ))}

               {!loading && displayedInvestors.length === 0 && (
                  <div className="py-12 text-center text-gray-500">
                     {activeTab === 'history'
                        ? "No viewing history yet."
                        : "No future plans added yet. Go to Home to add investors!"
                     }
                  </div>
               )}
            </motion.div>
         </AnimatePresence>

         {/* Compare Button */}
         <AnimatePresence>
            {selectedIds.length === 2 && (
               <motion.div
                  initial={{ y: 100, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 100, opacity: 0 }}
                  className="fixed bottom-44 left-1/2 -translate-x-1/2 z-50"
               >
                  <Button
                     size="lg"
                     className="rounded-full shadow-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white px-8 py-6 text-lg font-bold"
                     onClick={handleCompare}
                     disabled={isComparing}
                  >
                     {isComparing ? (
                        <span className="flex items-center gap-2">
                           <Sparkles className="animate-spin h-5 w-5" /> Analyzing...
                        </span>
                     ) : (
                        <span className="flex items-center gap-2">
                           <Sparkles className="h-5 w-5" /> Compare with AI
                        </span>
                     )}
                  </Button>
               </motion.div>
            )}
         </AnimatePresence>

         {/* Comparison View Modal */}
         <AnimatePresence>
            {comparisonResult && (
               <InvestorComparisonView
                  investor1={savedInvestors.find(i => i.id === selectedIds[0]) || historyInvestors.find(i => i.id === selectedIds[0])!}
                  investor2={savedInvestors.find(i => i.id === selectedIds[1]) || historyInvestors.find(i => i.id === selectedIds[1])!}
                  result={comparisonResult}
                  onClose={() => setComparisonResult(null)}
               />
            )}
         </AnimatePresence>

         {/* Investor Detail Modal */}
         <AnimatePresence>
            {detailInvestor && (
               <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center p-4">
                  <motion.div
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     exit={{ opacity: 0 }}
                     className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                     onClick={() => setDetailInvestor(null)}
                  />
                  <motion.div
                     initial={{ y: "100%", opacity: 0 }}
                     animate={{ y: 0, opacity: 1 }}
                     exit={{ y: "100%", opacity: 0 }}
                     className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl h-[85vh] overflow-hidden flex flex-col shadow-2xl"
                  >
                     <div className="flex-1 overflow-hidden">
                        <InvestorDetail
                           investor={detailInvestor}
                           onClose={() => setDetailInvestor(null)}
                        />
                     </div>
                  </motion.div>
               </div>
            )}
         </AnimatePresence>
         {/* Fixed Bottom Search Bar */}
         <div className="fixed bottom-24 left-0 right-0 z-40 px-4 md:left-64 transition-all duration-300 pointer-events-none">
            <div className="max-w-2xl mx-auto pointer-events-auto">
               <SearchInput
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder={`Search ${activeTab === 'history' ? 'history' : 'future plans'}...`}
                  className="w-full !relative !bottom-0 !px-0 !pb-0"
               />
            </div>
         </div>
      </div>
   )
}

