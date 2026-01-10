import { useState } from "react"
import { Link } from "react-router-dom"
import { Button } from "../ui/button"
import { Menu, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export function Navbar() {
    const [isOpen, setIsOpen] = useState(false)

    const navLinks = [
        { href: "#hero", label: "Home" },
        { href: "#about-us", label: "About Us" },
        { href: "#features", label: "Features" },
        { href: "#how-it-works", label: "How It Works" },
    ]

    return (
        <header className="fixed top-0 z-50 w-full bg-black shadow-md">
            <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
                <Link to="/" className="flex items-center gap-2.5 z-50">
                    <img src={`${import.meta.env.BASE_URL}logo.jpg`} alt="Logo" className="h-9 w-auto rounded-md" />
                    <span className="text-xl font-bold tracking-tight text-white">Kasb.AI</span>
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-200">
                    {navLinks.map(link => (
                        <a key={link.href} href={link.href} className="hover:text-white transition-colors">
                            {link.label}
                        </a>
                    ))}
                    <Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link>
                </nav>

                <div className="flex items-center gap-4">
                    <Link to="/login" className="text-sm font-medium text-gray-200 hover:text-white hidden md:block">
                        Sign In
                    </Link>
                    <div className="hidden md:block">
                        <Button asChild className="rounded-full bg-white text-black hover:bg-gray-100 shadow-lg shadow-white/10">
                            <Link to="/signup">Get Started</Link>
                        </Button>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden text-white p-1"
                        onClick={() => setIsOpen(true)}
                    >
                        <Menu className="h-6 w-6" />
                    </button>
                </div>
            </div>

            {/* Mobile Menu Drawer */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] md:hidden"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Slide-in Panel */}
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 h-full w-[280px] bg-white z-[70] p-6 shadow-2xl md:hidden flex flex-col"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <span className="text-xl font-bold text-gray-900">Menu</span>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 -mr-2 text-gray-500 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            <nav className="flex flex-col gap-6 flex-1">
                                {navLinks.map(link => (
                                    <a
                                        key={link.href}
                                        href={link.href}
                                        className="text-lg font-medium text-gray-600 hover:text-black transition-colors"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        {link.label}
                                    </a>
                                ))}
                                <Link
                                    to="/pricing"
                                    className="text-lg font-medium text-gray-600 hover:text-black transition-colors"
                                    onClick={() => setIsOpen(false)}
                                >
                                    Pricing
                                </Link>
                            </nav>

                            <div className="mt-auto flex flex-col gap-4 pt-8 border-t border-gray-100">
                                <Link
                                    to="/login"
                                    className="text-center py-2.5 text-gray-600 font-medium hover:text-black transition-colors"
                                    onClick={() => setIsOpen(false)}
                                >
                                    Sign In
                                </Link>
                                <Button asChild className="w-full h-12 rounded-full text-lg shadow-xl shadow-indigo-100">
                                    <Link to="/signup" onClick={() => setIsOpen(false)}>Get Started</Link>
                                </Button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </header>
    )
}
