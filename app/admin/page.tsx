'use client'

import { useState, useEffect } from 'react'

interface Stats {
  totalChecks: number
  totalAddresses: number
  checksWithMultipleAddresses: number
  checksWithOver2Addresses: number
  checksWithOver10Addresses: number
  lastUpdated: string
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [secret, setSecret] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats', {
        headers: {
          'Authorization': `Bearer ${secret}`
        }
      })

      if (!response.ok) {
        throw new Error('Unauthorized')
      }

      const data = await response.json()
      setStats(data)
      setIsAuthenticated(true)
      setError(null)
    } catch (err) {
      setError('Failed to fetch stats. Check your secret key.')
      setIsAuthenticated(false)
    }
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    fetchStats()
  }

  useEffect(() => {
    if (isAuthenticated) {
      const interval = setInterval(fetchStats, 30000) // Refresh every 30 seconds
      return () => clearInterval(interval)
    }
  }, [isAuthenticated])

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl max-w-md w-full">
          <h1 className="text-3xl font-bold text-white mb-6">Admin Login</h1>
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-white text-sm font-semibold mb-2">
                Secret Key
              </label>
              <input
                type="password"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                placeholder="Enter admin secret"
              />
            </div>
            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-200 text-sm">
                {error}
              </div>
            )}
            <button
              type="submit"
              className="w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700"
            >
              Login
            </button>
          </form>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-8">
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">Analytics Dashboard</h1>
          <button
            onClick={() => setIsAuthenticated(false)}
            className="px-4 py-2 bg-red-500/20 border border-red-500 rounded-lg text-red-200 hover:bg-red-500/30"
          >
            Logout
          </button>
        </div>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-gray-300 text-sm font-semibold">Total Checks</h3>
                <span className="text-3xl">📊</span>
              </div>
              <p className="text-4xl font-bold text-white">{stats.totalChecks.toLocaleString()}</p>
              <p className="text-gray-400 text-sm mt-2">All-time checks</p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-gray-300 text-sm font-semibold">Total Addresses</h3>
                <span className="text-3xl">👛</span>
              </div>
              <p className="text-4xl font-bold text-white">{stats.totalAddresses.toLocaleString()}</p>
              <p className="text-gray-400 text-sm mt-2">Addresses checked</p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-gray-300 text-sm font-semibold">Avg Addresses per Check</h3>
                <span className="text-3xl">📈</span>
              </div>
              <p className="text-4xl font-bold text-white">
                {stats.totalChecks > 0 ? (stats.totalAddresses / stats.totalChecks).toFixed(2) : '0'}
              </p>
              <p className="text-gray-400 text-sm mt-2">Average per session</p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-gray-300 text-sm font-semibold">Multiple Addresses</h3>
                <span className="text-3xl">🔢</span>
              </div>
              <p className="text-4xl font-bold text-white">{stats.checksWithMultipleAddresses.toLocaleString()}</p>
              <p className="text-gray-400 text-sm mt-2">
                {stats.totalChecks > 0 ? `${((stats.checksWithMultipleAddresses / stats.totalChecks) * 100).toFixed(1)}% of checks` : '0%'}
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-gray-300 text-sm font-semibold">Checks with 2+ Addresses</h3>
                <span className="text-3xl">💼</span>
              </div>
              <p className="text-4xl font-bold text-white">{stats.checksWithOver2Addresses.toLocaleString()}</p>
              <p className="text-gray-400 text-sm mt-2">
                {stats.totalChecks > 0 ? `${((stats.checksWithOver2Addresses / stats.totalChecks) * 100).toFixed(1)}% of checks` : '0%'}
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-gray-300 text-sm font-semibold">Checks with 10+ Addresses</h3>
                <span className="text-3xl">🚀</span>
              </div>
              <p className="text-4xl font-bold text-white">{stats.checksWithOver10Addresses.toLocaleString()}</p>
              <p className="text-gray-400 text-sm mt-2">
                {stats.totalChecks > 0 ? `${((stats.checksWithOver10Addresses / stats.totalChecks) * 100).toFixed(1)}% of checks` : '0%'}
              </p>
            </div>
          </div>
        )}

        {stats && (
          <div className="mt-8 bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20">
            <p className="text-gray-300 text-sm">
              Last updated: {new Date(stats.lastUpdated).toLocaleString()}
            </p>
            <button
              onClick={fetchStats}
              className="mt-4 px-6 py-2 bg-blue-500/20 border border-blue-400 rounded-lg text-blue-200 hover:bg-blue-500/30"
            >
              Refresh Stats
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
