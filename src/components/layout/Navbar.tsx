import { useState } from "react"
import { Link } from "react-router-dom"
import { Button } from "../ui/button"
import { Menu, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { createPortal } from "react-dom"

export function Navbar() {
    const [isOpen, setIsOpen] = useState(false)

    const navLinks = [
        { href: "#hero", label: "Home" },
        { href: "#about-us", label: "About Us" },
        { href: "#features", label: "Features" },
        { href: "#how-it-works", label: "How It Works" },
    ]

    return (
        <header className="fixed top-0 z-50 w-full bg-black shadow-lg border-b border-white/5" style={{ transform: 'translateZ(0)' }}>
            <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
                <Link to="/" className="flex items-center gap-2.5 z-50">
                    <img src={`${import.meta.env.BASE_URL}logo.jpg`} alt="Logo" className="h-9 w-auto rounded-md" />
                    <span className="text-xl font-bold tracking-tight text-white">Kasb.AI</span>
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-300">
                    {navLinks.map(link => (
                        <a key={link.href} href={link.href} className="hover:text-white transition-colors duration-300">
                            {link.label}
                        </a>
                    ))}
                    <Link to="/pricing" className="hover:text-white transition-colors duration-300">Pricing</Link>
                </nav>

                <div className="flex items-center gap-4">
                    <Link to="/login" className="text-sm font-medium text-gray-300 hover:text-white hidden md:block transition-colors duration-300">
                        Log In
                    </Link>
                    <div className="hidden md:block">
                        <Button className="rounded-full bg-white text-black hover:bg-gray-100 shadow-xl shadow-white/5 transition-all duration-300" onClick={() => window.location.href = "#signup"}>
                            Get Started
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

            {/* Mobile Menu Drawer (Portaled to root for perfect opacity/stacking) */}
            {typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                    {isOpen && (
                        <>
                            {/* Backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-black/95 backdrop-blur-3xl z-[9998]"
                                onClick={() => setIsOpen(false)}
                            />

                            {/* Slide-in Panel */}
                            <motion.div
                                initial={{ x: "100%", opacity: 1 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: "100%", opacity: 1 }}
                                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                className="fixed top-0 right-0 h-full w-[280px] z-[9999] p-6 shadow-2xl flex flex-col border-l border-white/10"
                                style={{ backgroundColor: "#000000", opacity: 1 }}
                            >
                                <div className="flex items-center justify-between mb-8">
                                    <span className="text-xl font-bold text-white tracking-tight">Menu</span>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="p-2 -mr-2 text-gray-400 hover:text-white rounded-full hover:bg-white/5 transition-colors"
                                    >
                                        <X className="h-6 w-6" />
                                    </button>
                                </div>

                                <nav className="flex flex-col gap-6 flex-1">
                                    {navLinks.map(link => (
                                        <a
                                            key={link.href}
                                            href={link.href}
                                            className="text-lg font-medium text-gray-300 hover:text-white transition-colors"
                                            onClick={() => setIsOpen(false)}
                                        >
                                            {link.label}
                                        </a>
                                    ))}
                                    <Link
                                        to="/pricing"
                                        className="text-lg font-medium text-gray-300 hover:text-white transition-colors"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        Pricing
                                    </Link>
                                </nav>

                                <div className="mt-auto flex flex-col gap-4 pt-8 border-t border-white/10">
                                    <Link
                                        to="/login"
                                        className="text-center py-2.5 text-gray-300 font-medium hover:text-white transition-colors"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        Log In
                                    </Link>
                                    <Button className="w-full h-12 rounded-full text-lg bg-white text-black hover:bg-gray-200" onClick={() => { setIsOpen(false); window.location.hash = "signup"; }}>
                                        Get Started
                                    </Button>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </header>
    )
}
