import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Check, Globe, Zap, Sparkles, Building2, UserCircle2 } from "lucide-react"
import { Button } from "../ui/button"
import { subscriptionManager, STARTUP_TIERS, INVESTOR_TIERS, REGION_CONFIG, type UserRegion, type SubscriptionTier } from "../../lib/subscriptionManager"
import { PaymentModal } from "./PaymentModal"

interface PricingViewProps {
    defaultView?: 'investor' | 'startup'
    showNavbar?: boolean
    lockView?: boolean
}

export function PricingView({ defaultView = 'investor', lockView = false }: PricingViewProps) {
    const [view, setView] = useState<'investor' | 'startup'>(defaultView)
    const [region, setRegion] = useState<UserRegion>(subscriptionManager.getRegion())
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
    const [selectedTier, setSelectedTier] = useState<{ id: SubscriptionTier, name: string, price: number } | null>(null)
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)

    useEffect(() => {
        subscriptionManager.setRegion(region)
    }, [region])

    const tiers = view === 'startup' ? STARTUP_TIERS : INVESTOR_TIERS

    const handleUpgradeClick = (tier: any) => {
        if (tier.price === 0) return
        setSelectedTier({
            id: tier.id,
            name: tier.name,
            price: tier.price
        })
        setIsPaymentModalOpen(true)
    }

    return (
        <div className="w-full">
            <main className="container mx-auto px-4 py-8">
                {/* ... (Header and Controls remain same) ... */}
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gray-50 border border-gray-100 mb-6"
                    >
                        <Globe className="h-4 w-4 text-gray-400" />
                        <select
                            value={region}
                            onChange={(e) => setRegion(e.target.value as UserRegion)}
                            className="bg-transparent text-sm font-medium focus:outline-none cursor-pointer"
                        >
                            {Object.keys(REGION_CONFIG).map(r => (
                                <option key={r} value={r}>{r} Region</option>
                            ))}
                        </select>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-5xl font-extrabold tracking-tight text-black mb-6"
                    >
                        Scale Your <span className="text-gray-400">Ambition</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-xl text-gray-500"
                    >
                        Transparent, market-aligned pricing for the next generation of founders and investors.
                    </motion.p>
                </div>

                {!lockView && (
                    <div className="flex flex-col items-center gap-8 mb-16">
                        <div className="flex p-1 bg-gray-100 rounded-2xl w-full max-w-sm">
                            <button
                                onClick={() => setView('investor')}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${view === 'investor' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <UserCircle2 className="h-4 w-4" />
                                For Investors
                            </button>
                            <button
                                onClick={() => setView('startup')}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${view === 'startup' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <Building2 className="h-4 w-4" />
                                For Startups
                            </button>
                        </div>

                        <div className="flex items-center gap-4">
                            <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-black' : 'text-gray-400'}`}>Monthly</span>
                            <button
                                onClick={() => setBillingCycle(prev => prev === 'monthly' ? 'yearly' : 'monthly')}
                                className="w-14 h-7 bg-gray-200 rounded-full relative p-1 transition-colors hover:bg-gray-300"
                            >
                                <motion.div
                                    animate={{ x: billingCycle === 'monthly' ? 0 : 28 }}
                                    className="w-5 h-5 bg-white rounded-full shadow-sm"
                                />
                            </button>
                            <span className={`text-sm font-medium ${billingCycle === 'yearly' ? 'text-black' : 'text-gray-400'}`}>
                                Yearly <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded-full text-xs">Save 20%</span>
                            </span>
                        </div>
                    </div>
                )}

                {lockView && (
                    <div className="flex flex-col items-center gap-4 mb-16">
                        <div className="flex items-center gap-4">
                            <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-black' : 'text-gray-400'}`}>Monthly</span>
                            <button
                                onClick={() => setBillingCycle(prev => prev === 'monthly' ? 'yearly' : 'monthly')}
                                className="w-14 h-7 bg-gray-200 rounded-full relative p-1 transition-colors hover:bg-gray-300"
                            >
                                <motion.div
                                    animate={{ x: billingCycle === 'monthly' ? 0 : 28 }}
                                    className="w-5 h-5 bg-white rounded-full shadow-sm"
                                />
                            </button>
                            <span className={`text-sm font-medium ${billingCycle === 'yearly' ? 'text-black' : 'text-gray-400'}`}>
                                Yearly <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded-full text-xs">Save 20%</span>
                            </span>
                        </div>
                    </div>
                )}

                {/* Pricing Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {tiers.map((tier, idx) => {
                        const priceInfo = subscriptionManager.formatPrice(tier.price);
                        const basePriceNum = parseInt(priceInfo.value.replace(/,/g, ''));
                        const displayPrice = billingCycle === 'yearly'
                            ? Math.round(basePriceNum * 0.8)
                            : priceInfo.value;

                        const isCurrentTier = subscriptionManager.getTier() === tier.id;

                        return (
                            <motion.div
                                key={tier.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className={`relative flex flex-col p-8 rounded-[2.5rem] border ${tier.isPopular ? 'border-black shadow-xl ring-1 ring-black/5' : 'border-gray-100 bg-white hover:border-gray-200'} transition-all`}
                            >
                                {tier.isPopular && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-1">
                                        <Zap className="h-3 w-3 fill-white" />
                                        Most Popular
                                    </div>
                                )}

                                <div className="mb-8">
                                    <h3 className="text-xl font-bold mb-2">{tier.name}</h3>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-gray-400 text-lg font-medium">{priceInfo.symbol}</span>
                                        <span className="text-4xl font-black">{displayPrice}</span>
                                        <span className="text-gray-400 text-sm">/mo</span>
                                    </div>
                                    {billingCycle === 'yearly' && tier.price > 0 && (
                                        <p className="text-xs text-green-600 font-medium mt-1">Billed annually</p>
                                    )}
                                </div>

                                <ul className="flex-1 space-y-4 mb-8">
                                    {tier.features.map((feature, fIdx) => (
                                        <li key={fIdx} className="flex items-start gap-3 text-sm text-gray-600">
                                            <div className="mt-0.5 rounded-full bg-gray-50 p-0.5">
                                                <Check className="h-3 w-3 text-black" />
                                            </div>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>

                                <Button
                                    disabled={isCurrentTier}
                                    className={`w-full h-12 rounded-2xl text-base font-bold transition-all ${isCurrentTier ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : tier.isPopular ? 'bg-black text-white hover:scale-[1.02]' : 'bg-gray-50 text-black hover:bg-gray-100 hover:scale-[1.02]'}`}
                                    onClick={() => handleUpgradeClick(tier)}
                                >
                                    {isCurrentTier ? 'Current Plan' : tier.price === 0 ? 'Get Started' : 'Upgrade Now'}
                                </Button>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Add-ons Section */}
                <div className="mt-32">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold mb-4">Precision AI Add-ons</h2>
                        <p className="text-gray-500">Premium intelligence on demand, no subscription required.</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { name: 'AI Pitch Deck Review', price: 499, icon: Sparkles, roles: ['startup'] },
                            { name: 'AI Investor Readiness', price: 999, icon: Zap, roles: ['startup'] },
                            { name: 'AI Valuation Insights', price: 1999, icon: Globe, roles: ['startup', 'investor'] },
                            { name: 'Warm Intro Booster', price: 2999, icon: Sparkles, roles: ['startup'] },
                            { name: 'Due Diligence Assistant', price: 4999, icon: Check, roles: ['investor'] },
                            { name: 'Market Intelligence Report', price: 1499, icon: Globe, roles: ['investor'] },
                        ]
                            .filter(addon => addon.roles.includes(view))
                            .map((addon, idx) => {
                                const priceInfo = subscriptionManager.formatPrice(addon.price);
                                return (
                                    <div key={idx} className="p-6 rounded-3xl bg-gray-50/50 border border-gray-100 flex flex-col items-center text-center group hover:bg-white hover:shadow-lg transition-all">
                                        <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                            <addon.icon className="h-6 w-6 text-black" />
                                        </div>
                                        <h4 className="font-bold mb-1">{addon.name}</h4>
                                        <p className="text-lg font-black">{priceInfo.symbol}{priceInfo.value}</p>
                                        <button className="mt-4 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-colors">
                                            One-time purchase
                                        </button>
                                    </div>
                                );
                            })}
                    </div>
                </div>

                {/* Pitch Section */}
                <div className="mt-32 max-w-4xl mx-auto p-12 rounded-[3.5rem] bg-black text-white relative overflow-hidden text-center">
                    <div className="absolute top-0 right-0 h-full w-1/3 bg-white/5 skew-x-[-20deg] translate-x-1/2"></div>
                    <div className="relative z-10">
                        <h2 className="text-3xl font-bold mb-6 italic text-gray-400">"We monetize access to high-quality deal flow and investor readiness."</h2>
                        <p className="text-lg text-gray-300 leading-relaxed">
                            Startups pay to signal seriousness; investors pay for time efficiency. <br />
                            <span className="text-white font-bold underline decoration-indigo-500 underline-offset-4">AI sits at the center of both.</span>
                        </p>
                    </div>
                </div>
            </main>

            <PaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                tier={selectedTier}
            />
        </div>
    )
}
