'use client';

import { useState, useEffect, useCallback } from 'react';

interface TagRecommendation {
  tag: string;
  relevancyScore: number;
  category: 'highly_relevant' | 'related' | 'trending' | 'low_competition';
  difficulty: 'easy' | 'medium' | 'hard';
}

interface Props {
  title: string;
  content?: string;
  currentTags: string;
  onTagsChange: (tags: string) => void;
  locale?: string;
}

export default function SEOTagAssistant({ title, content, currentTags, onTagsChange, locale = 'en' }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<TagRecommendation[]>([]);
  const [score, setScore] = useState<{ totalScore: number; grade: string } | null>(null);
  const [calculating, setCalculating] = useState(false);

  // Parse current tags
  const parsedTags = currentTags
    .split(',')
    .map(t => t.trim().toLowerCase())
    .filter(Boolean);

  // Fetch recommendations
  const fetchRecommendations = useCallback(async () => {
    if (!title.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/admin/seo/tags/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, locale, maxTags: 30 }),
      });

      if (response.ok) {
        const data = await response.json();
        setRecommendations(data.tags || []);
      }
    } catch (err) {
      console.error('Failed to fetch recommendations:', err);
    } finally {
      setLoading(false);
    }
  }, [title, content, locale]);

  // Auto-fetch when title changes (debounced)
  useEffect(() => {
    if (!isOpen || !title.trim()) return;

    const timeout = setTimeout(() => {
      fetchRecommendations();
    }, 1000);

    return () => clearTimeout(timeout);
  }, [title, isOpen, fetchRecommendations]);

  // Calculate score
  const calculateScore = async () => {
    if (parsedTags.length === 0 || !title.trim()) return;

    setCalculating(true);
    try {
      const response = await fetch('/api/admin/seo/tags/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: parsedTags, title }),
      });

      if (response.ok) {
        const data = await response.json();
        setScore({ totalScore: data.totalScore, grade: data.grade });
      }
    } catch (err) {
      console.error('Failed to calculate score:', err);
    } finally {
      setCalculating(false);
    }
  };

  // Add tag
  const addTag = (tag: string) => {
    const normalizedTag = tag.toLowerCase().trim();
    if (!parsedTags.includes(normalizedTag)) {
      const newTags = [...parsedTags, normalizedTag];
      onTagsChange(newTags.join(', '));
      setScore(null); // Reset score
    }
  };

  // Remove tag
  const removeTag = (tag: string) => {
    const newTags = parsedTags.filter(t => t !== tag);
    onTagsChange(newTags.join(', '));
    setScore(null);
  };

  // Get difficulty color
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'hard': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  // Get grade color
  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-green-400';
    if (grade === 'B') return 'text-blue-400';
    if (grade === 'C') return 'text-yellow-400';
    return 'text-red-400';
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition"
      >
        <span>🏷️</span>
        <span>SEO Tag Assistant</span>
        <span className="text-xs bg-cyan-500/20 px-1.5 py-0.5 rounded">AI</span>
      </button>
    );
  }

  return (
    <div className="bg-gray-800/80 border border-cyan-500/30 rounded-xl p-4 mt-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-cyan-400 flex items-center gap-2">
          <span>🏷️</span> SEO Tag Assistant
        </h3>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-white text-lg"
        >
          ✕
        </button>
      </div>

      {/* Current Tags */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">Current Tags ({parsedTags.length}/30)</span>
          {parsedTags.length > 0 && (
            <button
              type="button"
              onClick={calculateScore}
              disabled={calculating}
              className="text-xs text-purple-400 hover:text-purple-300"
            >
              {calculating ? 'Calculating...' : '📊 Check Score'}
            </button>
          )}
        </div>

        {parsedTags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {parsedTags.map(tag => (
              <span
                key={tag}
                className="px-2 py-1 bg-green-500/20 border border-green-500/50 text-green-400 rounded text-xs flex items-center gap-1"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="hover:text-white"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No tags yet. Add from recommendations below.</p>
        )}

        {/* Score Display */}
        {score && (
          <div className="mt-2 flex items-center gap-3 text-sm">
            <span className="text-gray-400">Score:</span>
            <span className="font-bold">{score.totalScore}/1000</span>
            <span className={`font-bold ${getGradeColor(score.grade)}`}>
              Grade: {score.grade}
            </span>
          </div>
        )}
      </div>

      {/* Recommendations */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">Recommended Tags</span>
          <button
            type="button"
            onClick={fetchRecommendations}
            disabled={loading || !title.trim()}
            className="text-xs text-blue-400 hover:text-blue-300 disabled:opacity-50"
          >
            {loading ? 'Loading...' : '🔄 Refresh'}
          </button>
        </div>

        {!title.trim() ? (
          <p className="text-sm text-gray-500">Enter a title to get recommendations.</p>
        ) : loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyan-500"></div>
            Analyzing title...
          </div>
        ) : recommendations.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
            {recommendations
              .filter(r => !parsedTags.includes(r.tag.toLowerCase()))
              .slice(0, 20)
              .map(rec => (
                <button
                  key={rec.tag}
                  type="button"
                  onClick={() => addTag(rec.tag)}
                  className="px-2 py-1 bg-gray-700/50 border border-gray-600 text-gray-300 rounded text-xs hover:border-cyan-500/50 hover:text-cyan-400 transition flex items-center gap-1"
                  title={`Relevancy: ${rec.relevancyScore}, Difficulty: ${rec.difficulty}`}
                >
                  <span>+</span>
                  <span>{rec.tag}</span>
                  <span className={`text-[10px] ${getDifficultyColor(rec.difficulty)}`}>
                    {rec.relevancyScore}
                  </span>
                </button>
              ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">Click refresh to load recommendations.</p>
        )}
      </div>

      {/* Quick Tips */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <p className="text-xs text-gray-500">
          💡 Tip: Mix high-relevancy tags with low-competition ones for best results.
        </p>
      </div>
    </div>
  );
}
