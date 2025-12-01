'use client'

import { useState } from 'react'

interface AddressInputProps {
  onAnalyze: (addresses: string[]) => void
  loading: boolean
}

export default function AddressInput({ onAnalyze, loading }: AddressInputProps) {
  const [addresses, setAddresses] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Split by newline or comma and clean up
    const addressList = addresses
      .split(/[\n,]+/)
      .map(addr => addr.trim())
      .filter(addr => addr.length > 0)

    if (addressList.length === 0) return

    onAnalyze(addressList)
  }

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl">
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="addresses" className="block text-white text-lg font-semibold mb-2">
            Enter Wallet Addresses
          </label>
          <p className="text-gray-300 text-sm mb-4">
            Enter one or more addresses (separate with commas or new lines)
          </p>
          <textarea
            id="addresses"
            value={addresses}
            onChange={(e) => setAddresses(e.target.value)}
            placeholder="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7&#10;0x5aAeb6053f3E94C9b9A09f33669435E7Ef1BeAed&#10;0x..."
            className="w-full h-32 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50"
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !addresses.trim()}
          className="w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02]"
        >
          {loading ? 'Analyzing...' : 'Analyze Wallets'}
        </button>
      </form>

      <div className="mt-6 p-4 bg-blue-500/10 border border-blue-400/30 rounded-lg">
        <p className="text-blue-200 text-sm">
          <span className="font-semibold">Tip:</span> You can check multiple wallets simultaneously to compare their eligibility scores
        </p>
      </div>
    </div>
  )
}