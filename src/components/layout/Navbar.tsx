import { Link } from "react-router-dom"
import { Button } from "../ui/button"
export function Navbar() {

    return (
        <header className="fixed top-0 z-50 w-full glass-dark">
            <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
                <Link to="/" className="flex items-center gap-2.5">
                    <img src={`${import.meta.env.BASE_URL}logo.jpg`} alt="Logo" className="h-9 w-auto rounded-md" />
                    <span className="text-xl font-bold tracking-tight text-white">Kasb.AI</span>
                </Link>
                <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-200">
                    <a href="#hero" className="hover:text-white transition-colors">Home</a>
                    <a href="#about-us" className="hover:text-white transition-colors">About Us</a>
                    <a href="#features" className="hover:text-white transition-colors">Features</a>
                    <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
                </nav>
                <div className="flex items-center gap-4">
                    <Link to="/login" className="text-sm font-medium text-gray-200 hover:text-white hidden md:block">
                        Sign In
                    </Link>
                    <Button asChild className="rounded-full bg-white text-black hover:bg-gray-100 shadow-lg shadow-white/10">
                        <Link to="/signup">Get Started</Link>
                    </Button>
                </div>
            </div>
        </header>
    )
}
