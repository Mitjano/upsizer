"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { FaCoins, FaCog, FaBars } from "react-icons/fa";
import { HiSparkles } from "react-icons/hi2";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import ChatSidebar from "./ChatSidebar";
import ModelSelector from "./ModelSelector";
import type { AIModel } from "@/lib/ai-chat/models";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
  creditsUsed?: number;
  isError?: boolean;
  errorMessage?: string;
  createdAt?: string;
}

interface Conversation {
  id: string;
  slug: string;
  title: string;
  model: string;
  messageCount: number;
  isPinned: boolean;
  isArchived: boolean;
  createdAt: string;
  lastMessageAt: string | null;
}

export default function ChatWindow() {
  const t = useTranslations("chat");

  // State
  const [models, setModels] = useState<AIModel[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [credits, setCredits] = useState<number>(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true); // Start collapsed on mobile
  const [showSettings, setShowSettings] = useState(false);
  const [temperature, setTemperature] = useState(0.7);
  const [systemPrompt, setSystemPrompt] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch models on mount
  useEffect(() => {
    fetchModels();
    fetchCredits();
    fetchConversations();
  }, []);

  // Scroll to bottom on new messages - only when streaming or new message added
  useEffect(() => {
    if (isStreaming || messages.length > 0) {
      // Use setTimeout to ensure DOM is updated before scrolling
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [messages, isStreaming]);

  const fetchModels = async () => {
    try {
      const response = await fetch("/api/ai-chat/models");
      if (response.ok) {
        const data = await response.json();
        setModels(data.models || []);
        // Set default model
        if (data.models?.length > 0 && !selectedModelId) {
          setSelectedModelId(data.models[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to fetch models:", err);
    }
  };

  const fetchCredits = async () => {
    try {
      const response = await fetch("/api/user/credits");
      if (response.ok) {
        const data = await response.json();
        setCredits(data.credits || 0);
      }
    } catch (err) {
      console.error("Failed to fetch credits:", err);
    }
  };

  const fetchConversations = async () => {
    try {
      const response = await fetch("/api/ai-chat/conversations?limit=50");
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (err) {
      console.error("Failed to fetch conversations:", err);
    }
  };

  const loadConversation = async (id: string) => {
    try {
      const response = await fetch(`/api/ai-chat/conversations/${id}`);
      if (response.ok) {
        const data = await response.json();
        const conv = data.conversation;
        setCurrentConversationId(conv.id);
        setMessages(conv.messages || []);
        setSelectedModelId(conv.model);
        if (conv.systemPrompt) setSystemPrompt(conv.systemPrompt);
        if (conv.temperature) setTemperature(conv.temperature);
      }
    } catch (err) {
      console.error("Failed to load conversation:", err);
    }
  };

  const handleNewChat = useCallback(() => {
    setCurrentConversationId(null);
    setMessages([]);
    setSystemPrompt("");
    // Keep current model selection
  }, []);

  const handleSendMessage = async (
    content: string,
    images?: { base64: string; mimeType: string }[]
  ) => {
    if (!content.trim() && (!images || images.length === 0)) return;
    if (isLoading) return;

    // Add user message immediately
    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // Add placeholder for assistant response
    const assistantMessageId = `assistant-${Date.now()}`;
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
    };
    setMessages((prev) => [...prev, assistantMessage]);

    setIsLoading(true);
    setIsStreaming(true);

    try {
      abortControllerRef.current = new AbortController();

      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: currentConversationId,
          model: selectedModelId,
          message: content,
          images,
          temperature,
          systemPrompt: systemPrompt || undefined,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to send message");
      }

      // Get conversation ID from header
      const newConversationId = response.headers.get("X-Conversation-Id");
      if (newConversationId && !currentConversationId) {
        setCurrentConversationId(newConversationId);
      }

      // Stream response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error("No response stream");

      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === "chunk" && data.content) {
                fullContent += data.content;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId ? { ...msg, content: fullContent } : msg
                  )
                );
              }

              if (data.type === "done") {
                // Update with final data
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? {
                          ...msg,
                          content: data.content || fullContent,
                          inputTokens: data.usage?.prompt_tokens,
                          outputTokens: data.usage?.completion_tokens,
                        }
                      : msg
                  )
                );
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
      }

      // Refresh data
      fetchCredits();
      fetchConversations();
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        // User stopped generation
        return;
      }

      console.error("Chat error:", err);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                isError: true,
                errorMessage: (err as Error).message,
                content: "",
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleStopGeneration = () => {
    abortControllerRef.current?.abort();
    setIsLoading(false);
    setIsStreaming(false);
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      await fetch(`/api/ai-chat/conversations/${id}`, { method: "DELETE" });
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (currentConversationId === id) {
        handleNewChat();
      }
    } catch (err) {
      console.error("Failed to delete conversation:", err);
    }
  };

  const handleRenameConversation = async (id: string, title: string) => {
    try {
      await fetch(`/api/ai-chat/conversations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title } : c))
      );
    } catch (err) {
      console.error("Failed to rename conversation:", err);
    }
  };

  const handlePinConversation = async (id: string, isPinned: boolean) => {
    try {
      await fetch(`/api/ai-chat/conversations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPinned }),
      });
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, isPinned } : c))
      );
    } catch (err) {
      console.error("Failed to pin conversation:", err);
    }
  };

  const handleArchiveConversation = async (id: string) => {
    try {
      await fetch(`/api/ai-chat/conversations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isArchived: true }),
      });
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (currentConversationId === id) {
        handleNewChat();
      }
    } catch (err) {
      console.error("Failed to archive conversation:", err);
    }
  };

  const selectedModel = models.find((m) => m.id === selectedModelId);
  const isModelFree = selectedModel?.tier === "free";

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900">
      {/* Mobile sidebar overlay */}
      {!sidebarCollapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:relative inset-y-0 left-0 z-50
        transform transition-transform duration-300 ease-in-out
        ${sidebarCollapsed ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'}
        ${sidebarCollapsed ? 'lg:w-16' : ''}
      `}>
        <ChatSidebar
          conversations={conversations}
          currentConversationId={currentConversationId || undefined}
          onNewChat={() => { handleNewChat(); setSidebarCollapsed(true); }}
          onSelectConversation={(id) => { loadConversation(id); setSidebarCollapsed(true); }}
          onDeleteConversation={handleDeleteConversation}
          onRenameConversation={handleRenameConversation}
          onPinConversation={handlePinConversation}
          onArchiveConversation={handleArchiveConversation}
          isCollapsed={false}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <FaBars className="w-4 h-4" />
            </button>

            <ModelSelector
              models={models}
              selectedModelId={selectedModelId}
              onSelectModel={setSelectedModelId}
              disabled={isLoading}
            />

            {selectedModel && (
              <span
                className={`
                  text-xs px-2 py-1 rounded-full
                  ${isModelFree
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                  }
                `}
              >
                {isModelFree ? t("freeModel") : `~${(selectedModel.inputCostPer1M / 1000).toFixed(3)}/1K`}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
              <FaCoins className="w-4 h-4 text-yellow-500" />
              <span>{credits.toFixed(2)}</span>
            </div>

            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`
                p-2 rounded-lg transition-colors
                ${showSettings ? "bg-purple-100 text-purple-600 dark:bg-purple-900/30" : "hover:bg-gray-100 dark:hover:bg-gray-800"}
              `}
            >
              <FaCog className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Settings panel */}
        {showSettings && (
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <div className="max-w-2xl mx-auto space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("temperature")} ({temperature})
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">{t("temperatureHelp")}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("systemPrompt")}
                </label>
                <textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder={t("systemPromptPlaceholder")}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <EmptyState t={t} onSuggestionClick={(text) => handleSendMessage(text)} />
          ) : (
            <div className="max-w-3xl mx-auto">
              {messages.map((msg, idx) => (
                <ChatMessage
                  key={msg.id}
                  id={msg.id}
                  role={msg.role}
                  content={msg.content}
                  model={msg.model}
                  inputTokens={msg.inputTokens}
                  outputTokens={msg.outputTokens}
                  creditsUsed={msg.creditsUsed}
                  isError={msg.isError}
                  errorMessage={msg.errorMessage}
                  isStreaming={isStreaming && idx === messages.length - 1 && msg.role === "assistant"}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="max-w-3xl mx-auto w-full">
          <ChatInput
            onSend={handleSendMessage}
            onStop={handleStopGeneration}
            isLoading={isLoading}
            supportsImages={selectedModel?.supportsImages ?? false}
          />
        </div>
      </div>
    </div>
  );
}

// Suggestion prompts pool
const SUGGESTION_PROMPTS = [
  "Wyjaśnij teorię względności prostymi słowami",
  "Napisz kod Python do sortowania listy",
  "Pomóż mi zaplanować wycieczkę do Włoch",
  "Jak działa sztuczna inteligencja?",
  "Napisz przepis na ciasto czekoladowe",
  "Jak nauczyć się programowania od zera?",
  "Jakie są korzyści medytacji?",
  "Wymień 10 najlepszych książek wszech czasów",
  "Jak oszczędzać pieniądze na co dzień?",
  "Wyjaśnij blockchain dla początkujących",
  "Jak przygotować się do rozmowy kwalifikacyjnej?",
  "Napisz haiku o wschodzie słońca",
];

// Get random suggestions
function getRandomSuggestions(count: number = 3): string[] {
  const shuffled = [...SUGGESTION_PROMPTS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// Empty state component
function EmptyState({ t, onSuggestionClick }: { t: ReturnType<typeof useTranslations>; onSuggestionClick: (text: string) => void }) {
  const [suggestions] = useState(() => getRandomSuggestions(3));

  return (
    <div className="h-full flex flex-col items-center justify-center px-4 py-8">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
          <HiSparkles className="w-8 h-8 text-purple-600 dark:text-purple-400" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          {t("empty.title")}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          {t("empty.description")}
        </p>

        <div className="text-left">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t("empty.suggestions.title")}
          </h3>
          <div className="space-y-2">
            {suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => onSuggestionClick(suggestion)}
                className="w-full text-left px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-300 dark:hover:border-purple-700 text-sm text-gray-700 dark:text-gray-300 transition-all"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
