import { PricingView } from "../components/dashboard/PricingView"
import { Navbar } from "../components/layout/Navbar"
import { Footer } from "../components/layout/Footer"

export function PricingPage() {
    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            <div className="pt-20">
                <PricingView />
            </div>
            <Footer />
        </div>
    )
}
