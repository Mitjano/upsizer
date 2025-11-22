"use client";

import { useState, useEffect } from 'react';

export default function SystemPage() {
  const [logs, setLogs] = useState([
    { time: '2025-01-22 14:32:15', level: 'info', message: 'User logged in: john@example.com', service: 'auth' },
    { time: '2025-01-22 14:31:42', level: 'error', message: 'Failed to process image: timeout', service: 'upscale' },
    { time: '2025-01-22 14:30:18', level: 'warn', message: 'High memory usage detected: 87%', service: 'system' },
    { time: '2025-01-22 14:29:55', level: 'info', message: 'API request processed successfully', service: 'api' },
    { time: '2025-01-22 14:28:33', level: 'info', message: 'Database backup completed', service: 'database' },
  ]);

  const systemStats = {
    uptime: '15 days',
    cpu: 45,
    memory: 67,
    disk: 42,
    apiCalls: 15234,
    errors: 23,
    avgResponseTime: 145,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2">System Management</h1>
        <p className="text-gray-400 text-lg">Monitor system health, logs, and performance</p>
      </div>

      {/* System Health */}
      <div className="grid grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 rounded-xl p-6">
          <div className="text-sm text-green-400 font-semibold mb-2">System Uptime</div>
          <div className="text-4xl font-bold text-white mb-1">{systemStats.uptime}</div>
          <div className="text-xs text-gray-400">99.9% availability</div>
        </div>

        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-xl p-6">
          <div className="text-sm text-blue-400 font-semibold mb-2">CPU Usage</div>
          <div className="text-4xl font-bold text-white mb-1">{systemStats.cpu}%</div>
          <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
            <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${systemStats.cpu}%` }}></div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 rounded-xl p-6">
          <div className="text-sm text-purple-400 font-semibold mb-2">Memory Usage</div>
          <div className="text-4xl font-bold text-white mb-1">{systemStats.memory}%</div>
          <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
            <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${systemStats.memory}%` }}></div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30 rounded-xl p-6">
          <div className="text-sm text-yellow-400 font-semibold mb-2">Disk Usage</div>
          <div className="text-4xl font-bold text-white mb-1">{systemStats.disk}%</div>
          <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
            <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${systemStats.disk}%` }}></div>
          </div>
        </div>
      </div>

      {/* API & Performance */}
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-300">API Calls (24h)</h3>
          <div className="text-3xl font-bold text-green-400 mb-2">{systemStats.apiCalls.toLocaleString()}</div>
          <div className="text-sm text-gray-400">+8.2% from yesterday</div>
        </div>

        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-300">Error Rate</h3>
          <div className="text-3xl font-bold text-red-400 mb-2">{systemStats.errors}</div>
          <div className="text-sm text-gray-400">0.15% error rate</div>
        </div>

        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-300">Avg Response Time</h3>
          <div className="text-3xl font-bold text-blue-400 mb-2">{systemStats.avgResponseTime}ms</div>
          <div className="text-sm text-gray-400">-12ms from avg</div>
        </div>
      </div>

      {/* System Logs */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-2xl font-bold">System Logs</h2>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition">
              Filter
            </button>
            <button className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition">
              Export Logs
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full font-mono text-sm">
            <thead className="bg-gray-900/50">
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400">Time</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400">Level</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400">Service</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400">Message</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, index) => (
                <tr key={index} className="border-b border-gray-800 hover:bg-gray-700/30">
                  <td className="py-3 px-4 text-gray-400">{log.time}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      log.level === 'error' ? 'bg-red-500/20 text-red-400' :
                      log.level === 'warn' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-green-500/20 text-green-400'
                    }`}>
                      {log.level.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-blue-400">{log.service}</td>
                  <td className="py-3 px-4 text-gray-300">{log.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
        <h2 className="text-2xl font-bold mb-6">Quick Actions</h2>
        <div className="grid grid-cols-4 gap-4">
          <button className="p-4 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-blue-400 font-medium transition">
            Clear Cache
          </button>
          <button className="p-4 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-lg text-green-400 font-medium transition">
            Backup Database
          </button>
          <button className="p-4 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-purple-400 font-medium transition">
            Restart Services
          </button>
          <button className="p-4 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-400 font-medium transition">
            View Error Reports
          </button>
        </div>
      </div>
    </div>
  );
}
