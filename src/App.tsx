import { Suspense } from "react"
import { lazyWithRetry } from "./lib/lazyWithRetry"
import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { AdminRoute } from "./components/admin/AdminRoute"
import { PublicLayout } from "./layouts/PublicLayout"
import { DashboardLayout } from "./layouts/DashboardLayout"
import { AuthProvider, useAuth } from "./context/AuthContext"
import { ToastProvider } from "./components/ui/use-toast"
import { ChatProvider } from "./context/ChatContext"
import { ChatDialog } from "./components/chat/ChatDialog"
import { AuthEventHandler } from "./components/auth/AuthEventHandler"

// Lazy load pages for code splitting with reload-on-failure logic
const Landing = lazyWithRetry(() => import("./pages/Landing").then(m => ({ default: m.Landing })))
const Login = lazyWithRetry(() => import("./pages/auth/Login").then(m => ({ default: m.Login })))
const SignUp = lazyWithRetry(() => import("./pages/auth/SignUp").then(m => ({ default: m.SignUp })))
const ForgotPassword = lazyWithRetry(() => import("./pages/auth/ForgotPassword").then(m => ({ default: m.ForgotPassword })))
const UpdatePassword = lazyWithRetry(() => import("./pages/auth/UpdatePassword").then(m => ({ default: m.UpdatePassword })))
const InvestorHome = lazyWithRetry(() => import("./pages/dashboard/InvestorHome").then(m => ({ default: m.InvestorHome })))
const StartupHome = lazyWithRetry(() => import("./pages/dashboard/StartupHome").then(m => ({ default: m.StartupHome })))
const HistoryPage = lazyWithRetry(() => import("./pages/dashboard/HistoryPage").then(m => ({ default: m.HistoryPage })))
const StartupHistoryPage = lazyWithRetry(() => import("./pages/dashboard/StartupHistoryPage").then(m => ({ default: m.StartupHistoryPage })))
const MessagesPage = lazyWithRetry(() => import("./pages/dashboard/MessagesPage").then(m => ({ default: m.MessagesPage })))
const CheatSheetPage = lazyWithRetry(() => import("./pages/dashboard/CheatSheetPage").then(m => ({ default: m.CheatSheetPage })))
const StartupCheatSheetPage = lazyWithRetry(() => import("./pages/dashboard/StartupCheatSheetPage").then(m => ({ default: m.StartupCheatSheetPage })))
const InvestorProfile = lazyWithRetry(() => import("./pages/dashboard/InvestorProfile").then(m => ({ default: m.InvestorProfile })))
const StartupProfile = lazyWithRetry(() => import("./pages/dashboard/StartupProfile").then(m => ({ default: m.StartupProfile })))
const StartupAnalyticsPage = lazyWithRetry(() => import("./pages/dashboard/startup/AnalyticsPage").then(m => ({ default: m.AnalyticsPage })))
const AdminDashboard = lazyWithRetry(() => import("./pages/AdminDashboard").then(m => ({ default: m.AdminDashboard })))
const PricingPage = lazyWithRetry(() => import("./pages/PricingPage").then(m => ({ default: m.PricingPage })))
const DashboardPricing = lazyWithRetry(() => import("./pages/dashboard/DashboardPricing").then(m => ({ default: m.DashboardPricing })))
const InvestorPublicProfile = lazyWithRetry(() => import("./pages/dashboard/investor/InvestorPublicProfile").then(m => ({ default: m.InvestorPublicProfile })))
const EmailConfirmed = lazyWithRetry(() => import("./pages/auth/EmailConfirmed").then(m => ({ default: m.EmailConfirmed })))
const Onboarding = lazyWithRetry(() => import("./pages/auth/Onboarding").then(m => ({ default: m.Onboarding })))
const AuthCallback = lazyWithRetry(() => import("./pages/auth/AuthCallback").then(m => ({ default: m.AuthCallback })))

function CatchAll() {
  const { user, loading } = useAuth();
  const rawHash = window.location.hash;

  // 1. Identify Supabase auth fragments - DO THIS FIRST before any Navigate
  const isAuthFragment = rawHash.includes('access_token=') ||
    rawHash.includes('error=') ||
    rawHash.includes('type=recovery') ||
    rawHash.includes('type=signup');

  if (isAuthFragment) {
    console.log("[CatchAll] Auth fragment detected. Suppressing router redirect.");
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <div className="animate-pulse text-white/50 font-bold uppercase tracking-widest text-sm">
          Securing Session...
        </div>
      </div>
    );
  }

  // 2. If we are still loading, show a subtle loading state
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="text-gray-400 font-medium animate-pulse">Initializing app...</div>
      </div>
    );
  }

  // 3. If authenticated but hitting an unknown route, go to dashboard
  if (user) {
    console.log("[CatchAll] Authenticated user on unknown route. Pushing to dashboard.");
    return <Navigate to="/dashboard" replace />;
  }

  // 4. Default to landing for unauthenticated users
  console.log("[CatchAll] Unauthenticated user on unknown route. Pushing to landing.");
  return <Navigate to="/" replace />;
}

function App() {
  console.log("[App] Component rendering. Environment:", import.meta.env.MODE);
  console.log("[App] Current Location Hash:", window.location.hash);
  return (
    <AuthProvider>
      <ToastProvider>
        <ChatProvider>
          <Router>
            <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
              <AuthEventHandler />
              <Routes>
                {/* Public Routes */}
                <Route element={<PublicLayout />}>
                  <Route path="/" element={<Landing />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<SignUp />} />
                  <Route path="/email-confirmed" element={<EmailConfirmed />} />
                  <Route path="/auth/callback" element={<AuthCallback />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/update-password" element={<UpdatePassword />} />
                  <Route path="/pricing" element={<PricingPage />} />
                  <Route path="/onboarding" element={<Onboarding />} />
                  {/* Placeholders for public links */}
                  <Route path="/about" element={<Navigate to="/#about-us" replace />} />
                  <Route path="/features" element={<Navigate to="/#features" replace />} />
                  <Route path="/how-it-works" element={<Navigate to="/#how-it-works" replace />} />
                </Route>





                {/* Admin Route (Standalone) - Protected */}
                <Route path="/admin" element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                } />

                {/* Dashboard Routes */}
                <Route path="/dashboard" element={<DashboardLayout />}>
                  {/* Default redirect to investor dashboard */}
                  <Route index element={<Navigate to="/dashboard/investor" replace />} />

                  {/* Investor Dashboard & Routes */}
                  <Route path="investor" element={<InvestorHome />} />
                  <Route path="investor/history" element={<HistoryPage />} />
                  <Route path="investor/messages" element={<MessagesPage />} />
                  <Route path="investor/profile" element={<InvestorProfile />} />
                  <Route path="investor/cheatsheet" element={<CheatSheetPage />} />
                  <Route path="investor/:id" element={<InvestorPublicProfile />} />

                  {/* Startup Dashboard & Routes */}
                  <Route path="startup" element={<StartupHome />} />
                  <Route path="startup/history" element={<StartupHistoryPage />} />
                  <Route path="startup/messages" element={<MessagesPage />} />
                  <Route path="startup/profile" element={<StartupProfile />} />
                  <Route path="startup/analytics" element={<StartupAnalyticsPage />} />
                  <Route path="startup/cheatsheet" element={<StartupCheatSheetPage />} />

                  {/* Shared Routes - Keep for fallbacks or generic access */}
                  <Route path="pricing" element={<DashboardPricing />} />
                  <Route path="cheatsheet" element={<Navigate to="investor/cheatsheet" replace />} />
                </Route>

                {/* Redirect unknown to landing, but save auth fragments */}
                <Route path="*" element={<CatchAll />} />

              </Routes>
            </Suspense>
            <ChatDialog />
          </Router>
        </ChatProvider>
      </ToastProvider>
    </AuthProvider>
  )
}

export default App
