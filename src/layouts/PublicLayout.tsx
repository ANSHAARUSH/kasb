import { Navbar } from "../components/layout/Navbar"
import { Footer } from "../components/layout/Footer"
import { Outlet } from "react-router-dom"

export function PublicLayout() {
    return (
        <div className="min-h-screen bg-white font-sans text-soft-black">
            <Navbar />
            <main className="pt-16">
                <Outlet />
            </main>
            <Footer />
        </div>
    )
}
