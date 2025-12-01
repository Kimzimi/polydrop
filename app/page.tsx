'use client'

import { useState } from 'react'
import AddressInput from '@/components/AddressInput'
import ResultsDisplay from '@/components/ResultsDisplay'
import { WalletData } from '@/types'

export default function Home() {
  const [walletData, setWalletData] = useState<WalletData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAnalyze = async (addresses: string[]) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addresses })
      })

      if (!response.ok) {
        throw new Error('Failed to fetch data')
      }

      const data = await response.json()
      setWalletData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-violet-900">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold text-white mb-4">
            Polymarket $POLY Airdrop Estimator
          </h1>
          <p className="text-xl text-gray-200">
            Check your eligibility for the upcoming $POLY airdrop
          </p>
        </div>

        <AddressInput onAnalyze={handleAnalyze} loading={loading} />

        {error && (
          <div className="mt-6 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-200 text-center">
            {error}
          </div>
        )}

        {walletData.length > 0 && (
          <ResultsDisplay wallets={walletData} />
        )}
      </div>
    </main>
  )
}