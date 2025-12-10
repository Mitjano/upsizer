"use client";

import { FaFacebookF, FaInstagram, FaLinkedinIn } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const t = useTranslations('footer');

  return (
    <footer className="bg-gray-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div>
            <Link href="/" className="inline-block mb-4">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                Pixelift
              </h3>
            </Link>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
              {t('description')}
            </p>
            {/* Social Media Links */}
            <div className="flex gap-3">
              <a
                href="https://x.com/pixelift"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 flex items-center justify-center transition text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                aria-label="X (Twitter)"
              >
                <FaXTwitter className="w-5 h-5" />
              </a>
              <a
                href="https://facebook.com/pixelift"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 flex items-center justify-center transition text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                aria-label="Facebook"
              >
                <FaFacebookF className="w-5 h-5" />
              </a>
              <a
                href="https://instagram.com/pixelift"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 flex items-center justify-center transition text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                aria-label="Instagram"
              >
                <FaInstagram className="w-5 h-5" />
              </a>
              <a
                href="https://linkedin.com/company/pixelift"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 flex items-center justify-center transition text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                aria-label="LinkedIn"
              >
                <FaLinkedinIn className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">{t('product.title')}</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/dashboard" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition text-sm">
                  {t('product.dashboard')}
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition text-sm">
                  {t('product.pricing')}
                </Link>
              </li>
              <li>
                <Link href="/dashboard/api" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition text-sm">
                  {t('product.apiDocs')}
                </Link>
              </li>
              <li>
                <Link href="/use-cases" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition text-sm">
                  {t('product.useCases')}
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition text-sm">
                  {t('product.faq')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">{t('company.title')}</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition text-sm">
                  {t('company.about')}
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition text-sm">
                  {t('company.blog')}
                </Link>
              </li>
              <li>
                <Link href="/knowledge" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition text-sm">
                  {t('company.knowledge')}
                </Link>
              </li>
              <li>
                <Link href="/support" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition text-sm">
                  {t('company.support')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">{t('legal.title')}</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/terms" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition text-sm">
                  {t('legal.terms')}
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition text-sm">
                  {t('legal.privacy')}
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition text-sm">
                  {t('legal.cookies')}
                </Link>
              </li>
              <li>
                <Link href="/gdpr" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition text-sm">
                  {t('legal.gdpr')}
                </Link>
              </li>
              <li>
                <Link href="/refund" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition text-sm">
                  {t('legal.refund')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-200 dark:border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">
              {t('copyright', { year: currentYear })}
            </p>
            <div className="flex items-center gap-6 text-sm">
              <span className="text-gray-500">{t('madeWith')}</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">{t('poweredBy')}</span>
                <span className="text-transparent bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text font-semibold">
                  Pixelift AI
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
