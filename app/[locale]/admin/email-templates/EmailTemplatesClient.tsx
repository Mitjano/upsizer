"use client";

import { useState } from 'react';

interface EmailTemplate {
  id: string;
  name: string;
  slug: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  variables: string[];
  category: 'transactional' | 'marketing' | 'system';
  status: 'active' | 'draft';
  createdAt: string;
  updatedAt: string;
  lastUsedAt?: string;
  usageCount: number;
}

interface EmailTemplatesClientProps {
  templates: EmailTemplate[];
  stats: {
    total: number;
    active: number;
    draft: number;
    transactional: number;
    marketing: number;
    system: number;
    totalUsage: number;
  };
}

interface PreviewData {
  subject: string;
  html: string;
  text: string;
}

export default function EmailTemplatesClient({ templates, stats }: EmailTemplatesClientProps) {
  const [showModal, setShowModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [subject, setSubject] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [textContent, setTextContent] = useState('');
  const [variables, setVariables] = useState('');
  const [category, setCategory] = useState<'transactional' | 'marketing' | 'system'>('transactional');
  const [status, setStatus] = useState<'active' | 'draft'>('draft');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const resetForm = () => {
    setName('');
    setSlug('');
    setSubject('');
    setHtmlContent('');
    setTextContent('');
    setVariables('');
    setCategory('transactional');
    setStatus('draft');
    setEditingTemplate(null);
  };

  const handleCreate = async () => {
    if (!name || !slug || !subject) {
      alert('Please fill in all required fields');
      return;
    }

    const varArray = variables.split(',').map(v => v.trim()).filter(v => v);

    await fetch('/api/admin/email-templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        slug,
        subject,
        htmlContent,
        textContent,
        variables: varArray,
        category,
        status,
      }),
    });

    resetForm();
    setShowModal(false);
    window.location.reload();
  };

  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setName(template.name);
    setSlug(template.slug);
    setSubject(template.subject);
    setHtmlContent(template.htmlContent);
    setTextContent(template.textContent);
    setVariables(template.variables.join(', '));
    setCategory(template.category);
    setStatus(template.status);
    setShowModal(true);
  };

  const handleUpdate = async () => {
    if (!editingTemplate) return;

    const varArray = variables.split(',').map(v => v.trim()).filter(v => v);

    await fetch('/api/admin/email-templates', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editingTemplate.id,
        updates: {
          name,
          subject,
          htmlContent,
          textContent,
          variables: varArray,
          category,
          status,
        },
      }),
    });

    resetForm();
    setShowModal(false);
    window.location.reload();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this email template?')) return;

    await fetch(`/api/admin/email-templates?id=${id}`, {
      method: 'DELETE',
    });
    window.location.reload();
  };

  const handlePreview = async (templateSlug: string) => {
    setPreviewLoading(true);
    setShowPreview(true);
    try {
      const response = await fetch('/api/admin/email-templates/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: templateSlug }),
      });
      if (response.ok) {
        const data = await response.json();
        setPreviewData(data.preview);
      } else {
        setPreviewData(null);
      }
    } catch (err) {
      console.error('Failed to preview template:', err);
      setPreviewData(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const filteredTemplates = templates.filter(t => {
    if (filterCategory !== 'all' && t.category !== filterCategory) return false;
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Email Templates</h1>
          <p className="text-gray-400 text-lg">Manage your email communication templates</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
        >
          + Create Template
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-xl p-6">
          <div className="text-sm text-blue-400 font-semibold mb-2">Total Templates</div>
          <div className="text-4xl font-bold text-white">{stats.total}</div>
          <div className="text-xs text-gray-400 mt-2">{stats.totalUsage} total sends</div>
        </div>

        <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 rounded-xl p-6">
          <div className="text-sm text-green-400 font-semibold mb-2">Active</div>
          <div className="text-4xl font-bold text-white">{stats.active}</div>
          <div className="text-xs text-gray-400 mt-2">{stats.draft} drafts</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 rounded-xl p-6">
          <div className="text-sm text-purple-400 font-semibold mb-2">Transactional</div>
          <div className="text-4xl font-bold text-white">{stats.transactional}</div>
        </div>

        <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 border border-orange-500/30 rounded-xl p-6">
          <div className="text-sm text-orange-400 font-semibold mb-2">Marketing</div>
          <div className="text-4xl font-bold text-white">{stats.marketing}</div>
          <div className="text-xs text-gray-400 mt-2">{stats.system} system</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
        >
          <option value="all">All Categories</option>
          <option value="transactional">Transactional</option>
          <option value="marketing">Marketing</option>
          <option value="system">System</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      {/* Templates List */}
      <div className="space-y-4">
        {filteredTemplates.length === 0 ? (
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-12 text-center">
            <div className="text-6xl mb-4">📧</div>
            <p className="text-gray-400 text-lg">No email templates found</p>
          </div>
        ) : (
          filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-white">{template.name}</h3>
                    <code className="px-2 py-1 bg-gray-900 text-blue-400 text-sm rounded font-mono">
                      {template.slug}
                    </code>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      template.status === 'active'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {template.status.toUpperCase()}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      template.category === 'transactional'
                        ? 'bg-blue-500/20 text-blue-400'
                        : template.category === 'marketing'
                        ? 'bg-purple-500/20 text-purple-400'
                        : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {template.category}
                    </span>
                  </div>
                  <p className="text-gray-400 mb-3">
                    <span className="text-gray-500">Subject:</span> {template.subject}
                  </p>
                  <div className="flex items-center gap-6 text-sm">
                    <div>
                      <span className="text-gray-500">Variables: </span>
                      <span className="text-white">{template.variables.length > 0 ? template.variables.join(', ') : 'None'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Used: </span>
                      <span className="text-white font-semibold">{template.usageCount} times</span>
                    </div>
                    {template.lastUsedAt && (
                      <div>
                        <span className="text-gray-500">Last used: </span>
                        <span className="text-white">{new Date(template.lastUsedAt).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePreview(template.slug)}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition"
                  >
                    Preview
                  </button>
                  <button
                    onClick={() => handleEdit(template)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
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

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 max-w-4xl w-full my-8">
            <h2 className="text-2xl font-bold mb-6">
              {editingTemplate ? 'Edit Email Template' : 'Create Email Template'}
            </h2>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Template Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Welcome Email"
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Slug * {editingTemplate && '(cannot be changed)'}
                  </label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))}
                    placeholder="e.g., welcome-email"
                    disabled={!!editingTemplate}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Subject Line *
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g., Welcome to {{name}}!"
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                  >
                    <option value="transactional">Transactional</option>
                    <option value="marketing">Marketing</option>
                    <option value="system">System</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Variables (comma-separated)
                </label>
                <input
                  type="text"
                  value={variables}
                  onChange={(e) => setVariables(e.target.value)}
                  placeholder="e.g., {{name}}, {{email}}, {{link}}"
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                />
                <p className="text-xs text-gray-500 mt-1">Use {'{{'} and {'}}'}  for variables</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  HTML Content
                </label>
                <textarea
                  value={htmlContent}
                  onChange={(e) => setHtmlContent(e.target.value)}
                  placeholder="<html>...</html>"
                  rows={10}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Plain Text Content
                </label>
                <textarea
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="Plain text version..."
                  rows={6}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={editingTemplate ? handleUpdate : handleCreate}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
              >
                {editingTemplate ? 'Update' : 'Create'}
              </button>
              <button
                onClick={() => {
                  resetForm();
                  setShowModal(false);
                }}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 max-w-5xl w-full my-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Email Preview</h2>
              <button
                onClick={() => {
                  setShowPreview(false);
                  setPreviewData(null);
                }}
                className="text-gray-400 hover:text-white text-2xl"
              >
                &times;
              </button>
            </div>

            {previewLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin text-4xl">&#9696;</div>
              </div>
            ) : previewData ? (
              <div className="space-y-6">
                <div className="bg-gray-900 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">Subject:</div>
                  <div className="text-lg font-medium text-white">{previewData.subject}</div>
                </div>

                <div>
                  <div className="text-sm text-gray-400 mb-2">HTML Preview:</div>
                  <div className="bg-white rounded-lg overflow-hidden">
                    <iframe
                      srcDoc={previewData.html}
                      className="w-full h-[500px] border-0"
                      title="Email HTML Preview"
                    />
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-400 mb-2">Plain Text:</div>
                  <pre className="bg-gray-900 rounded-lg p-4 text-sm text-gray-300 whitespace-pre-wrap overflow-auto max-h-64">
                    {previewData.text}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="text-center py-20 text-gray-400">
                <p>Failed to load preview. Make sure the template has content.</p>
              </div>
            )}

            <div className="flex justify-end mt-6">
              <button
                onClick={() => {
                  setShowPreview(false);
                  setPreviewData(null);
                }}
                className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
