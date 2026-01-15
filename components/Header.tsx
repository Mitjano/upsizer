"use client";

import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import LanguageSwitcher from './LanguageSwitcher';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';
import { useTheme } from '@/contexts/ThemeContext';

// Tool icons
const toolIcons = {
  upscaler: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
    </svg>
  ),
  removeBackground: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  colorize: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
    </svg>
  ),
  restore: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  objectRemoval: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
  backgroundGenerator: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  ),
  compressor: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  ),
  packshot: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  productShot: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  expand: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
    </svg>
  ),
  styleTransfer: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
    </svg>
  ),
  inpainting: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  ),
  reimagine: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  structureControl: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  formatConverter: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
    </svg>
  ),
  // New Edit Tools
  cropImage: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18h12M6 6h12M6 6v12m12-12v12" />
    </svg>
  ),
  resizeImage: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
    </svg>
  ),
  imageFilters: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
    </svg>
  ),
  collageMaker: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 11a1 1 0 011-1h4a1 1 0 011 1v8a1 1 0 01-1 1h-4a1 1 0 01-1-1v-8z" />
    </svg>
  ),
  // Generate Tools
  logoMaker: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
    </svg>
  ),
  textEffects: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  // Utilities Tools
  qrGenerator: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0-3h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
    </svg>
  ),
  // Transform Tools
  vectorize: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
    </svg>
  ),
  portraitRelight: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  watermarkRemover: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
    </svg>
  ),
};

// Tool categories for mega menu
const toolCategories = [
  {
    id: 'enhance',
    labelKey: 'toolCategories.enhance',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    tools: [
      { key: 'upscaler', href: '/tools/upscaler', color: 'from-purple-500 to-purple-600' },
      { key: 'restore', href: '/tools/restore', color: 'from-cyan-500 to-blue-600' },
      { key: 'colorize', href: '/tools/colorize', color: 'from-violet-500 to-purple-600' },
      { key: 'portraitRelight', href: '/tools/portrait-relight', color: 'from-amber-500 to-orange-600' },
    ],
  },
  {
    id: 'edit',
    labelKey: 'toolCategories.edit',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
    tools: [
      { key: 'cropImage', href: '/tools/crop-image', color: 'from-green-500 to-emerald-600' },
      { key: 'resizeImage', href: '/tools/resize-image', color: 'from-blue-500 to-cyan-600' },
      { key: 'imageFilters', href: '/tools/image-filters', color: 'from-pink-500 to-rose-600' },
      { key: 'collageMaker', href: '/tools/collage', color: 'from-orange-500 to-amber-600' },
    ],
  },
  {
    id: 'remove',
    labelKey: 'toolCategories.remove',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    ),
    tools: [
      { key: 'removeBackground', href: '/tools/remove-background', color: 'from-blue-500 to-blue-600' },
      { key: 'objectRemoval', href: '/tools/object-removal', color: 'from-orange-500 to-red-600' },
      { key: 'watermarkRemover', href: '/tools/watermark-remover', color: 'from-amber-500 to-orange-600' },
    ],
  },
  {
    id: 'generate',
    labelKey: 'toolCategories.generate',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
    tools: [
      { key: 'productShot', href: '/tools/ai-background-generator', color: 'from-amber-500 to-orange-600' },
      { key: 'expand', href: '/tools/image-expand', color: 'from-indigo-500 to-indigo-600' },
      { key: 'inpainting', href: '/tools/inpainting', color: 'from-emerald-500 to-teal-600' },
      { key: 'logoMaker', href: '/tools/logo-maker', color: 'from-violet-500 to-purple-600' },
      { key: 'textEffects', href: '/tools/text-effects', color: 'from-cyan-500 to-blue-600' },
    ],
  },
  {
    id: 'transform',
    labelKey: 'toolCategories.transform',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
    tools: [
      { key: 'styleTransfer', href: '/tools/style-transfer', color: 'from-pink-500 to-purple-600' },
      { key: 'reimagine', href: '/tools/reimagine', color: 'from-violet-500 to-indigo-600' },
      { key: 'structureControl', href: '/tools/structure-control', color: 'from-amber-500 to-red-600' },
      { key: 'vectorize', href: '/tools/vectorize', color: 'from-teal-500 to-emerald-600' },
    ],
  },
  {
    id: 'utilities',
    labelKey: 'toolCategories.utilities',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    tools: [
      { key: 'compressor', href: '/tools/image-compressor', color: 'from-teal-500 to-cyan-600' },
      { key: 'formatConverter', href: '/tools/format-converter', color: 'from-emerald-500 to-teal-600' },
      { key: 'qrGenerator', href: '/tools/qr-generator', color: 'from-gray-500 to-gray-700' },
    ],
  },
];

// Flatten tools for keyboard navigation
const toolConfigs = toolCategories.flatMap(cat => cat.tools);

// User dropdown menu items
const userMenuItems = [
  { key: 'dashboard', href: '/dashboard' },
  { key: 'apiKeys', href: '/dashboard/api' },
  { key: 'settings', href: '/dashboard/settings' },
] as const;

export default function Header() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toolsDropdownOpen, setToolsDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileToolsExpanded, setMobileToolsExpanded] = useState(false);
  const t = useTranslations();
  const { theme, resolvedTheme, setTheme } = useTheme();

  // Refs for dropdown containers
  const toolsDropdownRef = useRef<HTMLDivElement>(null);
  const toolsButtonRef = useRef<HTMLButtonElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const userButtonRef = useRef<HTMLButtonElement>(null);

  // Check if we're on a tools page (accounting for locale prefix)
  const isToolsPage = pathname?.includes('/tools/');

  // Build categories with translated tools
  const categories = toolCategories.map(category => ({
    ...category,
    label: t.has(category.labelKey) ? t(category.labelKey) : category.id,
    tools: category.tools.map(tool => ({
      ...tool,
      name: t(`tools.${tool.key}.name`),
      description: t(`tools.${tool.key}.description`),
      badge: t.has(`tools.${tool.key}.badge`) ? t(`tools.${tool.key}.badge`) : undefined,
      icon: toolIcons[tool.key as keyof typeof toolIcons],
    })),
  }));

  // Flatten tools for keyboard navigation and mobile menu
  const tools = categories.flatMap(cat => cat.tools);

  // Keyboard navigation for tools dropdown
  const toolsNavigation = useKeyboardNavigation({
    itemCount: tools.length,
    isOpen: toolsDropdownOpen,
    onSelect: (index) => {
      // Navigate to tool - handled by Link click
      const link = document.querySelector(`[data-tool-index="${index}"]`) as HTMLAnchorElement;
      if (link) link.click();
    },
    onEscape: () => {
      setToolsDropdownOpen(false);
      toolsButtonRef.current?.focus();
    },
  });

  // Keyboard navigation for user dropdown (including sign out)
  const userNavigation = useKeyboardNavigation({
    itemCount: userMenuItems.length + 1, // +1 for sign out
    isOpen: userDropdownOpen,
    onSelect: (index) => {
      if (index < userMenuItems.length) {
        const link = document.querySelector(`[data-user-index="${index}"]`) as HTMLAnchorElement;
        if (link) link.click();
      } else {
        // Sign out
        signOut({ callbackUrl: "/" });
      }
    },
    onEscape: () => {
      setUserDropdownOpen(false);
      userButtonRef.current?.focus();
    },
  });

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolsDropdownRef.current && !toolsDropdownRef.current.contains(event.target as Node)) {
        setToolsDropdownOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle dropdown button keyboard events
  const handleDropdownKeyDown = useCallback(
    (event: React.KeyboardEvent, setOpen: (open: boolean) => void, isOpen: boolean) => {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        setOpen(true);
      } else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        setOpen(!isOpen);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
      }
    },
    []
  );

  return (
    <header className="border-b border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm sticky top-0 z-50 transition-colors">
      <nav className="container mx-auto px-4 py-4 flex items-center justify-between" role="navigation" aria-label="Main navigation">
        {/* Logo - fixed width for balance with right side (only on desktop) */}
        <Link href="/" className="flex items-center gap-2 xl:w-[200px] 2xl:w-[280px] shrink-0" aria-label="Pixelift home">
          <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg" aria-hidden="true"></div>
          <span className="text-xl font-bold text-gray-900 dark:text-white">Pixelift</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden xl:flex items-center justify-center flex-1 gap-3 2xl:gap-5 text-gray-700 dark:text-white">
          {/* Tools Dropdown */}
          <div className="relative" ref={toolsDropdownRef}>
            <button
              ref={toolsButtonRef}
              onClick={() => setToolsDropdownOpen((prev) => !prev)}
              onKeyDown={(e) => handleDropdownKeyDown(e, setToolsDropdownOpen, toolsDropdownOpen)}
              className={`flex items-center gap-1 transition font-medium py-2 text-sm whitespace-nowrap ${
                isToolsPage ? 'text-green-500 dark:text-green-400' : 'text-gray-700 dark:text-white hover:text-green-500 dark:hover:text-green-400'
              }`}
              aria-expanded={toolsDropdownOpen}
              aria-haspopup="menu"
              aria-controls="tools-menu"
            >
              {t('nav.tools')}
              <svg
                className={`w-4 h-4 transition-transform duration-200 ${toolsDropdownOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Mega Menu */}
            <div
              ref={toolsNavigation.containerRef}
              id="tools-menu"
              role="menu"
              aria-label="Tools menu"
              onKeyDown={toolsNavigation.handleKeyDown}
              tabIndex={toolsDropdownOpen ? 0 : -1}
              className={`fixed left-1/2 -translate-x-1/2 top-[70px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden transition-all duration-200 origin-top z-[9999] max-h-[calc(100vh-100px)] overflow-y-auto ${
                toolsDropdownOpen ? 'opacity-100 visible scale-100' : 'opacity-0 invisible scale-95 pointer-events-none'
              }`}
              style={{ width: 'min(1100px, calc(100vw - 32px))' }}
            >
              {/* 3x2 Grid Layout for Categories */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-0">
                {categories.map((category, catIndex) => {
                  // Calculate tool index offset for keyboard navigation
                  const toolIndexOffset = categories
                    .slice(0, catIndex)
                    .reduce((sum, cat) => sum + cat.tools.length, 0);

                  return (
                    <div
                      key={category.id}
                      className={`p-4 ${
                        // Add right border for all except last in row
                        (catIndex + 1) % 3 !== 0 ? 'md:border-r border-gray-100 dark:border-gray-800' : ''
                      } ${
                        // Add bottom border for first row
                        catIndex < 3 ? 'border-b border-gray-100 dark:border-gray-800' : ''
                      } ${
                        // Mobile: right border for odd columns
                        catIndex % 2 === 0 ? 'border-r md:border-r-0 border-gray-100 dark:border-gray-800' : ''
                      } ${
                        // Re-add md border-r where needed
                        (catIndex + 1) % 3 !== 0 ? 'md:border-r' : ''
                      }`}
                    >
                      {/* Category Header */}
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                          {category.icon}
                        </div>
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          {category.label}
                        </span>
                      </div>

                      {/* Category Tools */}
                      <div className="space-y-1">
                        {category.tools.map((tool, toolIndex) => {
                          const globalIndex = toolIndexOffset + toolIndex;
                          return (
                            <Link
                              key={tool.href}
                              href={tool.href}
                              role="menuitem"
                              data-tool-index={globalIndex}
                              onClick={() => setToolsDropdownOpen(false)}
                              className={`flex items-center gap-3 px-2 py-2 rounded-lg transition-all duration-150 group ${
                                pathname?.includes(tool.href)
                                  ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                                  : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                              } ${toolsNavigation.activeIndex === globalIndex ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
                            >
                              <div className={`p-1.5 rounded-lg bg-gradient-to-br ${tool.color} text-white shrink-0 transition-transform group-hover:scale-110`}>
                                <div className="w-4 h-4">{tool.icon}</div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium">{tool.name}</span>
                                  {tool.badge && (
                                    <span className="px-1.5 py-0.5 text-[9px] bg-green-500 text-white rounded font-semibold">
                                      {tool.badge}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer - All Tools Link */}
              <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-3 border-t border-gray-100 dark:border-gray-800">
                <Link
                  href="/tools"
                  onClick={() => setToolsDropdownOpen(false)}
                  className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-green-500 dark:hover:text-green-400 transition-colors font-medium"
                >
                  {t('nav.viewAllTools')}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>

          <Link
            href="/ai-image"
            className={`flex items-center gap-1 transition font-medium text-sm whitespace-nowrap ${
              pathname?.includes('/ai-image') ? 'text-purple-500 dark:text-purple-400' : 'text-gray-700 dark:text-white hover:text-purple-500 dark:hover:text-purple-400'
            }`}
          >
            <span className="text-xs" aria-hidden="true">✨</span>
            {t('nav.aiImage')}
          </Link>
          <Link
            href="/ai-video"
            className={`flex items-center gap-1 transition font-medium text-sm whitespace-nowrap ${
              pathname?.includes('/ai-video') ? 'text-cyan-500 dark:text-cyan-400' : 'text-gray-700 dark:text-white hover:text-cyan-500 dark:hover:text-cyan-400'
            }`}
          >
            <span className="text-xs" aria-hidden="true">🎬</span>
            {t('nav.aiVideo')}
          </Link>
          <Link
            href="/ai-chat"
            className={`flex items-center gap-1 transition font-medium text-sm whitespace-nowrap ${
              pathname?.includes('/ai-chat') ? 'text-green-500 dark:text-green-400' : 'text-gray-700 dark:text-white hover:text-green-500 dark:hover:text-green-400'
            }`}
          >
            <span className="text-xs" aria-hidden="true">💬</span>
            {t('nav.aiChat')}
          </Link>
          <Link
            href="/ai-agent"
            className={`flex items-center gap-1 transition font-medium text-sm whitespace-nowrap ${
              pathname?.includes('/ai-agent') ? 'text-cyan-500 dark:text-cyan-400' : 'text-gray-700 dark:text-white hover:text-cyan-500 dark:hover:text-cyan-400'
            }`}
          >
            <span className="text-xs" aria-hidden="true">🤖</span>
            {t('nav.aiAgent')}
            <span className="px-1.5 py-0.5 text-[9px] bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded font-semibold">PRO</span>
          </Link>
          <Link href="/pricing" className="text-gray-700 dark:text-white hover:text-green-500 dark:hover:text-green-400 transition text-sm whitespace-nowrap">
            {t('nav.pricing')}
          </Link>
          <Link href="/blog" className="text-gray-700 dark:text-white hover:text-green-500 dark:hover:text-green-400 transition text-sm whitespace-nowrap">
            {t('nav.blog')}
          </Link>
        </div>

        {/* Auth Buttons & Language Switcher - fixed width matching logo for balance (only on desktop) */}
        <div className="flex items-center justify-end gap-2 xl:gap-3 xl:w-[200px] 2xl:w-[280px] shrink-0">
          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            className="hidden xl:flex p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {resolvedTheme === 'dark' ? (
              <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          {/* Language Switcher */}
          <LanguageSwitcher />

          {status === "loading" ? (
            <div className="w-8 h-8 border-2 border-gray-300 dark:border-gray-600 border-t-green-500 rounded-full animate-spin" aria-label="Loading"></div>
          ) : session ? (
            <>
              <Link
                href="/dashboard"
                className="hidden xl:block px-3 py-2 text-gray-700 dark:text-white hover:text-green-500 dark:hover:text-green-400 transition text-sm"
              >
                {t('nav.dashboard')}
              </Link>
              <div className="relative" ref={userDropdownRef}>
                <button
                  ref={userButtonRef}
                  onClick={() => setUserDropdownOpen((prev) => !prev)}
                  onKeyDown={(e) => handleDropdownKeyDown(e, setUserDropdownOpen, userDropdownOpen)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                  aria-expanded={userDropdownOpen}
                  aria-haspopup="menu"
                  aria-controls="user-menu"
                  aria-label={`User menu for ${session.user?.name || 'User'}`}
                >
                  {session.user?.image ? (
                    <Image
                      src={session.user.image}
                      alt=""
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full"
                      aria-hidden="true"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white" aria-hidden="true">
                      {session.user?.name?.[0] || "U"}
                    </div>
                  )}
                  <span className="hidden md:block text-gray-900 dark:text-white">
                    {session.user?.name?.split(" ")[0]}
                  </span>
                </button>

                {/* User Dropdown */}
                <div
                  ref={userNavigation.containerRef}
                  id="user-menu"
                  role="menu"
                  aria-label="User menu"
                  onKeyDown={userNavigation.handleKeyDown}
                  tabIndex={userDropdownOpen ? 0 : -1}
                  className={`absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl transition-all duration-200 z-[9999] overflow-hidden ${
                    userDropdownOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
                  }`}
                >
                  {userMenuItems.map((item, index) => (
                    <Link
                      key={item.key}
                      href={item.href}
                      role="menuitem"
                      data-user-index={index}
                      onClick={() => setUserDropdownOpen(false)}
                      className={`block px-4 py-2 text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition ${
                        userNavigation.activeIndex === index ? 'bg-gray-100 dark:bg-gray-700' : ''
                      }`}
                    >
                      {t(`nav.${item.key}`)}
                    </Link>
                  ))}
                  <hr className="border-gray-200 dark:border-gray-700" />
                  <button
                    role="menuitem"
                    data-user-index={userMenuItems.length}
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className={`w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition text-red-500 dark:text-red-400 ${
                      userNavigation.activeIndex === userMenuItems.length ? 'bg-gray-100 dark:bg-gray-700' : ''
                    }`}
                  >
                    {t('nav.signOut')}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <Link
                href="/auth/signin"
                className="hidden xl:block px-3 py-2 text-gray-700 dark:text-white hover:text-green-500 dark:hover:text-green-400 transition whitespace-nowrap text-sm"
              >
                {t('nav.login')}
              </Link>
              <Link
                href="/auth/signin"
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition whitespace-nowrap text-sm"
              >
                {t('nav.signUp')}
              </Link>
            </>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden text-gray-700 dark:text-white"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div id="mobile-menu" className="xl:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900" role="navigation" aria-label="Mobile navigation">
          <div className="container mx-auto px-4 py-4 space-y-1">
            {/* Main Links - Most Important First */}
            <Link
              href="/ai-image"
              className="flex items-center gap-3 py-3 px-3 rounded-lg text-gray-700 dark:text-white hover:bg-purple-50 dark:hover:bg-purple-900/20 transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="text-xl" aria-hidden="true">✨</span>
              <div>
                <div className="font-medium text-purple-600 dark:text-purple-400">{t('nav.aiImage')}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Generuj obrazy AI</div>
              </div>
            </Link>
            <Link
              href="/ai-video"
              className="flex items-center gap-3 py-3 px-3 rounded-lg text-gray-700 dark:text-white hover:bg-cyan-50 dark:hover:bg-cyan-900/20 transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="text-xl" aria-hidden="true">🎬</span>
              <div>
                <div className="font-medium text-cyan-600 dark:text-cyan-400">{t('nav.aiVideo')}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Twórz wideo AI</div>
              </div>
            </Link>
            <Link
              href="/ai-chat"
              className="flex items-center gap-3 py-3 px-3 rounded-lg text-gray-700 dark:text-white hover:bg-green-50 dark:hover:bg-green-900/20 transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="text-xl" aria-hidden="true">💬</span>
              <div>
                <div className="font-medium text-green-600 dark:text-green-400">{t('nav.aiChat')}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Rozmawiaj z AI</div>
              </div>
            </Link>
            <Link
              href="/ai-agent"
              className="flex items-center gap-3 py-3 px-3 rounded-lg text-gray-700 dark:text-white hover:bg-cyan-50 dark:hover:bg-cyan-900/20 transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="text-xl" aria-hidden="true">🤖</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-cyan-600 dark:text-cyan-400">{t('nav.aiAgent')}</span>
                  <span className="px-1.5 py-0.5 text-[9px] bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded font-semibold">PRO</span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Inteligentny asystent</div>
              </div>
            </Link>

            <hr className="border-gray-200 dark:border-gray-800 my-2" />

            {/* Tools Section - Collapsible */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <button
                onClick={() => setMobileToolsExpanded(!mobileToolsExpanded)}
                className="w-full flex items-center justify-between px-4 py-3 text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="font-medium">{t('nav.tools')}</span>
                  <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                    {tools.length}
                  </span>
                </div>
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${mobileToolsExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {mobileToolsExpanded && (
                <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 max-h-64 overflow-y-auto">
                  {categories.map((category) => (
                    <div key={category.id} className="px-4 py-2">
                      <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                        {category.label}
                      </div>
                      {category.tools.map((tool) => (
                        <Link
                          key={tool.href}
                          href={tool.href}
                          className="block py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:text-green-500 dark:hover:text-green-400 transition"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {tool.name}
                          {tool.badge && (
                            <span className="text-[10px] bg-green-500 text-white px-1.5 py-0.5 rounded ml-2">
                              {tool.badge}
                            </span>
                          )}
                        </Link>
                      ))}
                    </div>
                  ))}
                  <Link
                    href="/tools"
                    className="block px-4 py-3 text-sm text-center text-green-600 dark:text-green-400 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 border-t border-gray-200 dark:border-gray-700"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('nav.viewAllTools')} →
                  </Link>
                </div>
              )}
            </div>

            <hr className="border-gray-200 dark:border-gray-800 my-2" />

            {/* Other Links */}
            <Link
              href="/pricing"
              className="block py-2 px-3 text-gray-700 dark:text-white hover:text-green-500 dark:hover:text-green-400 transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('nav.pricing')}
            </Link>
            <Link
              href="/blog"
              className="block py-2 px-3 text-gray-700 dark:text-white hover:text-green-500 dark:hover:text-green-400 transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('nav.blog')}
            </Link>

            {session && (
              <>
                <hr className="border-gray-200 dark:border-gray-800 my-2" />
                <Link
                  href="/dashboard"
                  className="block py-2 px-3 text-gray-700 dark:text-white hover:text-green-500 dark:hover:text-green-400 transition font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('nav.dashboard')}
                </Link>
              </>
            )}

            {/* Mobile Theme Toggle */}
            <hr className="border-gray-200 dark:border-gray-800 my-2" />
            <button
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className="flex items-center gap-3 w-full py-2 px-3 text-gray-700 dark:text-white hover:text-green-500 dark:hover:text-green-400 transition"
            >
              {resolvedTheme === 'dark' ? (
                <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
              <span>{resolvedTheme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
