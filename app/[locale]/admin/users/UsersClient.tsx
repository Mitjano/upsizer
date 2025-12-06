"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/lib/db';
import toast from 'react-hot-toast';

interface UsersClientProps {
  users: User[];
}

export default function UsersClient({ users: initialUsers }: UsersClientProps) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [editingCredits, setEditingCredits] = useState<{ [key: string]: number }>({});

  const navigateToUser = (userId: string) => {
    router.push(`/admin/users/${userId}`);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(search.toLowerCase()) ||
      user.name?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleUpdateUser = async (userId: string, updates: Partial<User>) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, updates }),
      });

      if (!res.ok) throw new Error('Failed to update user');

      const { user: updatedUser } = await res.json();

      setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
      toast.success('User updated successfully');
    } catch (error) {
      toast.error('Failed to update user');
      console.error(error);
    }
  };

  const totalCredits = users.reduce((sum, u) => sum + u.credits, 0);
  const totalUsage = users.reduce((sum, u) => sum + u.totalUsage, 0);

  const handleExport = (type: 'all' | 'emails' | 'newsletter') => {
    let url = '/api/admin/users/export?';
    if (type === 'emails') {
      url += 'fields=email';
    } else if (type === 'newsletter') {
      url += 'newsletter=true';
    }
    window.location.href = url;
    toast.success('Export started...');
  };

  return (
    <div className="space-y-6">
      {/* Export Buttons */}
      <div className="flex gap-3 justify-end">
        <button
          onClick={() => handleExport('all')}
          className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg text-sm font-medium transition flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export All (XLSX)
        </button>
        <button
          onClick={() => handleExport('emails')}
          className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-sm font-medium transition flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Export Emails Only
        </button>
        <button
          onClick={() => handleExport('newsletter')}
          className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg text-sm font-medium transition flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
          Newsletter Subscribers
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
          <div className="text-sm text-gray-400 mb-1">Total Credits</div>
          <div className="text-2xl font-bold text-green-400">{totalCredits.toLocaleString()}</div>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
          <div className="text-sm text-gray-400 mb-1">Total Usage</div>
          <div className="text-2xl font-bold text-blue-400">{totalUsage.toLocaleString()}</div>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
          <div className="text-sm text-gray-400 mb-1">Premium Users</div>
          <div className="text-2xl font-bold text-purple-400">
            {users.filter(u => u.role === 'premium' || u.role === 'admin').length}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search by email or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-green-500 focus:outline-none"
            />
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-green-500 focus:outline-none"
          >
            <option value="all">All Roles</option>
            <option value="user">User</option>
            <option value="premium">Premium</option>
            <option value="admin">Admin</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-green-500 focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="banned">Banned</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900/50">
              <tr className="border-b border-gray-700">
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">User</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">Role</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">Status</th>
                <th className="text-right py-4 px-6 text-sm font-semibold text-gray-400">Credits</th>
                <th className="text-right py-4 px-6 text-sm font-semibold text-gray-400">Usage</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">Joined</th>
                <th className="text-right py-4 px-6 text-sm font-semibold text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-gray-800 hover:bg-gray-700/30 cursor-pointer transition">
                    <td className="py-4 px-6" onClick={() => navigateToUser(user.id)}>
                      <div className="flex items-center gap-3">
                        {user.image ? (
                          <img src={user.image} alt="" className="w-10 h-10 rounded-full" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center text-white font-bold">
                            {user.email[0].toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-white hover:text-green-400 transition">{user.name || 'No name'}</div>
                          <div className="text-sm text-gray-400">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <select
                        value={user.role}
                        onChange={(e) => handleUpdateUser(user.id, { role: e.target.value as any })}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold bg-gray-900 border ${
                          user.role === 'admin'
                            ? 'border-green-500 text-green-400'
                            : user.role === 'premium'
                            ? 'border-purple-500 text-purple-400'
                            : 'border-gray-600 text-gray-400'
                        }`}
                      >
                        <option value="user">User</option>
                        <option value="premium">Premium</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="py-4 px-6">
                      <select
                        value={user.status}
                        onChange={(e) => handleUpdateUser(user.id, { status: e.target.value as any })}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold bg-gray-900 border ${
                          user.status === 'active'
                            ? 'border-green-500 text-green-400'
                            : user.status === 'banned'
                            ? 'border-red-500 text-red-400'
                            : 'border-yellow-500 text-yellow-400'
                        }`}
                      >
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                        <option value="banned">Banned</option>
                      </select>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <input
                        type="number"
                        value={editingCredits[user.id] ?? user.credits}
                        onChange={(e) => setEditingCredits({
                          ...editingCredits,
                          [user.id]: parseInt(e.target.value) || 0,
                        })}
                        onBlur={() => {
                          if (editingCredits[user.id] !== undefined && editingCredits[user.id] !== user.credits) {
                            handleUpdateUser(user.id, { credits: editingCredits[user.id] });
                          }
                        }}
                        className="w-20 px-2 py-1 bg-gray-900 border border-gray-700 rounded text-green-400 font-bold text-right focus:border-green-500 focus:outline-none"
                      />
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span className="text-blue-400 font-semibold">{user.totalUsage}</span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm text-gray-400">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                      {user.lastLoginAt && (
                        <div className="text-xs text-gray-500">
                          Last: {new Date(user.lastLoginAt).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigateToUser(user.id)}
                          className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-sm font-medium transition"
                        >
                          View
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateUser(user.id, { credits: user.credits + 10 });
                          }}
                          className="px-3 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg text-sm font-medium transition"
                        >
                          +10 Credits
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-gray-400 text-center">
        Showing {filteredUsers.length} of {users.length} users
      </div>
    </div>
  );
}
