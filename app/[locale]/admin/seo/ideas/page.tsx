'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface ArticleIdea {
  title: string;
  slug: string;
  type: string;
  targetKeyword: string;
  estimatedDifficulty: 'easy' | 'medium' | 'hard';
  searchIntent: string;
  outline: string[];
  estimatedWordCount: number;
  potentialQuestions: string[];
  relatedTopics: string[];
}

interface HeadingStructure {
  type: 'h1' | 'h2' | 'h3';
  text: string;
  keyPoints?: string[];
  suggestedWordCount?: number;
  keywords?: string[];
}

interface ArticleOutline {
  title: string;
  metaDescription: string;
  targetKeyword: string;
  secondaryKeywords: string[];
  estimatedWordCount: number;
  headings: HeadingStructure[];
  introduction: {
    hook: string;
    context: string;
    thesis: string;
  };
  conclusion: {
    summary: string;
    callToAction: string;
  };
  faqSection: {
    question: string;
    answerPoints: string[];
  }[];
}

interface Question {
  question: string;
  type: string;
  searchIntent: string;
  difficulty: string;
  suggestedFormat: string;
  estimatedAnswerLength: number;
}

interface QuestionGroup {
  category: string;
  questions: Question[];
}

export default function ContentIdeasPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;

  // State
  const [activeTab, setActiveTab] = useState<'ideas' | 'outline' | 'questions'>('ideas');
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);

  // Ideas state
  const [ideas, setIdeas] = useState<ArticleIdea[]>([]);
  const [selectedIdea, setSelectedIdea] = useState<ArticleIdea | null>(null);

  // Outline state
  const [outlineKeyword, setOutlineKeyword] = useState('');
  const [outlineTitle, setOutlineTitle] = useState('');
  const [outline, setOutline] = useState<ArticleOutline | null>(null);
  const [outlineLoading, setOutlineLoading] = useState(false);

  // Questions state
  const [questionsKeyword, setQuestionsKeyword] = useState('');
  const [questionGroups, setQuestionGroups] = useState<QuestionGroup[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [topOpportunities, setTopOpportunities] = useState<string[]>([]);

  // Generate ideas
  const generateIdeas = async () => {
    if (!keyword.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/admin/seo/content/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword, locale, count: 10 }),
      });

      if (response.ok) {
        const data = await response.json();
        setIdeas(data.ideas || []);
      }
    } catch (err) {
      console.error('Failed to generate ideas:', err);
    } finally {
      setLoading(false);
    }
  };

  // Generate outline
  const generateOutline = async () => {
    if (!outlineKeyword.trim()) return;

    setOutlineLoading(true);
    try {
      const response = await fetch('/api/admin/seo/content/outline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: outlineKeyword,
          title: outlineTitle || undefined,
          locale,
          targetWordCount: 2000,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setOutline(data.outline);
      }
    } catch (err) {
      console.error('Failed to generate outline:', err);
    } finally {
      setOutlineLoading(false);
    }
  };

  // Fetch questions
  const fetchQuestions = async () => {
    if (!questionsKeyword.trim()) return;

    setQuestionsLoading(true);
    try {
      const response = await fetch('/api/admin/seo/content/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: questionsKeyword, locale, limit: 50 }),
      });

      if (response.ok) {
        const data = await response.json();
        setQuestionGroups(data.groups || []);
        setTopOpportunities(data.topOpportunities || []);
      }
    } catch (err) {
      console.error('Failed to fetch questions:', err);
    } finally {
      setQuestionsLoading(false);
    }
  };

  // Export outline to editor
  const exportToEditor = (outlineData: ArticleOutline) => {
    // Create markdown content from outline
    const content = outlineData.headings
      .map(h => {
        const prefix = h.type === 'h1' ? '# ' : h.type === 'h2' ? '## ' : '### ';
        let section = prefix + h.text + '\n\n';
        if (h.keyPoints) {
          section += h.keyPoints.map(p => `- ${p}`).join('\n') + '\n\n';
        }
        return section;
      })
      .join('');

    // Store in localStorage for the editor to pick up
    localStorage.setItem('seo_outline_export', JSON.stringify({
      title: outlineData.title,
      content,
      excerpt: outlineData.metaDescription,
      tags: outlineData.secondaryKeywords.join(', '),
    }));

    router.push(`/${locale}/admin/blog/new?from=outline`);
  };

  // Get difficulty color
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'hard': return 'bg-red-500/20 text-red-400 border-red-500/50';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'how-to': 'bg-blue-500/20 text-blue-400',
      'listicle': 'bg-purple-500/20 text-purple-400',
      'comparison': 'bg-orange-500/20 text-orange-400',
      'guide': 'bg-green-500/20 text-green-400',
      'review': 'bg-yellow-500/20 text-yellow-400',
      'tutorial': 'bg-cyan-500/20 text-cyan-400',
      'faq': 'bg-pink-500/20 text-pink-400',
    };
    return colors[type] || 'bg-gray-500/20 text-gray-400';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Content Ideas Generator</h1>
          <p className="text-gray-400 text-lg">
            AI-powered content planning and article outline generator
          </p>
        </div>
        <Link
          href={`/${locale}/admin/seo`}
          className="text-gray-400 hover:text-white"
        >
          ← Back to SEO Hub
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700">
        <button
          onClick={() => setActiveTab('ideas')}
          className={`px-6 py-3 font-medium transition ${
            activeTab === 'ideas'
              ? 'text-emerald-400 border-b-2 border-emerald-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          💡 Article Ideas
        </button>
        <button
          onClick={() => setActiveTab('outline')}
          className={`px-6 py-3 font-medium transition ${
            activeTab === 'outline'
              ? 'text-purple-400 border-b-2 border-purple-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          📝 Outline Generator
        </button>
        <button
          onClick={() => setActiveTab('questions')}
          className={`px-6 py-3 font-medium transition ${
            activeTab === 'questions'
              ? 'text-cyan-400 border-b-2 border-cyan-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          ❓ Questions Research
        </button>
      </div>

      {/* Ideas Tab */}
      {activeTab === 'ideas' && (
        <div className="space-y-6">
          {/* Search */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">Generate Article Ideas</h2>
            <div className="flex gap-4">
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Enter seed keyword (e.g., remove background)"
                className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-emerald-500 focus:outline-none"
                onKeyDown={(e) => e.key === 'Enter' && generateIdeas()}
              />
              <button
                onClick={generateIdeas}
                disabled={loading || !keyword.trim()}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 text-white font-semibold rounded-lg transition"
              >
                {loading ? 'Generating...' : 'Generate Ideas'}
              </button>
            </div>
          </div>

          {/* Ideas Grid */}
          {ideas.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              {ideas.map((idea, idx) => (
                <div
                  key={idx}
                  className={`bg-gray-800/50 border rounded-xl p-5 cursor-pointer transition hover:border-emerald-500/50 ${
                    selectedIdea === idea ? 'border-emerald-500' : 'border-gray-700'
                  }`}
                  onClick={() => setSelectedIdea(selectedIdea === idea ? null : idea)}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <h3 className="font-bold text-white">{idea.title}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(idea.type)}`}>
                      {idea.type}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className={`px-2 py-1 rounded text-xs border ${getDifficultyColor(idea.estimatedDifficulty)}`}>
                      {idea.estimatedDifficulty}
                    </span>
                    <span className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300">
                      {idea.estimatedWordCount} words
                    </span>
                    <span className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300">
                      {idea.searchIntent}
                    </span>
                  </div>

                  <p className="text-sm text-gray-400 mb-3">
                    Target: <span className="text-white">{idea.targetKeyword}</span>
                  </p>

                  {selectedIdea === idea && (
                    <div className="mt-4 pt-4 border-t border-gray-700 space-y-3">
                      <div>
                        <span className="text-xs text-gray-500 uppercase">Outline</span>
                        <ul className="mt-1 text-sm text-gray-300">
                          {idea.outline.map((point, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-emerald-400">•</span> {point}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {idea.potentialQuestions.length > 0 && (
                        <div>
                          <span className="text-xs text-gray-500 uppercase">Questions to Answer</span>
                          <ul className="mt-1 text-sm text-gray-400">
                            {idea.potentialQuestions.slice(0, 3).map((q, i) => (
                              <li key={i}>• {q}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOutlineKeyword(idea.targetKeyword);
                          setOutlineTitle(idea.title);
                          setActiveTab('outline');
                        }}
                        className="w-full mt-3 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition"
                      >
                        Generate Full Outline →
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Outline Tab */}
      {activeTab === 'outline' && (
        <div className="space-y-6">
          {/* Input */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">Generate Article Outline</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Target Keyword *</label>
                <input
                  type="text"
                  value={outlineKeyword}
                  onChange={(e) => setOutlineKeyword(e.target.value)}
                  placeholder="e.g., how to remove background from image"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Suggested Title (optional)</label>
                <input
                  type="text"
                  value={outlineTitle}
                  onChange={(e) => setOutlineTitle(e.target.value)}
                  placeholder="e.g., Complete Guide to Removing Backgrounds in 2025"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                />
              </div>
              <button
                onClick={generateOutline}
                disabled={outlineLoading || !outlineKeyword.trim()}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white font-semibold rounded-lg transition"
              >
                {outlineLoading ? 'Generating Outline...' : 'Generate Outline'}
              </button>
            </div>
          </div>

          {/* Outline Result */}
          {outline && (
            <div className="bg-gray-800/50 border border-purple-500/30 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">{outline.title}</h2>
                <button
                  onClick={() => exportToEditor(outline)}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition flex items-center gap-2"
                >
                  <span>📤</span> Export to Editor
                </button>
              </div>

              <div className="mb-6 p-4 bg-gray-900/50 rounded-lg">
                <span className="text-xs text-gray-500 uppercase">Meta Description</span>
                <p className="text-gray-300 mt-1">{outline.metaDescription}</p>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm">
                  {outline.targetKeyword}
                </span>
                {outline.secondaryKeywords.map((kw, i) => (
                  <span key={i} className="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-sm">
                    {kw}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-900/50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-white">{outline.estimatedWordCount}</div>
                  <div className="text-xs text-gray-400">Target Words</div>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-white">{outline.headings.filter(h => h.type === 'h2').length}</div>
                  <div className="text-xs text-gray-400">Main Sections</div>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-white">{outline.faqSection.length}</div>
                  <div className="text-xs text-gray-400">FAQ Items</div>
                </div>
              </div>

              {/* Introduction */}
              <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                <h3 className="font-bold text-emerald-400 mb-2">Introduction</h3>
                <p className="text-sm text-gray-300 mb-1"><span className="text-emerald-400">Hook:</span> {outline.introduction.hook}</p>
                <p className="text-sm text-gray-300 mb-1"><span className="text-emerald-400">Context:</span> {outline.introduction.context}</p>
                <p className="text-sm text-gray-300"><span className="text-emerald-400">Thesis:</span> {outline.introduction.thesis}</p>
              </div>

              {/* Headings Structure */}
              <div className="space-y-3 mb-6">
                <h3 className="font-bold text-gray-300">Article Structure</h3>
                {outline.headings.map((heading, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg ${
                      heading.type === 'h1' ? 'bg-purple-500/10 border border-purple-500/30' :
                      heading.type === 'h2' ? 'bg-gray-900/50 ml-4' : 'bg-gray-900/30 ml-8'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        heading.type === 'h1' ? 'bg-purple-500/30 text-purple-400' :
                        heading.type === 'h2' ? 'bg-blue-500/30 text-blue-400' : 'bg-gray-600 text-gray-400'
                      }`}>{heading.type.toUpperCase()}</span>
                      <span className="font-medium text-white">{heading.text}</span>
                      {heading.suggestedWordCount && (
                        <span className="text-xs text-gray-500 ml-auto">{heading.suggestedWordCount} words</span>
                      )}
                    </div>
                    {heading.keyPoints && heading.keyPoints.length > 0 && (
                      <ul className="mt-2 ml-4 text-sm text-gray-400">
                        {heading.keyPoints.map((point, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-gray-600">•</span> {point}
                          </li>
                        ))}
                      </ul>
                    )}
                    {heading.keywords && heading.keywords.length > 0 && (
                      <div className="mt-2 flex gap-1">
                        {heading.keywords.map((kw, i) => (
                          <span key={i} className="text-[10px] px-1.5 py-0.5 bg-gray-700 text-gray-400 rounded">{kw}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* FAQ Section */}
              {outline.faqSection.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-bold text-gray-300 mb-3">FAQ Section (for Schema Markup)</h3>
                  <div className="space-y-2">
                    {outline.faqSection.map((faq, idx) => (
                      <div key={idx} className="p-3 bg-gray-900/50 rounded-lg">
                        <div className="font-medium text-cyan-400">{faq.question}</div>
                        <ul className="mt-1 text-sm text-gray-400">
                          {faq.answerPoints.map((point, i) => (
                            <li key={i}>• {point}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Conclusion */}
              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <h3 className="font-bold text-blue-400 mb-2">Conclusion</h3>
                <p className="text-sm text-gray-300 mb-1"><span className="text-blue-400">Summary:</span> {outline.conclusion.summary}</p>
                <p className="text-sm text-gray-300"><span className="text-blue-400">CTA:</span> {outline.conclusion.callToAction}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Questions Tab */}
      {activeTab === 'questions' && (
        <div className="space-y-6">
          {/* Search */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">Research Questions</h2>
            <p className="text-gray-400 mb-4">
              Find questions people are asking about your topic. Great for FAQ sections and featured snippets.
            </p>
            <div className="flex gap-4">
              <input
                type="text"
                value={questionsKeyword}
                onChange={(e) => setQuestionsKeyword(e.target.value)}
                placeholder="Enter topic (e.g., background removal)"
                className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-cyan-500 focus:outline-none"
                onKeyDown={(e) => e.key === 'Enter' && fetchQuestions()}
              />
              <button
                onClick={fetchQuestions}
                disabled={questionsLoading || !questionsKeyword.trim()}
                className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 text-white font-semibold rounded-lg transition"
              >
                {questionsLoading ? 'Researching...' : 'Find Questions'}
              </button>
            </div>
          </div>

          {/* Top Opportunities */}
          {topOpportunities.length > 0 && (
            <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-xl p-6">
              <h3 className="font-bold text-cyan-400 mb-3">🎯 Top Content Opportunities</h3>
              <ul className="space-y-2">
                {topOpportunities.map((opp, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-white">
                    <span className="text-cyan-400">{idx + 1}.</span> {opp}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Question Groups */}
          {questionGroups.length > 0 && (
            <div className="space-y-4">
              {questionGroups.map((group, idx) => (
                <div key={idx} className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                  <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                    <span className="text-lg">
                      {group.category.includes('How') ? '🔧' :
                       group.category.includes('What') ? '📖' :
                       group.category.includes('Why') ? '💡' :
                       group.category.includes('When') ? '⏰' :
                       group.category.includes('Can') ? '✅' : '❓'}
                    </span>
                    {group.category}
                    <span className="text-sm font-normal text-gray-500">
                      ({group.questions.length} questions)
                    </span>
                  </h3>
                  <div className="grid gap-3">
                    {group.questions.map((q, qIdx) => (
                      <div
                        key={qIdx}
                        className="p-3 bg-gray-900/50 rounded-lg hover:bg-gray-900/80 transition"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <span className="text-gray-200">{q.question}</span>
                          <div className="flex gap-2 flex-shrink-0">
                            <span className={`px-2 py-1 rounded text-xs ${getDifficultyColor(q.difficulty)}`}>
                              {q.difficulty}
                            </span>
                            <span className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300">
                              {q.suggestedFormat}
                            </span>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                          <span>~{q.estimatedAnswerLength} words</span>
                          <span>•</span>
                          <span>{q.searchIntent}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
