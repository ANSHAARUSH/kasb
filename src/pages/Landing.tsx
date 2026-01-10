import { motion } from "framer-motion"
import { Button } from "../components/ui/button"
import { CheckCircle2, TrendingUp, Users } from "lucide-react"
import { Link } from "react-router-dom"

export function Landing() {
    return (
        <div className="flex flex-col gap-16 pb-20 overflow-hidden">
            {/* Hero Section */}
            <section id="hero" className="relative flex min-h-screen flex-col items-center justify-center px-4 pt-20">
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
                        Growing Community of Founders & Investors
                    </div>

                    <h1 className="text-6xl font-extrabold tracking-tighter text-soft-black sm:text-8xl leading-tight">
                        Connecting <span className="text-gray-400 font-light">Vision</span> <br />
                        <span className="bg-gradient-to-r from-black via-gray-700 to-black bg-clip-text text-transparent">with Valuation</span>
                    </h1>

                    <p className="mx-auto max-w-2xl text-lg text-gray-500 sm:text-2xl leading-relaxed">
                        A premium matchmaking platform for ambitious startups and visionary investors.
                        Built for those who play the long game.
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
            <section id="about-us" className="container mx-auto px-4 py-24">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl font-bold mb-4 tracking-tight">About Kasb.AI</h2>
                    <p className="mx-auto max-w-2xl text-lg text-gray-500">
                        Founded by <span className="text-black font-bold">Ansh and Aarush</span>, Kasb.AI is on a mission to democratize access to capital and create meaningful connections between visionary founders and forward-thinking investors.
                    </p>
                </motion.div>

                <div className="grid gap-8 md:grid-cols-3">
                    {[
                        {
                            title: "Our Mission",
                            desc: "To empower startups with the resources they need to succeed while connecting investors with the next generation of industry-changing companies.",
                        },
                        {
                            title: "Our Vision",
                            desc: "A world where every great idea has access to the capital and expertise needed to transform industries and improve lives globally.",
                        },
                        {
                            title: "Our Values",
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
                    <h2 className="text-4xl font-bold tracking-tight mb-4">Precision Matchmaking</h2>
                    <p className="text-gray-500 text-lg max-w-2xl mx-auto">We've eliminated the noise. Get matched with connections that actually matter for your business or portfolio.</p>
                </div>

                <div className="grid gap-8 md:grid-cols-3">
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

