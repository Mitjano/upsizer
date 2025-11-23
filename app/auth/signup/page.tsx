import { FcGoogle } from "react-icons/fc";
import Link from "next/link";
import { signIn } from "@/lib/auth";

async function handleGoogleSignUp() {
  "use server";
  await signIn("google", { redirectTo: "/dashboard" });
}

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg"></div>
          <span className="text-2xl font-bold">Pixelift</span>
        </Link>

        {/* Card */}
        <div className="bg-gray-800/50 rounded-2xl border border-gray-700 p-8">
          <h1 className="text-3xl font-bold text-center mb-2">Create Account</h1>
          <p className="text-gray-400 text-center mb-8">
            Get started with Pixelift today
          </p>

          {/* Google Sign Up - Server Action Approach */}
          <form action={handleGoogleSignUp}>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 hover:bg-gray-100 py-3 px-6 rounded-lg font-medium transition"
            >
              <FcGoogle className="text-2xl" />
              Continue with Google
            </button>
          </form>

          {/* Info */}
          <p className="text-center text-sm text-gray-400 mt-6">
            Create your account instantly with Google. No password required.
          </p>

          {/* Sign In Link */}
          <div className="mt-6 pt-6 border-t border-gray-700">
            <p className="text-center text-sm text-gray-400">
              Already have an account?{" "}
              <Link href="/auth/signin" className="text-green-400 hover:text-green-300 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Terms */}
        <p className="text-center text-xs text-gray-500 mt-6">
          By continuing, you agree to our{" "}
          <Link href="/terms" className="hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="hover:underline">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}
