import { useState, useEffect } from "react"
import { InvestorCard } from "../../components/dashboard/InvestorCard"
import { cn } from "../../lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "../../context/AuthContext"
import { supabase } from "../../lib/supabase"
import { useToast } from "../../hooks/useToast"
import type { Investor } from "../../data/mockData"
import type { InvestorDB } from "../../types"


export function StartupHistoryPage() {
   const { user } = useAuth()
   const { toast } = useToast()
   const [activeTab, setActiveTab] = useState<'history' | 'future'>('future')
   const [savedInvestors, setSavedInvestors] = useState<Investor[]>([])
   const [loading, setLoading] = useState(false)

   // History is empty for now as it would require a `view_history` table similar to `saved_investors`
   // but optimized for high write volume.
   const historyInvestors: Investor[] = []

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
                  avatar: i.avatar || 'https://i.pravatar.cc/150',
                  bio: i.bio || 'Active Investor',
                  fundsAvailable: i.funds_available || '$0',
                  investments: i.investments_count || 0,
                  expertise: i.expertise || []
               } as Investor
            })
            setSavedInvestors(mapped)
         }
         if (error) console.error("Error fetching saved investors:", error)
         setLoading(false)
      }

      fetchSavedInvestors()
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
         toast("Removed from Future Plans", "info")
      } catch (err: unknown) {
         console.error("Error removing:", err)
         const message = err instanceof Error ? err.message : "Failed to remove. Please try again.";
         toast(message, "error")
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
                     isSaved={true}
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
      </div>
   )
}

