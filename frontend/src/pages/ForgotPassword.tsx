import { useState } from "react";
import { 
  Mail, ArrowLeft, KeyRound, Eye, EyeOff, Loader 
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import {
  forgotPassword,
  verifyOTPResetPassword,
  resetPassword,
} from "../services/service";

interface ForgotPasswordProps {
  onBackToLogin: () => void;
}

type Step = "email" | "otp" | "newPassword";

export default function ForgotPassword({ onBackToLogin }: ForgotPasswordProps) {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return toast.error("Please enter your email");

    try {
      setLoading(true);
      await forgotPassword(email);
      toast.success("OTP sent to your email 📩");
      setStep("otp");
    } catch (error) {
      toast.error("Email not found ❌");
    } finally {
      setLoading(false);
    }
  };

  const handleOTPVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return toast.error("Please enter the OTP");

    try {
      setLoading(true);
      await verifyOTPResetPassword(email, otp);
      toast.success("OTP verified successfully ✅");
      setStep("newPassword");
    } catch (error) {
      toast.error("Invalid OTP ❌");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match ❌");
      return;
    }

    try {
      setLoading(true);
      await resetPassword(email, password, confirmPassword);
      toast.success("Password reset successful 🎉");
      toast.success("Password updated successfully ✅");
      onBackToLogin();
    } catch (error) {
      toast.error("Password reset failed ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cover bg-center p-4"
      style={{
        backgroundImage: "url('doll.jpg')",
      }}
    >
      <Toaster position="top-right" reverseOrder={false} />
      <div className="bg-white/50 backdrop-blur-lg rounded-2xl shadow-2xl w-full max-w-lg p-10 transition duration-500 ease-in-out">
        <button
          onClick={onBackToLogin}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition duration-300 ease-in-out"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to login
        </button>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Reset Password</h1>
          <p className="text-gray-600">
            {step === "email" && "Enter your email to receive an OTP"}
            {step === "otp" && "Enter the OTP sent to your email"}
            {step === "newPassword" && "Enter your new password"}
          </p>
        </div>

        <div className={`transition-all duration-500 ${step === 'email' ? 'opacity-100' : 'opacity-0'}`}>
          {step === "email" && (
            <form onSubmit={handleEmailSubmit} className="space-y-6">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="you@example.com"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 text-white p-3 rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? <Loader className="animate-spin" /> : "Send OTP"}
              </button>
            </form>
          )}
        </div>

        <div className={`transition-all duration-500 ${step === 'otp' ? 'opacity-100' : 'opacity-0'}`}>
          {step === "otp" && (
            <form onSubmit={handleOTPVerify} className="space-y-6">
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="Enter 6-digit OTP"
                required
                maxLength={6}
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 text-white p-3 rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? <Loader className="animate-spin" /> : "Verify OTP"}
              </button>
            </form>
          )}
        </div>

        <div className={`transition-all duration-500 ${step === 'newPassword' ? 'opacity-100' : 'opacity-0'}`}>
          {step === "newPassword" && (
            <form onSubmit={handlePasswordReset} className="space-y-6">
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Enter new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>

              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 pr-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Confirm new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                >
                  {showConfirmPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 text-white p-3 rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? <Loader className="animate-spin" /> : "Reset Password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
