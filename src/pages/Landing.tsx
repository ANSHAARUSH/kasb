import { motion } from "framer-motion"
import { Button } from "../components/ui/button"
import { CheckCircle2, TrendingUp, Users, MessageSquare } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useEffect } from "react"
import { SEO } from "../components/common/SEO"

export function Landing() {
    const { user, loading } = useAuth()
    const navigate = useNavigate()

    useEffect(() => {
        if (!loading && user) {
            console.log("[Landing] User authenticated, pushing to dashboard")
            navigate('/dashboard', { replace: true })
        }
    }, [user, loading, navigate])

    return (
        <div className="flex flex-col gap-16 pb-20 overflow-hidden">
            <SEO
                title="AI-Powered Startup Investment & Investor Matchmaking Platform"
                description="Kasb.AI is the premium matchmaking platform connecting venture capital with high-growth startups. Accelerate your fundraising or find your next unicorn with AI-driven deal flow."
                keywords="Kasb.AI, startup investment platform, investor matchmaking, venture capital AI, startup fundraising tool, angel investor network, investor deal flow, AI startup discovery"
            />
            
            {/* FAQ Structured Data */}
            <script type="application/ld+json">
                {JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": "FAQPage",
                    "mainEntity": [
                        {
                            "@type": "Question",
                            "name": "How does Kasb.AI match startups and investors?",
                            "acceptedAnswer": {
                                "@type": "Answer",
                                "text": "Kasb.AI uses an advanced AI engine that analyzes over 50 data points, including industry, stage, ticket size, and geographic preference, to suggest the most relevant matches for both parties."
                            }
                        },
                        {
                            "@type": "Question",
                            "name": "Is Kasb.AI only for tech startups?",
                            "acceptedAnswer": {
                                "@type": "Answer",
                                "text": "While we have a strong focus on high-growth tech ventures, Kasb.AI supports startups across various industries looking for professional investment."
                            }
                        },
                        {
                            "@type": "Question",
                            "name": "How can I start fundraising on Kasb.AI?",
                            "acceptedAnswer": {
                                "@type": "Answer",
                                "text": "Founders can sign up, create a detailed profile of their venture, and immediately start appearing in the deal flow of verified investors who match their profile."
                            }
                        }
                    ]
                })}
            </script>

            {/* Hero Section */}
            <section id="hero" className="relative flex min-h-screen flex-col items-center justify-center px-4 pt-20" aria-labelledby="hero-title">
                {/* Dynamic Background */}
                <div className="absolute inset-0 -z-10 bg-white">
                    <div className="absolute top-[-10%] left-[-10%] h-[40%] w-[40%] rounded-full bg-indigo-50/50 blur-[120px]"></div>
                    <div className="absolute bottom-[-10%] right-[-10%] h-[40%] w-[40%] rounded-full bg-blue-50/50 blur-[120px]"></div>
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>

                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="max-w-4xl space-y-8 text-center"
                >
                    <div className="inline-flex items-center rounded-full border border-gray-100 bg-white/50 backdrop-blur-sm px-4 py-1.5 text-sm font-medium text-gray-600 shadow-sm">
                        <span className="flex h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
                        Vetted Network of High-Impact Founders & Investors
                    </div>

                    <h1 id="hero-title" className="text-4xl font-bold tracking-tighter text-soft-black sm:text-6xl leading-tight">
                        AI-Powered <span className="text-gray-400 font-light">Investor Matchmaking</span> <br />
                        <span className="bg-gradient-to-r from-black via-gray-700 to-black bg-clip-text text-transparent">& Startup Fundraising Platform</span>
                    </h1>

                    <p className="mx-auto max-w-2xl text-lg text-gray-500 sm:text-2xl leading-relaxed">
                        The premium platform connecting visionary capital with extraordinary innovation. 
                        Empowering startups to raise capital and providing investors with curated deal flow.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
                        <Button size="lg" className="h-16 w-full sm:w-auto rounded-full px-10 text-lg font-bold shadow-2xl shadow-indigo-200 hover:scale-105 transition-transform" asChild>
                            <Link to="/signup">Start Fundraising</Link>
                        </Button>
                        <Button size="lg" variant="outline" className="h-16 w-full sm:w-auto rounded-full px-10 text-lg font-bold border-2 hover:bg-gray-50 transition-all" asChild>
                            <Link to="/signup?role=investor">Find Startups</Link>
                        </Button>
                    </div>


                </motion.div>
            </section>

            {/* About Us Section */}
            <section id="about-us" className="container mx-auto px-4 py-32">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                        className="relative"
                    >
                        <div className="relative z-10 overflow-hidden rounded-[3rem] shadow-2xl">
                            <img
                                src={`${import.meta.env.BASE_URL}founders.jpg`}
                                alt="Kasb.AI Co-Founders Aarush and Ansh - Experts in AI startup matchmaking and fundraising"
                                title="Kasb.AI Founders"
                                className="w-full h-auto object-cover hover:scale-105 transition-transform duration-700"
                            />
                        </div>
                        {/* Decorative elements */}
                        <div className="absolute -bottom-8 -right-8 h-64 w-64 bg-indigo-50 rounded-full blur-3xl -z-10 opacity-60"></div>
                        <div className="absolute -top-8 -left-8 h-48 w-48 bg-blue-50 rounded-full blur-3xl -z-10 opacity-60"></div>

                        <div className="absolute bottom-10 -right-10 hidden md:block z-20">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="bg-black text-white p-8 rounded-[2.5rem] shadow-2xl"
                            >
                                <p className="text-sm font-bold tracking-widest uppercase mb-1">Co-Founders</p>
                                <p className="text-2xl font-black">Aarush & Ansh</p>
                            </motion.div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                        className="space-y-8"
                    >
                        <div>
                            <h2 className="text-5xl font-black mt-4 mb-6 tracking-tight text-soft-black leading-tight">Advanced Startup Discovery <br />& Investor Deal Flow</h2>
                            <p className="text-xl text-gray-500 leading-relaxed italic">
                                "We started Kasb.AI with a simple goal: to remove the friction between great ideas and the capital they deserve."
                            </p>
                            <p className="text-xl text-gray-500 leading-relaxed mt-6">
                                Founded by <span className="text-black font-bold underline decoration-indigo-500/30 underline-offset-4">Ansh and Aarush</span>, Kasb.AI is the leading AI platform for democratizing access to venture capital and creating meaningful connections in the startup ecosystem.
                            </p>
                        </div>
                    </motion.div>
                </div>

                <div className="grid gap-8 md:grid-cols-3">
                    {[
                        {
                            title: "Venture Capital Mission",
                            desc: "To empower startups with the resources they need to succeed while connecting investors with the next generation of industry-changing companies.",
                        },
                        {
                            title: "Investor Vision",
                            desc: "A world where every great idea has access to the capital and expertise needed to transform industries and improve lives globally.",
                        },
                        {
                            title: "Core Ecosystem Values",
                            desc: "Trust, transparency, and innovation drive everything we do. We believe in building lasting relationships that create value for all stakeholders.",
                        },
                    ].map((item, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.15 }}
                            viewport={{ once: true }}
                            className="rounded-[2rem] border border-gray-100 bg-white p-10 shadow-sm hover:shadow-md transition-all"
                        >
                            <h3 className="mb-3 text-xl font-bold tracking-tight">{item.title}</h3>
                            <p className="text-gray-500 leading-relaxed">{item.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Features (Refined) */}
            <section id="features" className="container mx-auto px-4 py-24">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold tracking-tight mb-4">Venture Capital Discovery & AI Matchmaking</h2>
                    <p className="text-gray-500 text-lg max-w-2xl mx-auto">Access high-growth investing opportunities and streamline your startup outreach through our AI-powered network.</p>
                </div>

                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                    {[
                        {
                            icon: TrendingUp,
                            title: "AI Analysis",
                            desc: "Our engine analyzes 50+ data points to find your perfect match, saving you months of manual outreach.",
                            color: "bg-black"
                        },
                        {
                            icon: Users,
                            title: "Vetted Network",
                            desc: "Every founder and investor goes through a multi-step verification process to maintain exclusivity.",
                            color: "bg-black"
                        },
                        {
                            icon: MessageSquare,
                            title: "AI Smart Guide",
                            desc: "Get instant answers and strategic guidance through our integrated AI assistant, built directly into your dashboard.",
                            color: "bg-black"
                        },
                        {
                            icon: CheckCircle2,
                            title: "Direct Access",
                            desc: "Skip the gatekeepers. Message verified decision-makers directly through our secure infrastructure.",
                            color: "bg-black"
                        },
                    ].map((feature, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            viewport={{ once: true }}
                            className="group rounded-[2.5rem] border border-gray-100 bg-white p-10 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300"
                        >
                            <div className={`mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl ${feature.color} text-white shadow-lg shadow-gray-200 group-hover:scale-110 transition-transform`}>
                                <feature.icon className="h-7 w-7" />
                            </div>
                            <h3 className="mb-3 text-2xl font-bold tracking-tight">{feature.title}</h3>
                            <p className="text-gray-500 leading-relaxed">{feature.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* How It Works (Refined) */}
            <section id="how-it-works" className="bg-gray-50/50 py-24">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold tracking-tight mb-4">Simple. Fast. Effective.</h2>
                        <p className="text-gray-500 text-lg">The three steps to your next major milestone.</p>
                    </div>

                    <div className="grid gap-12 md:grid-cols-3">
                        {[
                            { step: "01", title: "Build Your Asset", desc: "Create a professional profile that highlights your unique value proposition." },
                            { step: "02", title: "Review Matches", desc: "Our AI presents a curated list of investors or startups ready for scale." },
                            { step: "03", title: "Close the Deal", desc: "Communicate securely and finalize terms directly through the platform." },
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                viewport={{ once: true }}
                                className="relative p-8 rounded-3xl bg-white shadow-sm border border-gray-100"
                            >
                                <span className="absolute -top-6 -left-4 text-7xl font-extrabold text-gray-50 tracking-tighter -z-0 select-none">{item.step}</span>
                                <div className="relative z-10">
                                    <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                                    <p className="text-gray-500 leading-relaxed">{item.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="container mx-auto px-4 py-24 text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="rounded-[4rem] bg-soft-black px-6 py-24 text-white relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 h-full w-1/3 bg-white/5 skew-x-[-20deg] translate-x-1/2"></div>
                    <div className="relative z-10">
                        <h2 className="mb-8 text-5xl font-bold tracking-tight">Ready to reshape the future?</h2>
                        <p className="mx-auto mb-12 max-w-xl text-gray-400 text-lg leading-relaxed">
                            Join our exclusive community of high-impact founders and ambitious investors.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Button size="lg" className="h-16 w-full sm:w-auto rounded-full bg-white text-black hover:bg-gray-100 px-12 text-xl font-bold" asChild>
                                <Link to="/signup">Apply for Access</Link>
                            </Button>
                            <p className="text-sm text-gray-500">No commitment required at sign-up.</p>
                        </div>
                    </div>
                </motion.div>

                {/* Co-founders Credit */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    viewport={{ once: true }}
                    className="mt-16 text-sm text-gray-400 font-medium tracking-widest uppercase"
                >
                    Founded by <span className="text-black">Aarush</span> & <span className="text-black">Ansh</span>
                </motion.div>
            </section>
        </div>
    )
}

