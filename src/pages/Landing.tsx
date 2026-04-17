import { motion, useMotionTemplate, useMotionValue } from "framer-motion"
import React, { type MouseEvent, useEffect } from "react"
import { Button } from "../components/ui/button"
import { CheckCircle2, TrendingUp, Users, MessageSquare } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { SEO } from "../components/common/SEO"
import { TransparentHeroImage } from "../components/common/TransparentHeroImage"

import { TiltWrapper } from "../components/common/TiltWrapper"

function GlowCard({ children, className }: { children: React.ReactNode, className?: string }) {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    function handleMouseMove({ currentTarget, clientX, clientY }: MouseEvent) {
        const { left, top } = currentTarget.getBoundingClientRect();
        mouseX.set(clientX - left);
        mouseY.set(clientY - top);
    }

    return (
        <div
            className={`group relative overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.6)] ${className}`}
            onMouseMove={handleMouseMove}
        >
            <motion.div
                className="pointer-events-none absolute -inset-px opacity-0 transition duration-500 group-hover:opacity-100 z-10"
                style={{
                    background: useMotionTemplate`
                        radial-gradient(
                            600px circle at ${mouseX}px ${mouseY}px,
                            rgba(88, 86, 214, 0.15),
                            transparent 80%
                        )
                    `,
                }}
            />
            <div className="relative z-20 w-full h-full">
                {children}
            </div>
            {/* Added for interactive glassmorphism inner border */}
            <div className="pointer-events-none absolute inset-0 rounded-[inherit] border border-white/5 group-hover:border-white/20 transition-colors duration-500 z-30" style={{ willChange: "border-color" }} />
        </div>
    );
}

export default function Landing() {
    const { user, loading } = useAuth()
    const navigate = useNavigate()

    // Permanent Dark Theme (isDarkMode = true)
    const isDarkMode = true

    useEffect(() => {
        if (!loading && user) {
            console.log("[Landing] User authenticated, pushing to dashboard")
            navigate('/dashboard', { replace: true })
        }
    }, [user, loading, navigate])

    return (
        <motion.div 
            className="flex flex-col gap-16 pb-20 overflow-hidden relative min-h-screen"
        >
            {/* Optimized Fixed Background Layer */}
            <div 
                className="fixed inset-0 -z-20 pointer-events-none"
                style={{ 
                    backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.75), rgba(0, 0, 0, 0.75)), url('${import.meta.env.BASE_URL}landing-background.webp')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundColor: '#000000'
                }}
            />
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
                        { "@type": "Question", "name": "How does Kasb.AI match startups and investors?", "acceptedAnswer": { "@type": "Answer", "text": "Kasb.AI uses an advanced AI engine that analyzes over 50 data points." } },
                        { "@type": "Question", "name": "Is Kasb.AI only for tech startups?", "acceptedAnswer": { "@type": "Answer", "text": "While we have a strong focus on high-growth tech ventures..." } },
                        { "@type": "Question", "name": "How can I start fundraising on Kasb.AI?", "acceptedAnswer": { "@type": "Answer", "text": "Founders can sign up, create a detailed profile..." } }
                    ]
                })}
            </script>

            {/* Hero Section */}
            <section id="hero" className="relative flex min-h-[90vh] lg:min-h-screen flex-col items-center justify-start px-4 pt-6 lg:pt-8 overflow-hidden" aria-labelledby="hero-title">

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="max-w-4xl space-y-6 text-center z-10"
                >
                    <div className={`inline-flex items-center rounded-full border px-4 py-1.5 text-xs sm:text-sm font-medium shadow-sm transition-colors duration-500 ${isDarkMode ? "bg-white/10 border-white/20 text-white" : "bg-white/50 border-gray-100 text-gray-600"}`}>
                        <span className="flex h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
                        Vetted Network of High-Impact Founders & Investors
                    </div>

                    <h1 id="hero-title" className={`text-5xl font-bold tracking-tighter sm:text-7xl md:text-8xl lg:text-[5.5rem] leading-[1.1] transition-colors duration-500 ${isDarkMode ? "text-white" : "text-soft-black"}`}>
                        Connecting <span className="text-gray-500 font-light">vision</span> <br />
                        <span className="animate-background-pan bg-gradient-to-r from-indigo-300 via-purple-300 to-indigo-300 bg-[length:200%_auto] bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(167,139,250,0.4)]">with valuation</span>
                    </h1>

                    <p className={`mx-auto max-w-3xl text-sm sm:text-lg md:text-xl leading-relaxed transition-colors duration-500 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                        Kasb.AI is an AI-powered platform that helps founders turn ideas into investor-ready startups. It analyzes pitch decks, connects you with the right investors, and simplifies the fundraising process—so you can focus on building your startup.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                        <Button size="lg" className="h-14 sm:h-16 w-full sm:w-auto rounded-full px-12 text-lg font-bold bg-white text-black hover:bg-gray-200 shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all duration-300" asChild>
                            <Link to="/signup">Start Fundraising</Link>
                        </Button>
                        <Button size="lg" variant="ghost" className="h-14 sm:h-16 w-full sm:w-auto rounded-full px-12 text-lg font-bold border-2 border-white/30 text-white hover:bg-white/10 transition-all duration-300" asChild>
                            <Link to="/signup?role=investor">Find Startups</Link>
                        </Button>
                    </div>

                    {/* Mobile Only: Hero Image (visible on phone) */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 1 }}
                        className="block lg:hidden mt-8 w-full max-w-[280px] mx-auto"
                    >
                        <TransparentHeroImage 
                            src={`${import.meta.env.BASE_URL}standing-man.jpg`} 
                            alt="Visionary Concept" 
                            className="w-full h-auto drop-shadow-2xl"
                        />
                    </motion.div>
                </motion.div>

                {/* Desktop/Tablet Only: Hero Image (positioned as in screenshot) */}
                <div className="hidden lg:block absolute right-0 bottom-0 w-[35%] max-w-[420px] pointer-events-none mr-[3%] mb-[3%]">
                    <motion.div
                        initial={{ opacity: 0, x: 100, y: 50 }}
                        animate={{ opacity: 1, x: 0, y: 0 }}
                        transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
                        className="relative"
                    >
                        <TransparentHeroImage 
                            src={`${import.meta.env.BASE_URL}standing-man.jpg`} 
                            alt="Visionary Concept" 
                            className="w-full h-auto drop-shadow-[0_25px_50px_rgba(255,255,255,0.15)] animate-hero-float scale-110"
                        />
                    </motion.div>
                </div>
            </section>
            
            {/* Trusted By Section (Scrolling Marquee) */}
            <div className={`py-12 border-y transition-colors duration-700 ${isDarkMode ? "bg-black/40 border-white/5" : "bg-gray-50/50 border-gray-100"}`}>
                <div className="container mx-auto px-4 mb-4">
                    <p className={`text-center text-xs font-bold uppercase tracking-[0.3em] transition-colors ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                        Explore leading investors including:
                    </p>
                </div>
                <div className="relative flex overflow-hidden group">
                    <div className="flex space-x-12 animate-marquee whitespace-nowrap py-4">
                        {[
                            "Sequoia Capital", "Accel Partners", "Andreessen Horowitz", "SoftBank Vision Fund", 
                            "Tiger Global", "Lightspeed Venture Partners", "Temasek", "Index Ventures", 
                            "Matrix Partners", "Nexus Venture Partners", "Elevation Capital", "Kalaari Capital"
                        ].map((logo) => (
                            <span 
                                key={logo} 
                                className={`text-xl sm:text-2xl font-black uppercase tracking-tighter opacity-30 hover:opacity-100 transition-opacity cursor-default px-4 ${isDarkMode ? "text-white" : "text-black"}`}
                            >
                                {logo}
                            </span>
                        ))}
                        {/* Duplicate for infinite effect */}
                        {[
                            "Sequoia Capital", "Accel Partners", "Andreessen Horowitz", "SoftBank Vision Fund", 
                            "Tiger Global", "Lightspeed Venture Partners", "Temasek", "Index Ventures", 
                            "Matrix Partners", "Nexus Venture Partners", "Elevation Capital", "Kalaari Capital"
                        ].map((logo) => (
                            <span 
                                key={`${logo}-dup`} 
                                className={`text-xl sm:text-2xl font-black uppercase tracking-tighter opacity-30 hover:opacity-100 transition-opacity cursor-default px-4 ${isDarkMode ? "text-white" : "text-black"}`}
                            >
                                {logo}
                            </span>
                        ))}
                    </div>
                </div>
            </div>


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
                        <TiltWrapper className="relative z-10 overflow-hidden rounded-[3rem] shadow-2xl">
                            <img
                                src={`${import.meta.env.BASE_URL}founders.jpg`}
                                alt="Kasb.AI Founders"
                                title="Kasb.AI Founders"
                                className="w-full h-auto object-cover hover:scale-105 transition-transform duration-700"
                                width={800}
                                height={800}
                            />
                        </TiltWrapper>
                        <div className={`absolute -bottom-8 -right-8 h-64 w-64 rounded-full blur-3xl -z-10 opacity-60 transition-colors ${isDarkMode ? "bg-indigo-900/40" : "bg-indigo-50"}`}></div>
                        <div className={`absolute -top-8 -left-8 h-48 w-48 rounded-full blur-3xl -z-10 opacity-60 transition-colors ${isDarkMode ? "bg-blue-900/40" : "bg-blue-50"}`}></div>

                        <div className="absolute bottom-10 -right-10 hidden md:block z-20">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.5, type: "spring" }}
                                className={`p-8 rounded-[2.5rem] shadow-2xl transition-colors ${isDarkMode ? "bg-white text-black" : "bg-black text-white"}`}
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
                        <div className="space-y-6">
                            <motion.h2 
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className={`text-5xl font-black mt-4 mb-6 tracking-tight leading-tight transition-colors duration-700 ${isDarkMode ? "text-white" : "text-soft-black"}`}
                            >
                                Advanced Startup Discovery <br />& Investor Deal Flow
                            </motion.h2>
                            <motion.p 
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className={`text-xl leading-relaxed italic transition-colors ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                            >
                                "We started Kasb.AI with a simple goal: to remove the friction between great ideas and the capital they deserve."
                            </motion.p>
                            <motion.p 
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className={`text-xl leading-relaxed mt-6 transition-colors ${isDarkMode ? "text-gray-300" : "text-gray-500"}`}
                            >
                                Founded by <span className={`font-bold underline decoration-indigo-500/30 underline-offset-4 transition-colors ${isDarkMode ? "text-white" : "text-black"}`}>Aarush and Ansh</span>, two passionate <span className="underline decoration-blue-500/40 underline-offset-4 font-bold">15-year-old</span> startup founders, Kasb.AI is the leading AI platform for democratizing access to venture capital and creating meaningful connections in the startup ecosystem.
                            </motion.p>
                        </div>
                    </motion.div>
                </div>

                <div className="relative mt-24">
                    <div className="relative overflow-hidden rounded-[3rem]">
                        <div className="grid gap-6 md:grid-cols-3 relative z-10">
                            {[
                                { title: "Venture Capital Mission", desc: "To empower startups with the resources and connections they need to scale globally." },
                                { title: "Investor Vision", desc: "A world where every great idea has access to the right visionary capital at the right time." },
                                { title: "Core Ecosystem Values", desc: "Trust, transparency, and innovation are the pillars of the Kasb matchmaking network." },
                            ].map((item, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, rotateY: -90, x: -20 }}
                                    whileInView={{ opacity: 1, rotateY: 0, x: 0 }}
                                    transition={{ duration: 0.8, delay: 0.3 + i * 0.2, type: "spring", stiffness: 100, damping: 20 }}
                                    whileHover={{ 
                                        scale: 1.05, 
                                        y: -10, 
                                        backgroundColor: "#ffffff", 
                                        color: "#000000", 
                                        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)" 
                                    }}
                                    viewport={{ once: true }}
                                    className={`group rounded-[2.5rem] border border-transparent p-8 shadow-sm transition-all duration-500 cursor-pointer transform-gpu perspective-1000 ${isDarkMode ? "bg-gray-900/60 text-white" : "bg-white text-black"}`}
                                >
                                    <div className={`mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl transition-colors ${isDarkMode ? "bg-white/10 text-white" : "bg-indigo-50 text-indigo-600"} group-hover:bg-black/5 group-hover:text-black`}>
                                        <TrendingUp className="h-6 w-6" />
                                    </div>
                                    <h3 className="mb-4 text-xl font-bold tracking-tight group-hover:text-black">{item.title}</h3>
                                    <p className={`text-sm leading-relaxed transition-colors ${isDarkMode ? "text-gray-400" : "text-gray-500"} group-hover:text-black/70`}>
                                        {item.desc}
                                    </p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <section id="features" className="container mx-auto px-4 py-24 transition-colors duration-700">
                <div className="flex flex-col lg:flex-row items-center justify-center gap-12 mb-20 max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                        className="w-full lg:w-1/2 max-w-[450px]"
                    >
                        <TiltWrapper className="animate-hero-float">
                            <TransparentHeroImage 
                                src={`${import.meta.env.BASE_URL}features-walker-clean.png`} 
                                backgroundType="light"
                                alt="Kasb AI Matchmaking" 
                                className="w-full h-auto drop-shadow-[0_20px_60px_rgba(255,255,255,0.1)] transition-transform hover:scale-110 duration-700"
                            />
                        </TiltWrapper>
                    </motion.div>
                    <div className="text-center lg:text-left flex-1 space-y-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            viewport={{ once: true }}
                        >
                            <h2 className={`text-4xl sm:text-5xl font-bold tracking-tight mb-6 transition-colors ${isDarkMode ? "text-white" : "text-black"}`}>
                                Venture Capital Discovery <br className="hidden lg:block" />& AI Matchmaking
                            </h2>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                            viewport={{ once: true }}
                        >
                            <p className={`text-lg sm:text-xl max-w-2xl mx-auto lg:mx-0 transition-colors ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                                Access high-growth investing opportunities and streamline your startup outreach through our AI-powered network.
                                Our ecosystem connects you with the right opportunities at the right time.
                            </p>
                        </motion.div>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[
                        { 
                            icon: TrendingUp, 
                            title: "AI Matchmaking Engine", 
                            desc: "Our engine analyzes 50+ data points including market context, traction, and founder history to pair you with the exact right opportunity.",
                            className: `lg:col-span-2 lg:row-span-2 bg-gradient-to-br from-indigo-900/10 to-transparent p-10 rounded-[2.5rem] ${isDarkMode ? "bg-gray-900/50" : "bg-white"}`
                        },
                        { 
                            icon: Users, 
                            title: "Vetted Network", 
                            desc: "Every founder and investor goes through our rigorous verification process, ensuring zero noise and high-signal interactions.",
                            className: `lg:col-span-1 p-10 rounded-[2.5rem] ${isDarkMode ? "bg-gray-900/50" : "bg-white"}`
                        },
                        { 
                            icon: MessageSquare, 
                            title: "AI Smart Guide", 
                            desc: "Get instant answers and strategic advice from 'Melon Tusk' or our other trained AI advisors, directly in the dashboard.",
                            className: `lg:col-span-1 p-10 rounded-[2.5rem] ${isDarkMode ? "bg-gray-900/50" : "bg-white"}`
                        },
                        { 
                            icon: CheckCircle2, 
                            title: "Direct Access", 
                            desc: "Skip the gatekeepers. Message verified investors or founders directly when a match is established.",
                            className: `lg:col-span-3 lg:col-start-1 p-10 rounded-[2.5rem] ${isDarkMode ? "bg-gray-900/50" : "bg-white"} flex flex-col md:flex-row items-start md:items-center justify-between`
                        },
                    ].map((feature, i) => (
                        <GlowCard key={i} className={feature.className}>
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                viewport={{ once: true }}
                                className="h-full flex flex-col"
                            >
                                <div className={`mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl transition-all ${isDarkMode ? "bg-white/10 text-white" : "bg-black text-white"}`}>
                                    <feature.icon className="h-7 w-7" />
                                </div>
                                <div className="max-w-xl">
                                    <h3 className={`mb-3 text-2xl font-bold tracking-tight transition-colors ${isDarkMode ? "text-white" : "text-black"}`}>{feature.title}</h3>
                                    <p className={`leading-relaxed transition-colors ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{feature.desc}</p>
                                </div>
                            </motion.div>
                        </GlowCard>
                    ))}
                </div>
            </section>

            {/* Product Sneak Peek Section */}
            <section className="container mx-auto px-4 py-12 relative overflow-hidden">
                <div className="absolute inset-0 -z-10 translate-y-1/2">
                    <div className="h-[40vw] w-full bg-[#DC143C]/5 blur-[150px] mix-blend-screen rounded-full" />
                </div>
                
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    viewport={{ once: true }}
                    className="max-w-4xl mx-auto rounded-[3rem] p-2 sm:p-4 bg-gradient-to-b from-white/10 to-transparent border border-white/5 shadow-2xl relative"
                >
                    <div className="absolute top-6 left-8 flex gap-2 z-20">
                        <div className="w-3 h-3 rounded-full bg-red-500/80" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                        <div className="w-3 h-3 rounded-full bg-green-500/80" />
                    </div>
                    <div className="relative rounded-[2.5rem] overflow-hidden bg-black ring-1 ring-white/10 flex flex-col justify-end">
                        {/* Floating text at the top of his head */}
                        <div className="absolute top-8 left-0 w-full flex justify-center z-10 pointer-events-none">
                            <motion.div 
                                initial={{ opacity: 0, y: -20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5, duration: 0.8 }}
                                viewport={{ once: true }}
                                className="bg-black/40 backdrop-blur-md border border-white/10 px-6 py-2.5 rounded-full shadow-2xl flex items-center gap-2"
                            >
                                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                                <span className="text-white font-bold tracking-widest text-xs uppercase">Your AI Copilot</span>
                            </motion.div>
                        </div>
                        <img 
                            src={`${import.meta.env.BASE_URL}hero-image.png`} 
                            alt="Kasb.AI Dashboard Walkthrough" 
                            className="w-full h-auto object-cover opacity-90 transition-transform duration-1000 hover:scale-105 -mt-[15%] sm:-mt-[18%] md:-mt-[20%]"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-8 sm:p-12">
                            <div className="max-w-2xl">
                                <h3 className="text-3xl sm:text-4xl font-bold text-white mb-4">Inside the Platform</h3>
                                <p className="text-gray-300 text-lg">Curated dealing, real-time AI negotiation, and seamless direct messaging combined in one high-performance dashboard.</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* How It Works (Refined for Dark Mode) */}
            <section id="how-it-works" className={`py-24 transition-colors duration-700 ${isDarkMode ? "bg-transparent" : "bg-gray-50/50"}`}>
                <div className="container mx-auto px-4">
                    <div className="flex flex-col lg:flex-row items-center justify-center gap-12 mb-20 max-w-6xl mx-auto">
                        <div className="text-center lg:text-left flex-1 space-y-6">
                            <motion.h2 
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className={`text-5xl font-bold tracking-tight mb-4 transition-colors ${isDarkMode ? "text-white" : "text-black"}`}
                            >
                                Simple. Fast. Effective.
                            </motion.h2>
                            <motion.p 
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                viewport={{ once: true }}
                                className={`text-xl transition-colors ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                            >
                                The three steps to your next major milestone.
                            </motion.p>
                        </div>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8 }}
                            viewport={{ once: true }}
                            className="w-full lg:w-1/2 max-w-[550px]"
                        >
                            <TiltWrapper className="animate-hero-float">
                                <TransparentHeroImage 
                                    src={`${import.meta.env.BASE_URL}how-it-works-man.png`} 
                                    backgroundType="light"
                                    alt="Kasb AI Process" 
                                    className="w-full h-auto drop-shadow-[0_20px_60px_rgba(255,255,255,0.1)] scale-[1.2] hover:scale-[1.25] transition-transform duration-700"
                                />
                            </TiltWrapper>
                        </motion.div>
                    </div>

                    <div className="grid gap-12 md:grid-cols-3">
                        {[
                            { step: "01", title: "Build Your Asset", desc: "Create a professional profile..." },
                            { step: "02", title: "Review Matches", desc: "Our AI presents a curated list..." },
                            { step: "03", title: "Close the Deal", desc: "Communicate securely..." },
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.2 }}
                                viewport={{ once: true }}
                                className={`relative p-8 rounded-3xl shadow-sm border transition-all ${isDarkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100"}`}
                            >
                                <span className={`absolute -top-6 -left-4 text-7xl font-extrabold tracking-tighter -z-0 select-none transition-colors ${isDarkMode ? "text-white/5" : "text-gray-50"}`}>{item.step}</span>
                                <div className="relative z-10">
                                    <h3 className={`text-xl font-bold mb-3 transition-colors ${isDarkMode ? "text-white" : "text-black"}`}>{item.title}</h3>
                                    <p className={`leading-relaxed transition-colors ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{item.desc}</p>
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
                    className="rounded-[4rem] px-6 py-24 relative overflow-hidden text-white shadow-2xl"
                    style={{ 
                        backgroundImage: `url('${import.meta.env.BASE_URL}cta-bg.webp')`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}
                >
                    {/* Immersive Dark Overlay */}
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"></div>
                    
                    <div className="relative z-10">
                        <h2 className="mb-8 text-5xl font-bold tracking-tight text-white drop-shadow-lg">Ready to reshape the future?</h2>
                        <p className="mx-auto mb-12 max-w-xl text-lg leading-relaxed text-gray-200 drop-shadow-md">
                            Join our exclusive community of high-impact founders and ambitious investors.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Button size="lg" className="h-16 w-full sm:w-auto rounded-full px-12 text-xl font-bold bg-white text-black hover:bg-gray-100 shadow-[0_0_40px_rgba(255,255,255,0.4)] transition-all hover:scale-105 duration-300" asChild>
                                <Link to="/signup">Apply for Access</Link>
                            </Button>
                            <p className="text-sm text-gray-300 drop-shadow-sm font-medium">No commitment required at sign-up.</p>
                        </div>
                    </div>
                </motion.div>

                {/* Co-founders Credit */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    viewport={{ once: true }}
                    className={`mt-16 text-sm font-medium tracking-widest uppercase transition-colors ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}
                >
                    Founded by <span className={`${isDarkMode ? "text-white" : "text-black"}`}>Aarush</span> & <span className={`${isDarkMode ? "text-white" : "text-black"}`}>Ansh</span>
                </motion.div>
            </section>
        </motion.div>
    )
}
