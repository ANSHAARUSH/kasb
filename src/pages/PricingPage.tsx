import { PricingView } from "../components/dashboard/PricingView"
import { Navbar } from "../components/layout/Navbar"
import { Footer } from "../components/layout/Footer"
import { SEO } from "../components/common/SEO"

export function PricingPage() {
    return (
        <div className="min-h-screen bg-white">
            <SEO
                title="Premium Plans for Founders & Investors"
                description="Transparent pricing and subscription plans for startups and investors. Choose the best plan to accelerate your fundraising or deal flow discovery."
                keywords="Kasb.AI pricing, startup subscription plans, investor platform cost, fundraising tools pricing, premium deal flow access"
            />
            <Navbar />
            <div className="pt-20">
                <PricingView />
            </div>
            <Footer />
        </div>
    )
}
