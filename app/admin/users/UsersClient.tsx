"use client";

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';

interface User {
  email: string;
  name: string;
  image?: string;
  credits: number;
  usageCount: number;
  lastActive?: number;
  createdAt?: number;
  role?: 'user' | 'premium' | 'admin';
  status?: 'active' | 'banned';
}

export default function UsersClient() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [editingUser, setEditingUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const stats = {
    total: users.length,
    active: users.filter(u => u.status !== 'banned').length,
    premium: users.filter(u => u.role === 'premium').length,
    totalCredits: users.reduce((acc, u) => acc + (u.credits || 0), 0),
    totalUsage: users.reduce((acc, u) => acc + (u.usageCount || 0), 0),
  };

  const updateUserCredits = async (email: string, credits: number) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, credits }),
      });
      if (res.ok) {
        fetchUsers();
        setEditingUser(null);
      }
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 rounded-xl p-6">
          <div className="text-sm text-green-400 font-semibold mb-2">Total Users</div>
          <div className="text-3xl font-bold text-white">{stats.total}</div>
        </div>
        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-xl p-6">
          <div className="text-sm text-blue-400 font-semibold mb-2">Active</div>
          <div className="text-3xl font-bold text-white">{stats.active}</div>
        </div>
        <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 rounded-xl p-6">
          <div className="text-sm text-purple-400 font-semibold mb-2">Premium</div>
          <div className="text-3xl font-bold text-white">{stats.premium}</div>
        </div>
        <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30 rounded-xl p-6">
          <div className="text-sm text-yellow-400 font-semibold mb-2">Total Credits</div>
          <div className="text-3xl font-bold text-white">{stats.totalCredits}</div>
        </div>
        <div className="bg-gradient-to-br from-pink-500/20 to-pink-600/20 border border-pink-500/30 rounded-xl p-6">
          <div className="text-sm text-pink-400 font-semibold mb-2">Total Usage</div>
          <div className="text-3xl font-bold text-white">{stats.totalUsage}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Search</label>
            <input
              type="text"
              placeholder="Search by email or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Role</label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            >
              <option value="all">All Roles</option>
              <option value="user">User</option>
              <option value="premium">Premium</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="banned">Banned</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900/50">
              <tr className="border-b border-gray-700">
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">User</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">Email</th>
                <th className="text-center py-4 px-6 text-sm font-semibold text-gray-400">Role</th>
                <th className="text-center py-4 px-6 text-sm font-semibold text-gray-400">Credits</th>
                <th className="text-center py-4 px-6 text-sm font-semibold text-gray-400">Usage</th>
                <th className="text-center py-4 px-6 text-sm font-semibold text-gray-400">Status</th>
                <th className="text-center py-4 px-6 text-sm font-semibold text-gray-400">Last Active</th>
                <th className="text-right py-4 px-6 text-sm font-semibold text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, index) => (
                  <tr key={index} className="border-b border-gray-800 hover:bg-gray-700/30 transition">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        {user.image ? (
                          <img src={user.image} alt={user.name} className="w-10 h-10 rounded-full" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center font-bold">
                            {user.name?.[0] || user.email[0].toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-white">{user.name || 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-300 font-mono text-sm">{user.email}</td>
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        user.role === 'admin' ? 'bg-red-500/20 text-red-400' :
                        user.role === 'premium' ? 'bg-purple-500/20 text-purple-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {user.role || 'user'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      {editingUser?.email === user.email ? (
                        <input
                          type="number"
                          defaultValue={user.credits}
                          className="w-20 px-2 py-1 bg-gray-900 border border-gray-700 rounded text-center"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              updateUserCredits(user.email, parseInt(e.currentTarget.value));
                            }
                          }}
                        />
                      ) : (
                        <span className="font-semibold text-green-400">{user.credits}</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-center text-blue-400 font-semibold">{user.usageCount}</td>
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        user.status === 'banned' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                      }`}>
                        {user.status || 'active'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center text-gray-400 text-sm">
                      {user.lastActive ? formatDistanceToNow(user.lastActive, { addSuffix: true }) : 'Never'}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingUser(editingUser?.email === user.email ? null : user)}
                          className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-sm font-medium transition"
                        >
                          {editingUser?.email === user.email ? 'Cancel' : 'Edit'}
                        </button>
                        <button className="px-3 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg text-sm font-medium transition">
                          History
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

      {/* Results Count */}
      <div className="text-center text-gray-400">
        Showing {filteredUsers.length} of {users.length} users
      </div>
    </div>
  );
}
