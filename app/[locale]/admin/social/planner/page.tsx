"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";

interface SocialPost {
  id: string;
  content: string;
  status: string;
  scheduledAt: string | null;
  publishedAt: string | null;
  account?: {
    platform: string;
    accountName: string;
  };
}

const PLATFORM_COLORS: Record<string, string> = {
  facebook: "bg-blue-600",
  instagram: "bg-gradient-to-br from-purple-600 to-pink-500",
  twitter: "bg-black",
  linkedin: "bg-blue-700",
  pinterest: "bg-red-600",
  tiktok: "bg-black",
  youtube: "bg-red-600",
  threads: "bg-black",
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function PlannerPage() {
  const params = useParams();
  const locale = params.locale as string;

  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"month" | "week">("month");

  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/social/posts?limit=500");
      const data = await res.json();
      setPosts(data.posts || []);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days: Array<{ date: Date | null; posts: SocialPost[] }> = [];

    // Previous month days
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({ date: null, posts: [] });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const dayPosts = posts.filter((post) => {
        const postDate = post.scheduledAt ? new Date(post.scheduledAt) :
                        post.publishedAt ? new Date(post.publishedAt) : null;
        if (!postDate) return false;
        return postDate.getFullYear() === year &&
               postDate.getMonth() === month &&
               postDate.getDate() === i;
      });
      days.push({ date, posts: dayPosts });
    }

    return days;
  };

  const getWeekDays = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

    const days: Array<{ date: Date; posts: SocialPost[] }> = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);

      const dayPosts = posts.filter((post) => {
        const postDate = post.scheduledAt ? new Date(post.scheduledAt) :
                        post.publishedAt ? new Date(post.publishedAt) : null;
        if (!postDate) return false;
        return postDate.getFullYear() === date.getFullYear() &&
               postDate.getMonth() === date.getMonth() &&
               postDate.getDate() === date.getDate();
      });
      days.push({ date, posts: dayPosts });
    }

    return days;
  };

  const navigateMonth = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const navigateWeek = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + direction * 7);
    setCurrentDate(newDate);
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return date.getFullYear() === today.getFullYear() &&
           date.getMonth() === today.getMonth() &&
           date.getDate() === today.getDate();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "border-l-green-500";
      case "scheduled":
        return "border-l-blue-500";
      case "draft":
        return "border-l-gray-500";
      case "failed":
        return "border-l-red-500";
      default:
        return "border-l-gray-500";
    }
  };

  const scheduledCount = posts.filter((p) => p.status === "scheduled").length;
  const publishedCount = posts.filter((p) => p.status === "published").length;
  const draftCount = posts.filter((p) => p.status === "draft").length;

  const calendarDays = view === "month" ? getCalendarDays() : getWeekDays();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link
              href={`/${locale}/admin/social`}
              className="text-gray-400 hover:text-white transition"
            >
              Social Hub
            </Link>
            <span className="text-gray-600">/</span>
            <h1 className="text-3xl font-bold">Content Planner</h1>
          </div>
          <p className="text-gray-400">
            Schedule and plan your social media content
          </p>
        </div>
        <Link
          href={`/${locale}/admin/social/posts?new=true`}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-xl transition"
        >
          <span>+</span> New Post
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
          <div className="text-3xl font-bold text-blue-400">{scheduledCount}</div>
          <div className="text-gray-400 text-sm">Scheduled</div>
        </div>
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
          <div className="text-3xl font-bold text-green-400">{publishedCount}</div>
          <div className="text-gray-400 text-sm">Published</div>
        </div>
        <div className="bg-gray-500/10 border border-gray-500/30 rounded-xl p-4">
          <div className="text-3xl font-bold text-gray-400">{draftCount}</div>
          <div className="text-gray-400 text-sm">Drafts</div>
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => view === "month" ? navigateMonth(-1) : navigateWeek(-1)}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition"
          >
            &larr;
          </button>
          <h2 className="text-xl font-semibold text-white min-w-[200px] text-center">
            {view === "month"
              ? `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`
              : `Week of ${currentDate.toLocaleDateString()}`
            }
          </h2>
          <button
            onClick={() => view === "month" ? navigateMonth(1) : navigateWeek(1)}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition"
          >
            &rarr;
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1.5 text-sm text-gray-400 hover:text-white bg-gray-800 rounded-lg transition"
          >
            Today
          </button>
          <div className="flex bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setView("week")}
              className={`px-3 py-1.5 text-sm rounded-md transition ${
                view === "week" ? "bg-cyan-600 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setView("month")}
              className={`px-3 py-1.5 text-sm rounded-md transition ${
                view === "month" ? "bg-cyan-600 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              Month
            </button>
          </div>
        </div>
      </div>

      {/* Calendar */}
      {loading ? (
        <div className="text-gray-400 text-center py-12">Loading...</div>
      ) : (
        <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 overflow-hidden">
          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b border-gray-700/50">
            {DAYS.map((day) => (
              <div
                key={day}
                className="p-3 text-center text-sm font-medium text-gray-400 bg-gray-900/50"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className={`grid grid-cols-7 ${view === "month" ? "auto-rows-[120px]" : "auto-rows-[300px]"}`}>
            {calendarDays.map((day, index) => (
              <div
                key={index}
                className={`p-2 border-b border-r border-gray-700/50 ${
                  day.date ? "" : "bg-gray-900/30"
                } ${isToday(day.date) ? "bg-cyan-500/10" : ""}`}
              >
                {day.date && (
                  <>
                    <div className={`text-sm font-medium mb-2 ${
                      isToday(day.date) ? "text-cyan-400" : "text-gray-400"
                    }`}>
                      {day.date.getDate()}
                    </div>
                    <div className="space-y-1 overflow-y-auto max-h-[80px]">
                      {day.posts.slice(0, view === "month" ? 3 : 10).map((post) => (
                        <Link
                          key={post.id}
                          href={`/${locale}/admin/social/posts`}
                          className={`block text-xs p-1.5 bg-gray-900/50 rounded border-l-2 ${getStatusColor(post.status)} hover:bg-gray-700/50 transition truncate`}
                        >
                          <div className="flex items-center gap-1">
                            {post.account && (
                              <span className={`w-4 h-4 rounded text-[10px] ${PLATFORM_COLORS[post.account.platform] || "bg-gray-600"} flex items-center justify-center text-white shrink-0`}>
                                {post.account.platform[0].toUpperCase()}
                              </span>
                            )}
                            <span className="truncate text-gray-300">
                              {post.content.substring(0, 30)}...
                            </span>
                          </div>
                        </Link>
                      ))}
                      {day.posts.length > (view === "month" ? 3 : 10) && (
                        <div className="text-xs text-gray-500 text-center">
                          +{day.posts.length - (view === "month" ? 3 : 10)} more
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-500"></div>
          <span className="text-gray-400">Scheduled</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-500"></div>
          <span className="text-gray-400">Published</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-gray-500"></div>
          <span className="text-gray-400">Draft</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-red-500"></div>
          <span className="text-gray-400">Failed</span>
        </div>
      </div>

      {/* Quick Tips */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Best Times to Post</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 bg-gray-900/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-blue-400 font-bold">f</span>
              <span className="text-white text-sm">Facebook</span>
            </div>
            <div className="text-gray-400 text-xs">Wed 11am, Fri 10am</div>
          </div>
          <div className="p-3 bg-gray-900/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-pink-400">📸</span>
              <span className="text-white text-sm">Instagram</span>
            </div>
            <div className="text-gray-400 text-xs">Mon-Fri 11am-1pm</div>
          </div>
          <div className="p-3 bg-gray-900/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-white">𝕏</span>
              <span className="text-white text-sm">X/Twitter</span>
            </div>
            <div className="text-gray-400 text-xs">Wed 9am, Fri 9am</div>
          </div>
          <div className="p-3 bg-gray-900/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-blue-300 font-bold">in</span>
              <span className="text-white text-sm">LinkedIn</span>
            </div>
            <div className="text-gray-400 text-xs">Tue-Thu 10am-12pm</div>
          </div>
        </div>
      </div>
    </div>
  );
}
