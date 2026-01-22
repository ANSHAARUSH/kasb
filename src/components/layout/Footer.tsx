import { Link } from "react-router-dom"

export function Footer() {
    return (
        <footer className="border-t border-gray-100 bg-white py-12">
            <div className="container mx-auto px-4">
                <div className="grid gap-8 md:grid-cols-4">
                    <div className="md:col-span-2">
                        <Link to="/" className="text-xl font-bold tracking-tighter">Kasb.AI</Link>
                        <p className="mt-4 max-w-xs text-sm text-gray-500">
                            The premium matchmaking platform for ambitious startups and visionary investors.
                        </p>
                    </div>

                    <div>
                        <h4 className="mb-4 font-semibold">Platform</h4>
                        <ul className="space-y-2 text-sm text-gray-500">
                            <li><Link to="/signup" className="hover:text-black">Startups</Link></li>
                            <li><Link to="/signup?role=investor" className="hover:text-black">Investors</Link></li>
                            <li><Link to="/" className="hover:text-black">Bounty Program</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="mb-4 font-semibold">Company</h4>
                        <ul className="space-y-2 text-sm text-gray-500">
                            <li><Link to="/" className="hover:text-black">About</Link></li>
                            <li><Link to="/" className="hover:text-black">Careers</Link></li>
                            <li><Link to="/" className="hover:text-black">Legal</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="mb-4 font-semibold">Support</h4>
                        <ul className="space-y-2 text-sm text-gray-500">
                            <li>
                                <a
                                    href="https://mail.google.com/mail/?view=cm&fs=1&to=kasbai2025@gmail.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:text-black flex items-center gap-2"
                                >
                                    Contact Support
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
                <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-gray-100 pt-8 text-sm text-gray-500 md:flex-row">
                    <p>&copy; {new Date().getFullYear()} Kasb.AI. All rights reserved.</p>
                    <div className="flex gap-4">
                        <a href="https://x.com/kasbai2025" target="_blank" rel="noopener noreferrer" className="hover:text-black">X</a>
                        <a href="https://www.linkedin.com/in/kasb-ai-33173839b/" target="_blank" rel="noopener noreferrer" className="hover:text-black">LinkedIn</a>
                        <a href="https://www.instagram.com/kasb.ai/" target="_blank" rel="noopener noreferrer" className="hover:text-black">Instagram</a>
                    </div>
                </div>
            </div>
        </footer>
    )
}
