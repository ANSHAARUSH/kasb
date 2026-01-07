import { lazy, Suspense } from "react"
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { AdminRoute } from "./components/admin/AdminRoute"
import { PublicLayout } from "./layouts/PublicLayout"
import { DashboardLayout } from "./layouts/DashboardLayout"

// Lazy load pages for code splitting
const Landing = lazy(() => import("./pages/Landing").then(m => ({ default: m.Landing })))
const Login = lazy(() => import("./pages/auth/Login").then(m => ({ default: m.Login })))
const SignUp = lazy(() => import("./pages/auth/SignUp").then(m => ({ default: m.SignUp })))
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword").then(m => ({ default: m.ForgotPassword })))
const UpdatePassword = lazy(() => import("./pages/auth/UpdatePassword").then(m => ({ default: m.UpdatePassword })))
const InvestorHome = lazy(() => import("./pages/dashboard/InvestorHome").then(m => ({ default: m.InvestorHome })))
const StartupHome = lazy(() => import("./pages/dashboard/StartupHome").then(m => ({ default: m.StartupHome })))
const HistoryPage = lazy(() => import("./pages/dashboard/HistoryPage").then(m => ({ default: m.HistoryPage })))
const StartupHistoryPage = lazy(() => import("./pages/dashboard/StartupHistoryPage").then(m => ({ default: m.StartupHistoryPage })))
const MessagesPage = lazy(() => import("./pages/dashboard/MessagesPage").then(m => ({ default: m.MessagesPage })))
const CheatSheetPage = lazy(() => import("./pages/dashboard/CheatSheetPage").then(m => ({ default: m.CheatSheetPage })))
const StartupCheatSheetPage = lazy(() => import("./pages/dashboard/StartupCheatSheetPage").then(m => ({ default: m.StartupCheatSheetPage })))
const InvestorProfile = lazy(() => import("./pages/dashboard/InvestorProfile").then(m => ({ default: m.InvestorProfile })))
const StartupProfile = lazy(() => import("./pages/dashboard/StartupProfile").then(m => ({ default: m.StartupProfile })))
const AdminDashboard = lazy(() => import("./pages/AdminDashboard").then(m => ({ default: m.AdminDashboard })))

import { AuthProvider } from "./context/AuthContext"
import { ToastProvider } from "./components/ui/use-toast"

import { ChatProvider } from "./context/ChatContext"
import { ChatDialog } from "./components/chat/ChatDialog"
import { AuthEventHandler } from "./components/auth/AuthEventHandler"

function App() {
  console.log("App component rendering");
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
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/update-password" element={<UpdatePassword />} />
                  {/* Placeholders for public links */}
                  <Route path="/about" element={<Navigate to="/#about-us" replace />} />
                  <Route path="/features" element={<Navigate to="/#features" replace />} />
                  <Route path="/how-it-works" element={<Navigate to="/#how-it-works" replace />} />
                </Route>



                // ... imports ...

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

                  {/* Startup Dashboard & Routes */}
                  <Route path="startup" element={<StartupHome />} />
                  <Route path="startup/history" element={<StartupHistoryPage />} />
                  <Route path="startup/messages" element={<MessagesPage />} />
                  <Route path="startup/profile" element={<StartupProfile />} />
                  <Route path="startup/cheatsheet" element={<StartupCheatSheetPage />} />

                  {/* Shared Routes - Keep for fallbacks or generic access */}
                  <Route path="cheatsheet" element={<Navigate to="investor/cheatsheet" replace />} />
                </Route>

                {/* Redirect unknown to landing */}
                <Route path="*" element={<Navigate to="/" replace />} />

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
