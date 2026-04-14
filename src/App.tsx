import { Suspense } from "react"
import { HelmetProvider } from 'react-helmet-async'
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
import { LoadingScreen } from "./components/ui/LoadingScreen"
import { LogoSplashScreen } from "./components/ui/LogoSplashScreen"
import { useState, useEffect } from "react"
import { AnimatePresence } from "framer-motion"

// Lazy load pages for code splitting with reload-on-failure logic
const Landing = lazyWithRetry(() => import("./pages/Landing"))
const Login = lazyWithRetry(() => import("./pages/auth/Login"))
const SignUp = lazyWithRetry(() => import("./pages/auth/SignUp"))
const ForgotPassword = lazyWithRetry(() => import("./pages/auth/ForgotPassword"))
const UpdatePassword = lazyWithRetry(() => import("./pages/auth/UpdatePassword"))
const InvestorHome = lazyWithRetry(() => import("./pages/dashboard/InvestorHome"))
const StartupHome = lazyWithRetry(() => import("./pages/dashboard/StartupHome"))
const HistoryPage = lazyWithRetry(() => import("./pages/dashboard/HistoryPage"))
const StartupHistoryPage = lazyWithRetry(() => import("./pages/dashboard/StartupHistoryPage"))
const MessagesPage = lazyWithRetry(() => import("./pages/dashboard/MessagesPage"))
const CheatSheetPage = lazyWithRetry(() => import("./pages/dashboard/CheatSheetPage"))
const StartupCheatSheetPage = lazyWithRetry(() => import("./pages/dashboard/StartupCheatSheetPage"))
const InvestorProfile = lazyWithRetry(() => import("./pages/dashboard/InvestorProfile"))
const StartupProfile = lazyWithRetry(() => import("./pages/dashboard/StartupProfile"))
const StartupAnalyticsPage = lazyWithRetry(() => import("./pages/dashboard/startup/AnalyticsPage"))
const AdminDashboard = lazyWithRetry(() => import("./pages/AdminDashboard"))
const PricingPage = lazyWithRetry(() => import("./pages/PricingPage"))
const DashboardPricing = lazyWithRetry(() => import("./pages/dashboard/DashboardPricing"))
const InvestorPublicProfile = lazyWithRetry(() => import("./pages/dashboard/investor/InvestorPublicProfile"))
const EmailConfirmed = lazyWithRetry(() => import("./pages/auth/EmailConfirmed"))
const Onboarding = lazyWithRetry(() => import("./pages/auth/Onboarding"))
const AuthCallback = lazyWithRetry(() => import("./pages/auth/AuthCallback"))
const StartupPublicProfile = lazyWithRetry(() => import("./pages/dashboard/startup/StartupPublicProfile"))
const FounderGPT = lazyWithRetry(() => import("./pages/dashboard/FounderGPT"))
const KasbStudio = lazyWithRetry(() => import("./pages/dashboard/KasbStudio"))
const CustomChatbotRequest = lazyWithRetry(() => import("./pages/dashboard/CustomChatbotRequest"))

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
    return <LoadingScreen />;
  }

  // 2. If we are still loading, show a subtle loading state
  if (loading) {
    return <LoadingScreen />;
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
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    if (showSplash) {
      // Auto-hide splash after a fixed delay
      const timer = setTimeout(() => {
        setShowSplash(false);
      }, 3500); // 3.5s cinematic duration
      return () => clearTimeout(timer);
    }
  }, [showSplash]);

  console.log("[App.tsx] Component rendering. Environment:", import.meta.env.MODE);
  console.log("[App.tsx] Current Location Hash:", window.location.hash);
  console.log("[App.tsx] Base URL:", import.meta.env.BASE_URL);
  
  return (
    <HelmetProvider>
      <AnimatePresence mode="wait">
        {showSplash ? (
          <LogoSplashScreen key="splash" onComplete={() => setShowSplash(false)} />
        ) : (
          <AuthProvider key="auth-provider">
            <ToastProvider>
              <ChatProvider>
                <Router>
                  <Suspense fallback={<LoadingScreen />}>
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
                      <Route path="/admin-portal-v3x8z1" element={
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
                        <Route path="startup/foundergpt" element={<FounderGPT />} />
                        <Route path="startup/studio" element={<KasbStudio />} />
                        <Route path="startup/:id" element={<StartupPublicProfile />} />

                        {/* Shared Routes - Keep for fallbacks or generic access */}
                        <Route path="custom-chatbot" element={<CustomChatbotRequest />} />
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
        )}
      </AnimatePresence>
    </HelmetProvider>
  )
}

export default App
