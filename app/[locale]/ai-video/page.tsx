'use client';

import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import ToolsLayout from '@/components/ToolsLayout';
import Link from 'next/link';
import { FaPlay, FaRocket, FaClock, FaGlobe, FaMagic, FaVideo, FaFilm, FaBolt, FaCheck, FaStar } from 'react-icons/fa';
import { HiSparkles, HiLightningBolt } from 'react-icons/hi';

// Lazy load heavy components
const AIVideoGenerator = dynamic(
  () => import('@/components/AIVideoGenerator'),
  {
    loading: () => (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    ),
    ssr: false,
  }
);

const ExploreGallery = dynamic(
  () => import('@/components/ai-image/ExploreGallery'),
  {
    loading: () => (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500"></div>
      </div>
    ),
    ssr: false,
  }
);

// AI Video Tools data
const VIDEO_TOOLS = [
  {
    id: 'script',
    href: '/ai-video/script',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    gradient: 'from-violet-500 to-purple-600',
    bgGlow: 'bg-violet-500/20',
    credits: '1',
    isNew: true,
    estimatedTime: '~10s',
  },
  {
    id: 'voiceover',
    href: '/ai-video/voiceover',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
      </svg>
    ),
    gradient: 'from-emerald-500 to-teal-600',
    bgGlow: 'bg-emerald-500/20',
    credits: '2+',
    isNew: true,
    estimatedTime: '~30s',
  },
  {
    id: 'captions',
    href: '/ai-video/captions',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
      </svg>
    ),
    gradient: 'from-blue-500 to-cyan-600',
    bgGlow: 'bg-blue-500/20',
    credits: '3',
    isNew: true,
    estimatedTime: '~1min',
  },
  {
    id: 'lipsync',
    href: '/ai-video/lipsync',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    gradient: 'from-orange-500 to-red-600',
    bgGlow: 'bg-orange-500/20',
    credits: '10',
    isNew: true,
    estimatedTime: '~2min',
  },
  {
    id: 'avatar',
    href: '/ai-video/talking-avatar',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    gradient: 'from-indigo-500 to-purple-600',
    bgGlow: 'bg-indigo-500/20',
    credits: '15',
    isNew: true,
    estimatedTime: '~3min',
  },
  {
    id: 'urlToVideo',
    href: '/ai-video/url-to-video',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
    gradient: 'from-amber-500 to-orange-600',
    bgGlow: 'bg-amber-500/20',
    credits: '20+',
    isNew: true,
    estimatedTime: '~5min',
  },
];

// Video AI Models data
const VIDEO_MODELS = [
  {
    id: 'pixverse',
    name: 'PixVerse V3.5',
    provider: 'PixVerse',
    description: 'Szybki model do krótkich klipów. Idealny do social media.',
    features: ['5s wideo', '720p', 'Szybka generacja'],
    speed: 'fast',
    quality: 'good',
    cost: 'Od 2 kredytów',
    badge: 'Popularny',
    color: 'from-cyan-500 to-blue-600',
  },
  {
    id: 'kling',
    name: 'Kling 1.6',
    provider: 'Kuaishou',
    description: 'Zaawansowany model z wysoką jakością ruchu i detali.',
    features: ['10s wideo', '1080p', 'Wysokie detale'],
    speed: 'medium',
    quality: 'excellent',
    cost: 'Od 8 kredytów',
    badge: 'Pro',
    color: 'from-purple-500 to-indigo-600',
  },
  {
    id: 'veo2',
    name: 'Veo 2',
    provider: 'Google',
    description: 'Model Google z kinematograficzną jakością obrazu.',
    features: ['8s wideo', '1080p', 'Kinematograficzny'],
    speed: 'medium',
    quality: 'excellent',
    cost: 'Od 10 kredytów',
    badge: 'Premium',
    color: 'from-amber-500 to-orange-600',
  },
  {
    id: 'runway',
    name: 'Runway Gen-3',
    provider: 'Runway',
    description: 'Profesjonalny model do produkcji wideo na najwyższym poziomie.',
    features: ['10s wideo', '1080p', 'Profesjonalny'],
    speed: 'slow',
    quality: 'premium',
    cost: 'Od 15 kredytów',
    badge: 'Studio',
    color: 'from-rose-500 to-pink-600',
  },
];

// Use cases
const USE_CASES = [
  {
    title: 'Marketing i reklamy',
    description: 'Twórz przyciągające uwagę reklamy produktowe, animacje logo i treści promocyjne.',
    icon: <FaRocket className="w-5 h-5" />,
    examples: ['Reklamy produktowe', 'Animacje logo', 'Intro do wideo'],
    color: 'from-purple-500 to-indigo-500',
  },
  {
    title: 'Social Media',
    description: 'Generuj viralowe treści na TikTok, Instagram Reels i YouTube Shorts.',
    icon: <FaPlay className="w-5 h-5" />,
    examples: ['TikTok clips', 'Instagram Reels', 'YouTube Shorts'],
    color: 'from-pink-500 to-rose-500',
  },
  {
    title: 'Edukacja i e-learning',
    description: 'Twórz angażujące materiały edukacyjne i wizualizacje konceptów.',
    icon: <FaGlobe className="w-5 h-5" />,
    examples: ['Tutoriale', 'Wizualizacje', 'Prezentacje'],
    color: 'from-emerald-500 to-teal-500',
  },
  {
    title: 'Sztuka i kreatywność',
    description: 'Eksperymentuj z AI w tworzeniu unikalnych wizji artystycznych.',
    icon: <FaMagic className="w-5 h-5" />,
    examples: ['Teledyski', 'Animacje artystyczne', 'NFT'],
    color: 'from-amber-500 to-orange-500',
  },
];

// How it works steps
const HOW_IT_WORKS = [
  {
    step: 1,
    title: 'Opisz swoje wideo',
    description: 'Napisz szczegółowy opis sceny, którą chcesz wygenerować.',
    icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>,
  },
  {
    step: 2,
    title: 'Wybierz model i ustawienia',
    description: 'Dostosuj długość, proporcje i model AI do swoich potrzeb.',
    icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>,
  },
  {
    step: 3,
    title: 'Generuj i pobierz',
    description: 'AI stworzy profesjonalne wideo w kilka minut.',
    icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>,
  },
];

type MainTab = 'generate' | 'tools' | 'gallery';

export default function AIVideoPage() {
  const t = useTranslations('aiVideo');
  const tPage = useTranslations('aiVideoPage');
  const { data: session } = useSession();
  const [mainTab, setMainTab] = useState<MainTab>('generate');
  const [galleryTab, setGalleryTab] = useState<'explore' | 'my-creations'>('explore');

  // Check URL hash for tab
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash === 'tools') setMainTab('tools');
    else if (hash === 'gallery') setMainTab('gallery');
  }, []);

  return (
    <ToolsLayout>
      {/* Enhanced Hero Section */}
      <section className="relative overflow-hidden border-b border-gray-800">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-900/30 via-gray-900/50 to-transparent" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/2 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-6 py-16 md:py-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left side - Text */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600/20 border border-cyan-500/30 rounded-full text-sm mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-cyan-300">{tPage('badge')}</span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                <span className="text-white">Generator </span>
                <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Wideo AI
                </span>
              </h1>

              <p className="text-lg md:text-xl text-gray-400 mb-8 max-w-xl">
                {tPage('hero.subtitle')} Twórz profesjonalne filmy z tekstu w kilka minut.
              </p>

              {/* Feature pills */}
              <div className="flex flex-wrap gap-3 mb-8">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-800/80 border border-gray-700 rounded-full text-sm text-gray-300">
                  <FaBolt className="w-3 h-3 text-yellow-400" />
                  Szybka generacja
                </span>
                <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-800/80 border border-gray-700 rounded-full text-sm text-gray-300">
                  <FaVideo className="w-3 h-3 text-cyan-400" />
                  4 modele AI
                </span>
                <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-800/80 border border-gray-700 rounded-full text-sm text-gray-300">
                  <HiSparkles className="w-3 h-3 text-purple-400" />
                  1080p jakość
                </span>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => setMainTab('generate')}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-cyan-500/25 transition-all hover:shadow-cyan-500/40 hover:-translate-y-0.5"
                >
                  <FaPlay className="w-4 h-4" />
                  Zacznij tworzyć
                </button>
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-xl border border-gray-700 transition"
                >
                  Zobacz cennik
                </Link>
              </div>
            </div>

            {/* Right side - Stats cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 hover:border-cyan-500/30 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white mb-4">
                  <FaVideo className="w-5 h-5" />
                </div>
                <div className="text-3xl font-bold text-white mb-1">4</div>
                <div className="text-sm text-gray-400">Modele AI wideo</div>
              </div>
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 hover:border-purple-500/30 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white mb-4">
                  <HiSparkles className="w-5 h-5" />
                </div>
                <div className="text-3xl font-bold text-white mb-1">6</div>
                <div className="text-sm text-gray-400">Narzędzi AI</div>
              </div>
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 hover:border-emerald-500/30 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white mb-4">
                  <FaClock className="w-5 h-5" />
                </div>
                <div className="text-3xl font-bold text-white mb-1">10s</div>
                <div className="text-sm text-gray-400">Max długość</div>
              </div>
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 hover:border-amber-500/30 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white mb-4">
                  <FaStar className="w-5 h-5" />
                </div>
                <div className="text-3xl font-bold text-cyan-400 mb-1">2</div>
                <div className="text-sm text-gray-400">Kredyty od</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Tabs */}
      <section className="sticky top-[73px] z-40 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1">
            <button
              onClick={() => setMainTab('generate')}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition border-b-2 ${
                mainTab === 'generate'
                  ? 'text-cyan-400 border-cyan-400 bg-cyan-500/5'
                  : 'text-gray-400 border-transparent hover:text-white hover:bg-gray-800/50'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Text to Video
            </button>
            <button
              onClick={() => setMainTab('tools')}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition border-b-2 ${
                mainTab === 'tools'
                  ? 'text-cyan-400 border-cyan-400 bg-cyan-500/5'
                  : 'text-gray-400 border-transparent hover:text-white hover:bg-gray-800/50'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              AI Tools
              <span className="px-1.5 py-0.5 text-[10px] bg-cyan-500 text-white rounded-full font-bold">6</span>
            </button>
            <button
              onClick={() => setMainTab('gallery')}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition border-b-2 ${
                mainTab === 'gallery'
                  ? 'text-cyan-400 border-cyan-400 bg-cyan-500/5'
                  : 'text-gray-400 border-transparent hover:text-white hover:bg-gray-800/50'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Gallery
            </button>
          </div>
        </div>
      </section>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Text to Video Tab */}
        {mainTab === 'generate' && (
          <div className="animate-in fade-in duration-300">
            <AIVideoGenerator />
          </div>
        )}

        {/* AI Tools Tab */}
        {mainTab === 'tools' && (
          <div className="animate-in fade-in duration-300">
            {/* Tools Header */}
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold mb-3">
                <span className="text-white">Complete Video </span>
                <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Creation Suite</span>
              </h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Professional AI tools to script, voice, caption, and enhance your videos
              </p>
            </div>

            {/* Tools Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {VIDEO_TOOLS.map((tool) => (
                <Link
                  key={tool.id}
                  href={tool.href}
                  className="group relative bg-gray-800/40 hover:bg-gray-800/60 border border-gray-700/50 hover:border-gray-600 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:shadow-black/20 hover:-translate-y-1"
                >
                  {/* Glow effect */}
                  <div className={`absolute inset-0 ${tool.bgGlow} rounded-2xl blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-300`} />

                  <div className="relative">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tool.gradient} flex items-center justify-center text-white shadow-lg`}>
                        {tool.icon}
                      </div>
                      {tool.isNew && (
                        <span className="px-2 py-1 text-[10px] font-bold bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-full">
                          NEW
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <h3 className="font-semibold text-white text-lg mb-2 group-hover:text-cyan-400 transition-colors">
                      {t(`${tool.id}.title`)}
                    </h3>
                    <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                      {t(`${tool.id}.description`)}
                    </p>

                    {/* Footer */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-cyan-400 text-sm font-medium">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {tool.credits}
                        </span>
                        <span className="text-gray-500 text-xs">
                          {tool.estimatedTime}
                        </span>
                      </div>
                      <svg className="w-5 h-5 text-gray-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Quick Start Section */}
            <div className="mt-12 bg-gradient-to-r from-cyan-900/30 to-blue-900/30 border border-cyan-500/20 rounded-2xl p-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    New to AI Video Creation?
                  </h3>
                  <p className="text-gray-400">
                    Start with AI Script Generator to create your video concept, then use AI Voiceover to bring it to life.
                  </p>
                </div>
                <div className="flex gap-3">
                  <Link
                    href="/ai-video/script"
                    className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition flex items-center gap-2"
                  >
                    Start with Script
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Gallery Tab */}
        {mainTab === 'gallery' && (
          <div className="animate-in fade-in duration-300">
            {/* Gallery Sub-tabs */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setGalleryTab('explore')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                  galleryTab === 'explore'
                    ? 'bg-cyan-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                Explore
              </button>
              <button
                onClick={() => setGalleryTab('my-creations')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                  galleryTab === 'my-creations'
                    ? 'bg-cyan-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                My Creations
              </button>
            </div>

            {/* Gallery Content */}
            <div className="bg-gray-800/30 rounded-xl border border-gray-700 p-6">
              {galleryTab === 'explore' && <ExploreGallery />}
              {galleryTab === 'my-creations' && (
                session ? (
                  <ExploreGallery showMyCreations />
                ) : (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-700 flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">{tPage('gallery.signInRequired')}</h3>
                    <p className="text-gray-400 mb-6">{tPage('gallery.signInDescription')}</p>
                    <Link
                      href="/auth/signin"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-700 rounded-lg font-medium transition"
                    >
                      {tPage('gallery.signInButton')}
                    </Link>
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </div>

      {/* AI Video Models Section */}
      <section className="bg-gray-800/30 border-y border-gray-800 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="text-white">Najlepsze modele </span>
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">AI wideo</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Wybieraj spośród wiodących modeli AI do generowania wideo. Każdy model oferuje unikalne możliwości.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {VIDEO_MODELS.map((model) => (
              <div
                key={model.id}
                className="group bg-gray-900/50 border border-gray-700/50 rounded-2xl p-6 hover:border-gray-600 transition-all duration-300 hover:-translate-y-1"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${model.color} flex items-center justify-center text-white shadow-lg`}>
                    <FaFilm className="w-5 h-5" />
                  </div>
                  <span className={`px-2 py-1 text-[10px] font-bold rounded-full ${
                    model.badge === 'Popularny' ? 'bg-cyan-500/20 text-cyan-400' :
                    model.badge === 'Pro' ? 'bg-purple-500/20 text-purple-400' :
                    model.badge === 'Premium' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-rose-500/20 text-rose-400'
                  }`}>
                    {model.badge}
                  </span>
                </div>

                {/* Content */}
                <h3 className="font-semibold text-white text-lg mb-1">{model.name}</h3>
                <p className="text-xs text-gray-500 mb-3">{model.provider}</p>
                <p className="text-sm text-gray-400 mb-4">{model.description}</p>

                {/* Features */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {model.features.map((feature, idx) => (
                    <span key={idx} className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-300">
                      {feature}
                    </span>
                  ))}
                </div>

                {/* Cost */}
                <div className="pt-4 border-t border-gray-800">
                  <span className="text-sm font-medium text-cyan-400">{model.cost}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="text-white">Jak to </span>
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">działa?</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Generowanie wideo z AI jest proste i zajmuje tylko kilka kroków.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map((step, idx) => (
              <div key={step.step} className="relative">
                {/* Connector line */}
                {idx < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-[calc(50%+60px)] w-[calc(100%-120px)] h-0.5 bg-gradient-to-r from-cyan-500/50 to-blue-500/50" />
                )}

                <div className="text-center">
                  <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white">
                      {step.icon}
                    </div>
                  </div>
                  <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-cyan-500 text-white font-bold text-sm mb-4">
                    {step.step}
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{step.title}</h3>
                  <p className="text-gray-400">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="bg-gray-800/30 border-y border-gray-800 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="text-white">Do czego wykorzystać </span>
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">AI Video?</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Generowanie wideo z AI znajduje zastosowanie w wielu branżach i projektach.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {USE_CASES.map((useCase, idx) => (
              <div
                key={idx}
                className="group bg-gray-900/50 border border-gray-700/50 rounded-2xl p-6 hover:border-gray-600 transition-all duration-300"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${useCase.color} flex items-center justify-center text-white mb-4`}>
                  {useCase.icon}
                </div>
                <h3 className="font-semibold text-white text-lg mb-2">{useCase.title}</h3>
                <p className="text-sm text-gray-400 mb-4">{useCase.description}</p>
                <div className="flex flex-wrap gap-2">
                  {useCase.examples.map((example, i) => (
                    <span key={i} className="text-xs text-gray-500">
                      {example}{i < useCase.examples.length - 1 && ' •'}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="text-white">Dlaczego </span>
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Pixelift AI Video?</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center">
                <FaBolt className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">{t('features.fast.title')}</h3>
              <p className="text-gray-400">{t('features.fast.description')}</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/30 flex items-center justify-center">
                <HiSparkles className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">{t('features.models.title')}</h3>
              <p className="text-gray-400">{t('features.models.description')}</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center">
                <FaVideo className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">{t('features.quality.title')}</h3>
              <p className="text-gray-400">{t('features.quality.description')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-gradient-to-r from-cyan-900/50 to-blue-900/50 border border-cyan-500/20 rounded-3xl p-12 text-center">
            <FaVideo className="w-16 h-16 mx-auto mb-6 text-cyan-400" />
            <h2 className="text-3xl font-bold text-white mb-4">
              Gotowy na tworzenie wideo z AI?
            </h2>
            <p className="text-gray-400 mb-8 max-w-lg mx-auto">
              Dołącz do tysięcy twórców, którzy już wykorzystują AI do produkcji profesjonalnych filmów.
              Bez abonamentu - płać tylko za to, co wykorzystasz.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => {
                  setMainTab('generate');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg transition-all"
              >
                <HiSparkles className="w-5 h-5" />
                Zacznij generować wideo
              </button>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-xl border border-gray-700 transition"
              >
                Zobacz cennik
              </Link>
            </div>
          </div>
        </div>
      </section>
    </ToolsLayout>
  );
}
