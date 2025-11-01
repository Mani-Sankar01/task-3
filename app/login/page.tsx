"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { redirect, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function LoginPage() {
  const [phone, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const session = useSession();

  useEffect(() => {
    if (session?.data?.user) {
      router.push("/");
    }
  }, [session, router]);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      // Call our API to request OTP
      const response = await fetch(
        `${process.env.BACKEND_API_URL}/api/auth/request_otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ phone }),
        }
      );

      const data = await response.json();
      
      if (!response.ok) {
        setError(data.message || data.error || "Failed to send OTP");
        return;
      }

      // Also call NextAuth to set up the session (but don't authenticate yet)
      await signIn("credentials", {
        phone: phone,
        step: "requestOTP",
        redirect: false,
      });

      setStep("otp");
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || "An error occurred. Please try again.";
      setError(errorMessage);
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        phone,
        otp,
        step: "verifyOTP",
        redirect: false,
      });

      if (result?.error) {
        setError(result.error || "Invalid OTP. Please try again.");
      } else {
        // Redirect to dashboard or home page
        router.push("/");
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || "An error occurred. Please try again.";
      setError(errorMessage);
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left side - Image (hidden on mobile) */}
      <div className="hidden md:block md:w-1/2 bg-slate-900">
        <div className="relative h-full w-full">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-800/80 to-blue-900/90 z-10"></div>
          <img
            src="https://images.unsplash.com/photo-1515018403349-872e8206d50a?q=80&w=1999&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            alt="Login illustration"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20 p-12">
            <div className="">
              <h1 className="text-4xl text-center font-bold text-white mb-6">
                Welcome Back
              </h1>
              <p className="text-slate-300 text-center max-w-md">
                Sign in to your account to access your personalized dashboard
              </p>
            </div>
            <p className="text-slate-400 text-left font-light text-[12px] max-w-md mt-8">
              ©Copyright - Tandur Stone Merchant Welfare Association
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Forms (full width and centered on mobile) */}
      <div className="flex flex-1 items-center justify-center p-4 sm:p-6 md:p-12 bg-white md:w-1/2">
        <Card>
          <div className="w-full max-w-md  p-6 sm:p-8">
            <div className="mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                Login
              </h2>
              <p className="text-slate-500 mt-2">
                {step === "phone"
                  ? "Enter your phone number to receive a verification code"
                  : "Enter the verification code sent to your phone"}
              </p>
            </div>

            {error && (
              <div className="mb-6 rounded-md bg-red-50 p-4 text-sm text-red-700 border border-red-200">
                {error}
              </div>
            )}

            {step === "phone" ? (
              <form onSubmit={handleSendOTP} className="space-y-6">
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-slate-700 mb-1"
                  >
                    Phone Number
                  </label>
                  <input
                    id="phone"
                    type="text"
                    value={phone}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="block w-full rounded-md border border-slate-300 px-4 py-3 shadow-sm focus:border-slate-500 focus:ring-slate-500 focus:outline-none"
                    placeholder="Enter your phone number"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full rounded-md"
                  disabled={isLoading}
                >
                  {isLoading ? "Sending..." : "Send OTP"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP} className="space-y-6">
                <div>
                  <label
                    htmlFor="otp"
                    className="block text-sm font-medium text-slate-700 mb-1"
                  >
                    Verification Code
                  </label>
                  <input
                    id="otp"
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="block w-full rounded-md border border-slate-300 px-4 py-3 shadow-sm focus:border-slate-500 focus:ring-slate-500 focus:outline-none"
                    placeholder="Enter the OTP sent to your phone"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full rounded-md"
                  disabled={isLoading}
                >
                  {isLoading ? "Verifying..." : "Verify OTP"}
                </Button>
                <button
                  type="button"
                  onClick={() => setStep("phone")}
                  className="w-full text-center py-2 text-sm text-slate-600 hover:text-slate-900 transition-colors mt-2"
                >
                  Back to Phone Number
                </button>
              </form>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
