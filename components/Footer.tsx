import Link from "next/link";
import { FaTwitter, FaFacebookF, FaInstagram, FaLinkedinIn, FaGithub, FaYoutube } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 border-t border-gray-800">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div>
            <Link href="/" className="inline-block mb-4">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                Pixelift
              </h3>
            </Link>
            <p className="text-gray-400 text-sm mb-4">
              AI-powered image upscaling and enhancement. Transform your images with cutting-edge technology.
            </p>
            {/* Social Media Links */}
            <div className="flex gap-3">
              <a
                href="https://x.com/pixelift"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition text-gray-400 hover:text-white"
                aria-label="X (Twitter)"
              >
                <FaXTwitter className="w-5 h-5" />
              </a>
              <a
                href="https://facebook.com/pixelift"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition text-gray-400 hover:text-white"
                aria-label="Facebook"
              >
                <FaFacebookF className="w-5 h-5" />
              </a>
              <a
                href="https://instagram.com/pixelift"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition text-gray-400 hover:text-white"
                aria-label="Instagram"
              >
                <FaInstagram className="w-5 h-5" />
              </a>
              <a
                href="https://linkedin.com/company/pixelift"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition text-gray-400 hover:text-white"
                aria-label="LinkedIn"
              >
                <FaLinkedinIn className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="font-semibold text-white mb-4">Product</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/dashboard" className="text-gray-400 hover:text-white transition text-sm">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-gray-400 hover:text-white transition text-sm">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/dashboard/api" className="text-gray-400 hover:text-white transition text-sm">
                  API Documentation
                </Link>
              </li>
              <li>
                <a href="#use-cases" className="text-gray-400 hover:text-white transition text-sm">
                  Use Cases
                </a>
              </li>
              <li>
                <a href="#faq" className="text-gray-400 hover:text-white transition text-sm">
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-semibold text-white mb-4">Company</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-gray-400 hover:text-white transition text-sm">
                  About Us
                </Link>
              </li>
              <li>
                <a href="mailto:contact@pixelift.pl" className="text-gray-400 hover:text-white transition text-sm">
                  Contact
                </a>
              </li>
              <li>
                <a href="/blog" className="text-gray-400 hover:text-white transition text-sm">
                  Blog
                </a>
              </li>
              <li>
                <a href="mailto:support@pixelift.pl" className="text-gray-400 hover:text-white transition text-sm">
                  Support
                </a>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/terms" className="text-gray-400 hover:text-white transition text-sm">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-400 hover:text-white transition text-sm">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <a href="/cookies" className="text-gray-400 hover:text-white transition text-sm">
                  Cookie Policy
                </a>
              </li>
              <li>
                <a href="/gdpr" className="text-gray-400 hover:text-white transition text-sm">
                  GDPR Compliance
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">
              © {currentYear} Pixelift. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm">
              <span className="text-gray-500">Made with ❤️ in Poland</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Powered by</span>
                <a
                  href="https://replicate.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition"
                >
                  Replicate AI
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
