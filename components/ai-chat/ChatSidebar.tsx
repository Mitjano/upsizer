"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FaPlus, FaSearch, FaEllipsisV, FaTrash, FaEdit, FaThumbtack, FaArchive, FaShare } from "react-icons/fa";
import { HiSparkles } from "react-icons/hi2";

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

interface ChatSidebarProps {
  conversations: Conversation[];
  currentConversationId?: string;
  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, title: string) => void;
  onPinConversation: (id: string, isPinned: boolean) => void;
  onArchiveConversation: (id: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function ChatSidebar({
  conversations,
  currentConversationId,
  onNewChat,
  onSelectConversation,
  onDeleteConversation,
  onRenameConversation,
  onPinConversation,
  onArchiveConversation,
  isCollapsed = false,
}: ChatSidebarProps) {
  const t = useTranslations("chat");
  const [searchQuery, setSearchQuery] = useState("");
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  // Filtruj konwersacje
  const filteredConversations = conversations.filter((conv) =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Grupuj: przypięte na górze
  const pinnedConversations = filteredConversations.filter((c) => c.isPinned);
  const regularConversations = filteredConversations.filter((c) => !c.isPinned);

  const handleStartEdit = (conv: Conversation) => {
    setEditingId(conv.id);
    setEditTitle(conv.title);
    setMenuOpenId(null);
  };

  const handleSaveEdit = (id: string) => {
    if (editTitle.trim()) {
      onRenameConversation(id, editTitle.trim());
    }
    setEditingId(null);
    setEditTitle("");
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
    } else if (days === 1) {
      return "Wczoraj";
    } else if (days < 7) {
      return date.toLocaleDateString("pl-PL", { weekday: "short" });
    } else {
      return date.toLocaleDateString("pl-PL", { day: "numeric", month: "short" });
    }
  };

  if (isCollapsed) {
    return (
      <div className="w-16 h-full bg-gray-100 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col items-center py-4">
        <button
          onClick={onNewChat}
          className="w-10 h-10 rounded-lg bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center transition-colors"
          title={t("newChat")}
        >
          <FaPlus className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-64 lg:w-72 h-full bg-gray-100 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col shrink-0">
      {/* Header */}
      <div className="p-4 space-y-3">
        {/* New chat button */}
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors"
        >
          <FaPlus className="w-4 h-4" />
          <span>{t("newChat")}</span>
        </button>

        {/* Search */}
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("search.placeholder")}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Conversations list */}
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {filteredConversations.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <HiSparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{searchQuery ? t("search.noResults") : t("noHistory")}</p>
          </div>
        ) : (
          <>
            {/* Pinned conversations */}
            {pinnedConversations.length > 0 && (
              <div className="mb-4">
                <div className="px-2 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Przypięte
                </div>
                {pinnedConversations.map((conv) => (
                  <ConversationItem
                    key={conv.id}
                    conversation={conv}
                    isActive={conv.id === currentConversationId}
                    isEditing={editingId === conv.id}
                    editTitle={editTitle}
                    menuOpen={menuOpenId === conv.id}
                    onSelect={() => onSelectConversation(conv.id)}
                    onMenuToggle={() => setMenuOpenId(menuOpenId === conv.id ? null : conv.id)}
                    onEdit={() => handleStartEdit(conv)}
                    onEditChange={setEditTitle}
                    onEditSave={() => handleSaveEdit(conv.id)}
                    onEditCancel={() => setEditingId(null)}
                    onDelete={() => {
                      onDeleteConversation(conv.id);
                      setMenuOpenId(null);
                    }}
                    onPin={() => {
                      onPinConversation(conv.id, !conv.isPinned);
                      setMenuOpenId(null);
                    }}
                    onArchive={() => {
                      onArchiveConversation(conv.id);
                      setMenuOpenId(null);
                    }}
                    formatDate={formatDate}
                    t={t}
                  />
                ))}
              </div>
            )}

            {/* Regular conversations */}
            {regularConversations.map((conv) => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                isActive={conv.id === currentConversationId}
                isEditing={editingId === conv.id}
                editTitle={editTitle}
                menuOpen={menuOpenId === conv.id}
                onSelect={() => onSelectConversation(conv.id)}
                onMenuToggle={() => setMenuOpenId(menuOpenId === conv.id ? null : conv.id)}
                onEdit={() => handleStartEdit(conv)}
                onEditChange={setEditTitle}
                onEditSave={() => handleSaveEdit(conv.id)}
                onEditCancel={() => setEditingId(null)}
                onDelete={() => {
                  onDeleteConversation(conv.id);
                  setMenuOpenId(null);
                }}
                onPin={() => {
                  onPinConversation(conv.id, !conv.isPinned);
                  setMenuOpenId(null);
                }}
                onArchive={() => {
                  onArchiveConversation(conv.id);
                  setMenuOpenId(null);
                }}
                formatDate={formatDate}
                t={t}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

// Subcomponent for conversation item
interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  isEditing: boolean;
  editTitle: string;
  menuOpen: boolean;
  onSelect: () => void;
  onMenuToggle: () => void;
  onEdit: () => void;
  onEditChange: (value: string) => void;
  onEditSave: () => void;
  onEditCancel: () => void;
  onDelete: () => void;
  onPin: () => void;
  onArchive: () => void;
  formatDate: (date: string) => string;
  t: ReturnType<typeof useTranslations>;
}

function ConversationItem({
  conversation,
  isActive,
  isEditing,
  editTitle,
  menuOpen,
  onSelect,
  onMenuToggle,
  onEdit,
  onEditChange,
  onEditSave,
  onEditCancel,
  onDelete,
  onPin,
  onArchive,
  formatDate,
  t,
}: ConversationItemProps) {
  return (
    <div
      className={`
        group relative flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors
        ${isActive ? "bg-purple-100 dark:bg-purple-900/30" : "hover:bg-gray-200 dark:hover:bg-gray-800"}
      `}
    >
      {isEditing ? (
        <input
          type="text"
          value={editTitle}
          onChange={(e) => onEditChange(e.target.value)}
          onBlur={onEditSave}
          onKeyDown={(e) => {
            if (e.key === "Enter") onEditSave();
            if (e.key === "Escape") onEditCancel();
          }}
          className="flex-1 px-2 py-1 text-sm rounded border border-purple-500 bg-white dark:bg-gray-800 focus:outline-none"
          autoFocus
        />
      ) : (
        <>
          <div className="flex-1 min-w-0" onClick={onSelect}>
            <div className="flex items-center gap-1">
              {conversation.isPinned && (
                <FaThumbtack className="w-3 h-3 text-purple-500 flex-shrink-0" />
              )}
              <span className="text-sm font-medium truncate text-gray-900 dark:text-white">
                {conversation.title}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span>{formatDate(conversation.lastMessageAt || conversation.createdAt)}</span>
              <span>•</span>
              <span>{conversation.messageCount} wiad.</span>
            </div>
          </div>

          {/* Menu button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMenuToggle();
            }}
            className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-gray-300 dark:hover:bg-gray-700 transition-opacity"
          >
            <FaEllipsisV className="w-3 h-3 text-gray-500" />
          </button>

          {/* Dropdown menu */}
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 z-10 w-40 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg py-1">
              <button
                onClick={onEdit}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <FaEdit className="w-3 h-3" />
                <span>{t("renameConversation")}</span>
              </button>
              <button
                onClick={onPin}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <FaThumbtack className="w-3 h-3" />
                <span>{conversation.isPinned ? t("unpinConversation") : t("pinConversation")}</span>
              </button>
              <button
                onClick={onArchive}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <FaArchive className="w-3 h-3" />
                <span>{t("archiveConversation")}</span>
              </button>
              <hr className="my-1 border-gray-200 dark:border-gray-700" />
              <button
                onClick={onDelete}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <FaTrash className="w-3 h-3" />
                <span>{t("deleteConversation")}</span>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
