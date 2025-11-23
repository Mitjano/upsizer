import { FcGoogle } from "react-icons/fc";
import Link from "next/link";
import { signIn } from "@/lib/auth";

async function handleGoogleSignUp() {
  "use server";
  await signIn("google", { redirectTo: "/dashboard" });
}

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Header with Login Link */}
        <div className="flex justify-between items-center mb-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg"></div>
            <span className="text-2xl font-bold text-gray-900">Pixelift</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-gray-600 text-sm">Already have an account?</span>
            <Link
              href="/auth/signin"
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-full text-sm font-medium transition"
            >
              Login
            </Link>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-xl p-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Sign up</h1>

          {/* Google Sign Up Button */}
          <form action={handleGoogleSignUp} className="mb-6">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-700 py-3.5 px-6 rounded-xl font-medium transition shadow-sm hover:shadow"
            >
              <FcGoogle className="text-2xl" />
              <span className="text-purple-700 font-semibold">Continue with Google</span>
            </button>
          </form>

          {/* Footer Text */}
          <p className="text-center text-sm text-gray-500 mt-8">
            By continuing, you agree to Pixelift's{" "}
            <Link href="/privacy" className="text-purple-600 hover:underline font-medium">
              Privacy Policy
            </Link>{" "}
            and{" "}
            <Link href="/terms" className="text-purple-600 hover:underline font-medium">
              Terms of Use
            </Link>
          </p>
        </div>

        {/* Bottom Help Text */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Create your account instantly with Google. No password required.
        </p>
      </div>
    </div>
  );
}
