import { FcGoogle } from "react-icons/fc";
import Link from "next/link";
import { signIn } from "@/lib/auth";

async function handleGoogleSignIn(formData: FormData) {
  "use server";
  const callbackUrl = formData.get("callbackUrl") as string || "/dashboard";
  await signIn("google", { redirectTo: callbackUrl });
}

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string }> }) {
  const params = await searchParams;
  const callbackUrl = params.callbackUrl || "/dashboard";
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex min-h-screen items-center justify-center">
          <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Branding & Stats */}
            <div className="hidden lg:block space-y-8">
              <Link href="/" className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-xl"></div>
                <span className="text-3xl font-bold">Pixelift</span>
              </Link>

              <div>
                <h1 className="text-5xl font-bold mb-4 leading-tight">
                  Welcome back to{" "}
                  <span className="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                    Pixelift
                  </span>
                </h1>
                <p className="text-xl text-gray-400">
                  Continue enhancing your images with professional AI tools
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">🚀</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Fast & Reliable</h3>
                    <p className="text-gray-400">Process hundreds of images with consistent quality</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">💎</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Premium Quality</h3>
                    <p className="text-gray-400">AI-powered upscaling that preserves every detail</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">🔒</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Secure & Private</h3>
                    <p className="text-gray-400">Your images are processed securely and deleted after 24h</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-2xl p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex -space-x-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 border-2 border-gray-900"></div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border-2 border-gray-900"></div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 border-2 border-gray-900"></div>
                  </div>
                  <div className="text-sm">
                    <div className="font-semibold">10,000+ users</div>
                    <div className="text-gray-400">trust Pixelift</div>
                  </div>
                </div>
                <p className="text-sm text-gray-300 italic">
                  "The best AI image upscaler I've ever used. The results are simply amazing!"
                </p>
              </div>
            </div>

            {/* Right Side - Signin Form */}
            <div className="w-full">
              {/* Mobile Logo */}
              <Link href="/" className="flex lg:hidden items-center justify-center gap-3 mb-8">
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-xl"></div>
                <span className="text-3xl font-bold">Pixelift</span>
              </Link>

              <div className="bg-gray-800/50 backdrop-blur-xl rounded-3xl border border-gray-700/50 p-8 lg:p-10 shadow-2xl">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold mb-2">Sign in to your account</h2>
                  <p className="text-gray-400">Welcome back! Please enter your details</p>
                </div>

                {/* Google Sign In Button */}
                <form action={handleGoogleSignIn} className="space-y-4">
                  <input type="hidden" name="callbackUrl" value={callbackUrl} />
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 hover:bg-gray-50 py-4 px-6 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <FcGoogle className="text-2xl" />
                    Continue with Google
                  </button>
                </form>

                <div className="my-6 flex items-center gap-4">
                  <div className="flex-1 h-px bg-gray-700"></div>
                  <span className="text-sm text-gray-500">Secure Login</span>
                  <div className="flex-1 h-px bg-gray-700"></div>
                </div>

                {/* Info */}
                <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4 mb-6">
                  <p className="text-sm text-gray-300 text-center">
                    Sign in with your Google account to access your dashboard and continue where you left off
                  </p>
                </div>

                {/* Sign Up Link */}
                <div className="pt-6 border-t border-gray-700">
                  <p className="text-center text-sm text-gray-400">
                    Don't have an account?{" "}
                    <Link href="/auth/signup" className="text-green-400 hover:text-green-300 font-semibold">
                      Sign up for free →
                    </Link>
                  </p>
                </div>
              </div>

              {/* Terms */}
              <p className="text-center text-xs text-gray-500 mt-6">
                By signing in, you agree to our{" "}
                <Link href="/terms" className="hover:underline hover:text-gray-400">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="hover:underline hover:text-gray-400">
                  Privacy Policy
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
