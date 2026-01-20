import { useState, useEffect } from "react"
import { InvestorCard } from "../../components/dashboard/InvestorCard"
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


export function StartupHistoryPage() {
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
                  last_active_at: i.last_active_at
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
                  last_active_at: i.last_active_at
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

      const val1 = displayedInvestors.find(i => i.id === selectedIds[0])
      const val2 = displayedInvestors.find(i => i.id === selectedIds[1])

      if (!val1 || !val2) {
         toast("Error: Could not find investor data.", "error")
         return
      }

      setIsComparing(true)

      try {
         let apiKey = import.meta.env.VITE_GROQ_API_KEY || import.meta.env.VITE_OPENAI_API_KEY

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
         setComparisonResult(result)

      } catch (error: unknown) {
         console.error("Comparison Error:", error)
         const message = error instanceof Error ? error.message : "Comparison failed";
         toast(`Comparison failed: ${message}`, "error")
      } finally {
         setIsComparing(false)
      }
   }

   const displayedInvestors = activeTab === 'history' ? historyInvestors : savedInvestors

   return (
      <div className="flex flex-col gap-6 relative min-h-[50vh]">
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
               className="grid gap-4 md:grid-cols-2 pb-24"
            >
               {loading && <div className="col-span-full text-center text-gray-400">Loading...</div>}

               {!loading && displayedInvestors.map(investor => (
                  <InvestorCard
                     key={investor.id}
                     investor={investor}
                     isSelected={selectedIds.includes(investor.id)}
                     isSaved={true}
                     onClick={() => handleSelect(investor.id)}
                     onToggleSave={handleRemove}
                  />
               ))}

               {!loading && displayedInvestors.length === 0 && (
                  <div className="col-span-full py-12 text-center text-gray-500">
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
                  className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40"
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
      </div>
   )
}

