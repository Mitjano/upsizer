"use client";

import { useState } from 'react';
import { nanoid } from 'nanoid';

interface ABTest {
  id: string;
  name: string;
  description: string;
  type: 'page' | 'feature' | 'email' | 'cta' | 'custom';
  status: 'draft' | 'running' | 'paused' | 'completed';
  variants: {
    id: string;
    name: string;
    description?: string;
    traffic: number;
    conversions: number;
    visitors: number;
  }[];
  targetMetric: string;
  targetUrl?: string;
  startDate?: string;
  endDate?: string;
  winner?: string;
  confidence?: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

interface ABTestsClientProps {
  tests: ABTest[];
  stats: {
    total: number;
    running: number;
    completed: number;
    draft: number;
    paused: number;
  };
}

export default function ABTestsClient({ tests, stats }: ABTestsClientProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingTest, setEditingTest] = useState<ABTest | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'page' | 'feature' | 'email' | 'cta' | 'custom'>('page');
  const [targetMetric, setTargetMetric] = useState('conversions');
  const [targetUrl, setTargetUrl] = useState('');
  const [variants, setVariants] = useState<{ id: string; name: string; description: string; traffic: number }[]>([
    { id: nanoid(), name: 'Control (A)', description: '', traffic: 50 },
    { id: nanoid(), name: 'Variant B', description: '', traffic: 50 },
  ]);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const resetForm = () => {
    setName('');
    setDescription('');
    setType('page');
    setTargetMetric('conversions');
    setTargetUrl('');
    setVariants([
      { id: nanoid(), name: 'Control (A)', description: '', traffic: 50 },
      { id: nanoid(), name: 'Variant B', description: '', traffic: 50 },
    ]);
    setEditingTest(null);
  };

  const addVariant = () => {
    const newTraffic = Math.floor(100 / (variants.length + 1));
    const updatedVariants = variants.map(v => ({ ...v, traffic: newTraffic }));
    updatedVariants.push({
      id: nanoid(),
      name: `Variant ${String.fromCharCode(66 + variants.length)}`,
      description: '',
      traffic: newTraffic,
    });
    setVariants(updatedVariants);
  };

  const removeVariant = (id: string) => {
    if (variants.length <= 2) {
      alert('A/B test must have at least 2 variants');
      return;
    }
    const filtered = variants.filter(v => v.id !== id);
    const newTraffic = Math.floor(100 / filtered.length);
    setVariants(filtered.map(v => ({ ...v, traffic: newTraffic })));
  };

  const updateVariant = (id: string, field: string, value: any) => {
    setVariants(variants.map(v => v.id === id ? { ...v, [field]: value } : v));
  };

  const handleCreate = async () => {
    if (!name || variants.length < 2) {
      alert('Please provide a name and at least 2 variants');
      return;
    }

    await fetch('/api/admin/ab-tests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        description,
        type,
        targetMetric,
        targetUrl: targetUrl || undefined,
        variants,
      }),
    });

    resetForm();
    setShowModal(false);
    window.location.reload();
  };

  const handleEdit = (test: ABTest) => {
    setEditingTest(test);
    setName(test.name);
    setDescription(test.description);
    setType(test.type);
    setTargetMetric(test.targetMetric);
    setTargetUrl(test.targetUrl || '');
    setVariants(test.variants.map(v => ({
      id: v.id,
      name: v.name,
      description: v.description || '',
      traffic: v.traffic,
    })));
    setShowModal(true);
  };

  const handleUpdate = async () => {
    if (!editingTest) return;

    await fetch('/api/admin/ab-tests', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editingTest.id,
        updates: {
          name,
          description,
          type,
          targetMetric,
          targetUrl: targetUrl || undefined,
          variants: variants.map(v => ({
            ...v,
            conversions: editingTest.variants.find(ev => ev.id === v.id)?.conversions || 0,
            visitors: editingTest.variants.find(ev => ev.id === v.id)?.visitors || 0,
          })),
        },
      }),
    });

    resetForm();
    setShowModal(false);
    window.location.reload();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this A/B test?')) return;

    await fetch(`/api/admin/ab-tests?id=${id}`, {
      method: 'DELETE',
    });
    window.location.reload();
  };

  const handleStatusChange = async (id: string, status: string) => {
    const updates: any = { status };

    if (status === 'running' && !tests.find(t => t.id === id)?.startDate) {
      updates.startDate = new Date().toISOString();
    }

    if (status === 'completed' && !tests.find(t => t.id === id)?.endDate) {
      updates.endDate = new Date().toISOString();
    }

    await fetch('/api/admin/ab-tests', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, updates }),
    });

    window.location.reload();
  };

  const handleCalculateWinner = async (id: string) => {
    const response = await fetch('/api/admin/ab-tests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'calculate_winner',
        testId: id,
      }),
    });

    if (response.ok) {
      alert('Winner calculated successfully!');
      window.location.reload();
    } else {
      alert('Not enough data to calculate winner');
    }
  };

  const filteredTests = tests.filter(t => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">A/B Testing Dashboard</h1>
          <p className="text-gray-400 text-lg">Create and manage A/B tests for optimization</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
        >
          + Create A/B Test
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-6">
        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-xl p-6">
          <div className="text-sm text-blue-400 font-semibold mb-2">Total Tests</div>
          <div className="text-4xl font-bold text-white">{stats.total}</div>
        </div>

        <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 rounded-xl p-6">
          <div className="text-sm text-green-400 font-semibold mb-2">Running</div>
          <div className="text-4xl font-bold text-white">{stats.running}</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 rounded-xl p-6">
          <div className="text-sm text-purple-400 font-semibold mb-2">Completed</div>
          <div className="text-4xl font-bold text-white">{stats.completed}</div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30 rounded-xl p-6">
          <div className="text-sm text-yellow-400 font-semibold mb-2">Draft</div>
          <div className="text-4xl font-bold text-white">{stats.draft}</div>
        </div>

        <div className="bg-gradient-to-br from-gray-500/20 to-gray-600/20 border border-gray-500/30 rounded-xl p-6">
          <div className="text-sm text-gray-400 font-semibold mb-2">Paused</div>
          <div className="text-4xl font-bold text-white">{stats.paused}</div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-4">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
        >
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="running">Running</option>
          <option value="paused">Paused</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Tests List */}
      <div className="space-y-4">
        {filteredTests.length === 0 ? (
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-12 text-center">
            <div className="text-6xl mb-4">🧪</div>
            <p className="text-gray-400 text-lg">No A/B tests created yet</p>
          </div>
        ) : (
          filteredTests.map((test) => {
            const totalVisitors = test.variants.reduce((sum, v) => sum + v.visitors, 0);
            const totalConversions = test.variants.reduce((sum, v) => sum + v.conversions, 0);
            const overallRate = totalVisitors > 0 ? ((totalConversions / totalVisitors) * 100).toFixed(2) : '0.00';

            return (
              <div
                key={test.id}
                className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-white">{test.name}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        test.status === 'running' ? 'bg-green-500/20 text-green-400' :
                        test.status === 'completed' ? 'bg-blue-500/20 text-blue-400' :
                        test.status === 'paused' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {test.status.toUpperCase()}
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-400">
                        {test.type.toUpperCase()}
                      </span>
                    </div>
                    {test.description && <p className="text-gray-400 mb-3">{test.description}</p>}
                    <div className="flex items-center gap-6 text-sm mb-4">
                      <div>
                        <span className="text-gray-500">Target: </span>
                        <span className="text-white">{test.targetMetric}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Visitors: </span>
                        <span className="text-white font-semibold">{totalVisitors}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Conversions: </span>
                        <span className="text-white font-semibold">{totalConversions}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Rate: </span>
                        <span className="text-white font-semibold">{overallRate}%</span>
                      </div>
                      {test.winner && test.confidence && (
                        <div>
                          <span className="text-gray-500">Confidence: </span>
                          <span className="text-green-400 font-semibold">{test.confidence}%</span>
                        </div>
                      )}
                    </div>

                    {/* Variants */}
                    <div className="grid grid-cols-3 gap-3">
                      {test.variants.map((variant) => {
                        const rate = variant.visitors > 0 ? ((variant.conversions / variant.visitors) * 100).toFixed(2) : '0.00';
                        const isWinner = test.winner === variant.id;

                        return (
                          <div
                            key={variant.id}
                            className={`p-3 rounded-lg border ${
                              isWinner
                                ? 'bg-green-500/10 border-green-500/50'
                                : 'bg-gray-900/50 border-gray-700'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold text-white">{variant.name}</span>
                              {isWinner && <span className="text-green-400 text-xs">🏆 WINNER</span>}
                            </div>
                            <div className="text-xs space-y-1">
                              <div className="text-gray-400">Traffic: {variant.traffic}%</div>
                              <div className="text-gray-400">Visitors: {variant.visitors}</div>
                              <div className="text-gray-400">Conversions: {variant.conversions}</div>
                              <div className="text-white font-semibold">Rate: {rate}%</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {test.status === 'draft' && (
                      <button
                        onClick={() => handleStatusChange(test.id, 'running')}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition whitespace-nowrap"
                      >
                        Start Test
                      </button>
                    )}
                    {test.status === 'running' && (
                      <>
                        <button
                          onClick={() => handleStatusChange(test.id, 'paused')}
                          className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition whitespace-nowrap"
                        >
                          Pause
                        </button>
                        <button
                          onClick={() => handleCalculateWinner(test.id)}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition whitespace-nowrap"
                        >
                          Calculate Winner
                        </button>
                        <button
                          onClick={() => handleStatusChange(test.id, 'completed')}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition whitespace-nowrap"
                        >
                          Complete
                        </button>
                      </>
                    )}
                    {test.status === 'paused' && (
                      <button
                        onClick={() => handleStatusChange(test.id, 'running')}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition whitespace-nowrap"
                      >
                        Resume
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(test)}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition whitespace-nowrap"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(test.id)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition whitespace-nowrap"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 max-w-4xl w-full my-8">
            <h2 className="text-2xl font-bold mb-6">
              {editingTest ? 'Edit A/B Test' : 'Create A/B Test'}
            </h2>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Test Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Homepage Hero CTA"
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Test Type *
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                  >
                    <option value="page">Page Test</option>
                    <option value="feature">Feature Test</option>
                    <option value="email">Email Test</option>
                    <option value="cta">CTA Test</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What are you testing?"
                  rows={2}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Target Metric
                  </label>
                  <input
                    type="text"
                    value={targetMetric}
                    onChange={(e) => setTargetMetric(e.target.value)}
                    placeholder="e.g., conversions, clicks, signups"
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Target URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={targetUrl}
                    onChange={(e) => setTargetUrl(e.target.value)}
                    placeholder="https://example.com/page"
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-400">
                    Variants (min. 2)
                  </label>
                  <button
                    onClick={addVariant}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition"
                  >
                    + Add Variant
                  </button>
                </div>

                <div className="space-y-3">
                  {variants.map((variant, index) => (
                    <div key={variant.id} className="p-4 bg-gray-900 rounded-lg border border-gray-700">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 grid grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Name *</label>
                            <input
                              type="text"
                              value={variant.name}
                              onChange={(e) => updateVariant(variant.id, 'name', e.target.value)}
                              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="block text-xs text-gray-500 mb-1">Description</label>
                            <input
                              type="text"
                              value={variant.description}
                              onChange={(e) => updateVariant(variant.id, 'description', e.target.value)}
                              placeholder="What's different?"
                              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Traffic % *</label>
                            <input
                              type="number"
                              value={variant.traffic}
                              onChange={(e) => updateVariant(variant.id, 'traffic', parseInt(e.target.value))}
                              min="0"
                              max="100"
                              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
                            />
                          </div>
                        </div>
                        {variants.length > 2 && (
                          <button
                            onClick={() => removeVariant(variant.id)}
                            className="mt-6 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={editingTest ? handleUpdate : handleCreate}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
              >
                {editingTest ? 'Update' : 'Create'}
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
    </div>
  );
}
