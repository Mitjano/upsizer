"use client";

import { useState } from 'react';

interface ModerationRule {
  id: string;
  name: string;
  type: 'keyword' | 'pattern' | 'ai' | 'custom';
  target: 'post' | 'comment' | 'user_profile' | 'all';
  severity: 'low' | 'medium' | 'high' | 'critical';
  action: 'flag' | 'auto_approve' | 'auto_reject' | 'quarantine';
  keywords?: string[];
  pattern?: string;
  aiPrompt?: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ModerationQueue {
  id: string;
  contentType: 'post' | 'comment' | 'user_profile' | 'other';
  contentId: string;
  content: string;
  author: string;
  status: 'pending' | 'approved' | 'rejected' | 'flagged';
  flags: {
    ruleId: string;
    ruleName: string;
    severity: string;
    reason: string;
    confidence?: number;
  }[];
  reviewedBy?: string;
  reviewedAt?: string;
  notes?: string;
  createdAt: string;
}

interface ModerationClientProps {
  rules: ModerationRule[];
  queue: ModerationQueue[];
  stats: {
    totalRules: number;
    activeRules: number;
    totalQueue: number;
    pending: number;
    flagged: number;
    approved: number;
    rejected: number;
  };
}

export default function ModerationClient({ rules, queue, stats }: ModerationClientProps) {
  const [activeTab, setActiveTab] = useState<'rules' | 'queue'>('queue');
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [editingRule, setEditingRule] = useState<ModerationRule | null>(null);
  const [reviewingItem, setReviewingItem] = useState<ModerationQueue | null>(null);

  // Rule form
  const [name, setName] = useState('');
  const [ruleType, setRuleType] = useState<'keyword' | 'pattern' | 'ai' | 'custom'>('keyword');
  const [target, setTarget] = useState<'post' | 'comment' | 'user_profile' | 'all'>('all');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [actionType, setActionType] = useState<'flag' | 'auto_approve' | 'auto_reject' | 'quarantine'>('flag');
  const [keywords, setKeywords] = useState('');
  const [pattern, setPattern] = useState('');
  const [enabled, setEnabled] = useState(true);

  // Review form
  const [reviewStatus, setReviewStatus] = useState<'approved' | 'rejected' | 'flagged'>('approved');
  const [reviewNotes, setReviewNotes] = useState('');

  // Filters
  const [queueFilter, setQueueFilter] = useState<string>('all');

  const resetRuleForm = () => {
    setName('');
    setRuleType('keyword');
    setTarget('all');
    setSeverity('medium');
    setActionType('flag');
    setKeywords('');
    setPattern('');
    setEnabled(true);
    setEditingRule(null);
  };

  const handleCreateRule = async () => {
    if (!name) {
      alert('Please provide a rule name');
      return;
    }

    await fetch('/api/admin/moderation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        ruleType,
        target,
        severity,
        actionType,
        keywords: ruleType === 'keyword' ? keywords : undefined,
        pattern: ruleType === 'pattern' ? pattern : undefined,
        enabled,
      }),
    });

    resetRuleForm();
    setShowRuleModal(false);
    window.location.reload();
  };

  const handleEditRule = (rule: ModerationRule) => {
    setEditingRule(rule);
    setName(rule.name);
    setRuleType(rule.type);
    setTarget(rule.target);
    setSeverity(rule.severity);
    setActionType(rule.action);
    setKeywords(rule.keywords?.join(', ') || '');
    setPattern(rule.pattern || '');
    setEnabled(rule.enabled);
    setShowRuleModal(true);
  };

  const handleUpdateRule = async () => {
    if (!editingRule) return;

    await fetch('/api/admin/moderation', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editingRule.id,
        updates: {
          name,
          type: ruleType,
          target,
          severity,
          action: actionType,
          keywords: ruleType === 'keyword' ? keywords : undefined,
          pattern: ruleType === 'pattern' ? pattern : undefined,
          enabled,
        },
      }),
    });

    resetRuleForm();
    setShowRuleModal(false);
    window.location.reload();
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm('Are you sure you want to delete this moderation rule?')) return;

    await fetch(`/api/admin/moderation?id=${id}`, {
      method: 'DELETE',
    });
    window.location.reload();
  };

  const handleReview = (item: ModerationQueue) => {
    setReviewingItem(item);
    setReviewStatus(item.status === 'pending' ? 'approved' : item.status as any);
    setReviewNotes(item.notes || '');
    setShowReviewModal(true);
  };

  const handleSubmitReview = async () => {
    if (!reviewingItem) return;

    await fetch('/api/admin/moderation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'queue',
        action: 'review',
        queueId: reviewingItem.id,
        status: reviewStatus,
        notes: reviewNotes,
      }),
    });

    setShowReviewModal(false);
    setReviewingItem(null);
    window.location.reload();
  };

  const handleDeleteQueueItem = async (id: string) => {
    if (!confirm('Remove this item from the queue?')) return;

    await fetch(`/api/admin/moderation?id=${id}&type=queue`, {
      method: 'DELETE',
    });
    window.location.reload();
  };

  const filteredQueue = queue.filter(q => {
    if (queueFilter !== 'all' && q.status !== queueFilter) return false;
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">AI Content Moderator</h1>
          <p className="text-gray-400 text-lg">Automated content moderation and review queue</p>
        </div>
        <button
          onClick={() => {
            resetRuleForm();
            setShowRuleModal(true);
          }}
          className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
        >
          + Create Rule
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-xl p-6">
          <div className="text-sm text-blue-400 font-semibold mb-2">Active Rules</div>
          <div className="text-4xl font-bold text-white">{stats.activeRules}</div>
          <div className="text-xs text-gray-400 mt-2">{stats.totalRules} total</div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30 rounded-xl p-6">
          <div className="text-sm text-yellow-400 font-semibold mb-2">Pending Review</div>
          <div className="text-4xl font-bold text-white">{stats.pending + stats.flagged}</div>
          <div className="text-xs text-gray-400 mt-2">{stats.pending} pending, {stats.flagged} flagged</div>
        </div>

        <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 rounded-xl p-6">
          <div className="text-sm text-green-400 font-semibold mb-2">Approved</div>
          <div className="text-4xl font-bold text-white">{stats.approved}</div>
        </div>

        <div className="bg-gradient-to-br from-red-500/20 to-red-600/20 border border-red-500/30 rounded-xl p-6">
          <div className="text-sm text-red-400 font-semibold mb-2">Rejected</div>
          <div className="text-4xl font-bold text-white">{stats.rejected}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-700">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-4 py-2 font-medium transition ${
              activeTab === 'queue'
                ? 'text-white border-b-2 border-green-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Moderation Queue ({stats.totalQueue})
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`px-4 py-2 font-medium transition ${
              activeTab === 'rules'
                ? 'text-white border-b-2 border-green-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Rules ({stats.totalRules})
          </button>
        </div>
      </div>

      {/* Queue Tab */}
      {activeTab === 'queue' && (
        <div className="space-y-4">
          <div className="flex gap-4">
            <select
              value={queueFilter}
              onChange={(e) => setQueueFilter(e.target.value)}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="flagged">Flagged</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {filteredQueue.length === 0 ? (
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-12 text-center">
              <div className="text-6xl mb-4">✅</div>
              <p className="text-gray-400 text-lg">Queue is empty</p>
            </div>
          ) : (
            filteredQueue.map((item) => (
              <div
                key={item.id}
                className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        item.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                        item.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                        item.status === 'flagged' ? 'bg-orange-500/20 text-orange-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {item.status.toUpperCase()}
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400">
                        {item.contentType.toUpperCase()}
                      </span>
                      <span className="text-sm text-gray-500">by {item.author}</span>
                    </div>

                    <div className="bg-gray-900 rounded-lg p-4 mb-3">
                      <p className="text-white text-sm">{item.content}</p>
                    </div>

                    {item.flags.length > 0 && (
                      <div className="space-y-2 mb-3">
                        {item.flags.map((flag, idx) => (
                          <div key={idx} className="flex items-center gap-3 text-sm">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              flag.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                              flag.severity === 'high' ? 'bg-orange-500/20 text-orange-400' :
                              flag.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-gray-500/20 text-gray-400'
                            }`}>
                              {flag.severity.toUpperCase()}
                            </span>
                            <span className="text-gray-400">{flag.ruleName}:</span>
                            <span className="text-white">{flag.reason}</span>
                            {flag.confidence && (
                              <span className="text-gray-500">({flag.confidence}% confidence)</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {item.notes && (
                      <div className="text-sm text-gray-400 mb-2">
                        <span className="font-semibold">Notes:</span> {item.notes}
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{new Date(item.createdAt).toLocaleString()}</span>
                      {item.reviewedBy && (
                        <span>Reviewed by {item.reviewedBy}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleReview(item)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition whitespace-nowrap"
                    >
                      Review
                    </button>
                    <button
                      onClick={() => handleDeleteQueueItem(item.id)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition whitespace-nowrap"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Rules Tab */}
      {activeTab === 'rules' && (
        <div className="space-y-4">
          {rules.length === 0 ? (
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-12 text-center">
              <div className="text-6xl mb-4">🛡️</div>
              <p className="text-gray-400 text-lg">No moderation rules created yet</p>
            </div>
          ) : (
            rules.map((rule) => (
              <div
                key={rule.id}
                className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-white">{rule.name}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        rule.enabled ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {rule.enabled ? 'ENABLED' : 'DISABLED'}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        rule.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                        rule.severity === 'high' ? 'bg-orange-500/20 text-orange-400' :
                        rule.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {rule.severity.toUpperCase()}
                      </span>
                    </div>

                    <div className="flex items-center gap-6 text-sm mb-3">
                      <div>
                        <span className="text-gray-500">Type: </span>
                        <span className="text-white">{rule.type}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Target: </span>
                        <span className="text-white">{rule.target}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Action: </span>
                        <span className="text-white">{rule.action}</span>
                      </div>
                    </div>

                    {rule.keywords && rule.keywords.length > 0 && (
                      <div className="mb-2">
                        <span className="text-sm text-gray-500">Keywords: </span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {rule.keywords.map((keyword, idx) => (
                            <span key={idx} className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded">
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {rule.pattern && (
                      <div className="text-sm">
                        <span className="text-gray-500">Pattern: </span>
                        <code className="text-white font-mono">{rule.pattern}</code>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditRule(rule)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteRule(rule.id)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Create/Edit Rule Modal */}
      {showRuleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 max-w-2xl w-full my-8">
            <h2 className="text-2xl font-bold mb-6">
              {editingRule ? 'Edit Moderation Rule' : 'Create Moderation Rule'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Rule Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Spam Detector"
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Rule Type *</label>
                  <select
                    value={ruleType}
                    onChange={(e) => setRuleType(e.target.value as any)}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                  >
                    <option value="keyword">Keyword</option>
                    <option value="pattern">Regex Pattern</option>
                    <option value="ai">AI Analysis</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Target *</label>
                  <select
                    value={target}
                    onChange={(e) => setTarget(e.target.value as any)}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                  >
                    <option value="all">All Content</option>
                    <option value="post">Posts</option>
                    <option value="comment">Comments</option>
                    <option value="user_profile">User Profiles</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Severity *</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as any)}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Action *</label>
                  <select
                    value={actionType}
                    onChange={(e) => setActionType(e.target.value as any)}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                  >
                    <option value="flag">Flag for Review</option>
                    <option value="auto_approve">Auto Approve</option>
                    <option value="auto_reject">Auto Reject</option>
                    <option value="quarantine">Quarantine</option>
                  </select>
                </div>
              </div>

              {ruleType === 'keyword' && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Keywords (comma-separated)
                  </label>
                  <textarea
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    placeholder="spam, viagra, casino, xxx"
                    rows={3}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white font-mono"
                  />
                </div>
              )}

              {ruleType === 'pattern' && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Regex Pattern
                  </label>
                  <input
                    type="text"
                    value={pattern}
                    onChange={(e) => setPattern(e.target.value)}
                    placeholder="e.g., \b\d{3}-\d{3}-\d{4}\b"
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white font-mono"
                  />
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="enabled"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="enabled" className="text-sm text-gray-400">Enable this rule</label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={editingRule ? handleUpdateRule : handleCreateRule}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
              >
                {editingRule ? 'Update' : 'Create'}
              </button>
              <button
                onClick={() => {
                  resetRuleForm();
                  setShowRuleModal(false);
                }}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && reviewingItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 max-w-2xl w-full my-8">
            <h2 className="text-2xl font-bold mb-6">Review Content</h2>

            <div className="space-y-4">
              <div className="bg-gray-900 rounded-lg p-4">
                <div className="text-sm text-gray-500 mb-2">Content:</div>
                <p className="text-white">{reviewingItem.content}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Decision *</label>
                <select
                  value={reviewStatus}
                  onChange={(e) => setReviewStatus(e.target.value as any)}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                >
                  <option value="approved">Approve</option>
                  <option value="rejected">Reject</option>
                  <option value="flagged">Keep Flagged</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Notes</label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add review notes..."
                  rows={3}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSubmitReview}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
              >
                Submit Review
              </button>
              <button
                onClick={() => {
                  setShowReviewModal(false);
                  setReviewingItem(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
