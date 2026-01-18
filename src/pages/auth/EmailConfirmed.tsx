import { Button } from "../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../../components/ui/card"
import { CheckCircle2 } from "lucide-react"
import { Link } from "react-router-dom"
import { motion } from "framer-motion"

export function EmailConfirmed() {
    return (
        <div className="min-h-screen bg-gray-50/50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md"
            >
                <div className="text-center mb-8">
                    <Link to="/" className="inline-block text-2xl font-black tracking-tighter hover:scale-105 transition-transform">
                        KASB.AI
                    </Link>
                </div>

                <Card className="border-0 shadow-2xl rounded-[2.5rem] bg-white text-center overflow-hidden">
                    <CardHeader className="pt-10 pb-2">
                        <div className="mx-auto mb-6 bg-green-100 p-4 rounded-full h-20 w-20 flex items-center justify-center text-green-600">
                            <CheckCircle2 className="h-10 w-10" />
                        </div>
                        <CardTitle className="text-3xl font-extrabold tracking-tight">Email Confirmed!</CardTitle>
                        <CardDescription className="text-gray-500 font-medium text-lg mt-2">
                            Your account has been successfully verified.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 px-8">
                        <p className="text-gray-600">
                            You can now log in with your credentials to access your dashboard.
                        </p>
                    </CardContent>
                    <CardFooter className="p-8 pt-4">
                        <Link to="/login" className="w-full">
                            <Button className="w-full h-14 rounded-2xl text-base font-bold bg-black text-white hover:bg-gray-800 shadow-xl transition-all active:scale-[0.98]">
                                Continue to Login
                            </Button>
                        </Link>
                    </CardFooter>
                </Card>
            </motion.div>
        </div>
    )
}
