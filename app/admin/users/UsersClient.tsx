"use client";

import { useState } from 'react';
import { User } from '@/lib/db';
import toast from 'react-hot-toast';

interface UsersClientProps {
  users: User[];
}

export default function UsersClient({ users: initialUsers }: UsersClientProps) {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [editingCredits, setEditingCredits] = useState<{ [key: string]: number }>({});

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

  return (
    <div className="space-y-6">
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
                  <tr key={user.id} className="border-b border-gray-800 hover:bg-gray-700/30">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        {user.image ? (
                          <img src={user.image} alt="" className="w-10 h-10 rounded-full" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center text-white font-bold">
                            {user.email[0].toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-white">{user.name || 'No name'}</div>
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
                      <button
                        onClick={() => {
                          if (confirm(`Add 10 credits to ${user.email}?`)) {
                            handleUpdateUser(user.id, { credits: user.credits + 10 });
                          }
                        }}
                        className="px-3 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg text-sm font-medium transition"
                      >
                        +10 Credits
                      </button>
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
