import { PricingView } from "../../components/dashboard/PricingView"
import { useAuth } from "../../context/AuthContext"

export function DashboardPricing() {
    const { role } = useAuth()

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-extrabold tracking-tight">Subscription Plans</h1>
                <p className="text-gray-500">Manage your subscription and explore premium features tailored for your role.</p>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                <PricingView
                    defaultView={role === 'startup' ? 'startup' : 'investor'}
                    lockView={true}
                />
            </div>
        </div>
    )
}
