import { PricingView } from "../components/dashboard/PricingView"
import { Navbar } from "../components/layout/Navbar"
import { Footer } from "../components/layout/Footer"
import { SEO } from "../components/common/SEO"

export function PricingPage() {
    return (
        <div className="min-h-screen bg-white">
            <SEO
                title="Venture Capital & Startup Fundraising Plans"
                description="Transparent pricing for Kasb.AI's premium matchmaking platform. Choose the best plan to accelerate your startup fundraising or access exclusive investor deal flow."
                keywords="Kasb.AI pricing, startup fundraising cost, venture capital platform subscription, angel investor access plans, premium deal flow pricing"
            />
            <Navbar />
            <div className="pt-20">
                <PricingView />
            </div>
            <Footer />
        </div>
    )
}
