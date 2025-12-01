'use client'

import { WalletData } from '@/types'

interface ResultsDisplayProps {
  wallets: WalletData[]
}

export default function ResultsDisplay({ wallets }: ResultsDisplayProps) {
  const getTierColor = (tier: string) => {
    switch(tier) {
      case 'S': return 'bg-gradient-to-r from-yellow-400 to-orange-500'
      case 'A': return 'bg-gradient-to-r from-purple-500 to-pink-500'
      case 'B': return 'bg-gradient-to-r from-blue-500 to-cyan-500'
      case 'C': return 'bg-gradient-to-r from-green-500 to-teal-500'
      default: return 'bg-gray-500'
    }
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(num)
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return (
    <div className="mt-8 space-y-6">
      <h2 className="text-3xl font-bold text-white text-center mb-6">Analysis Results</h2>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {wallets.map((wallet) => (
          <div key={wallet.address} className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20">
            <div className="mb-4">
              <p className="text-gray-300 text-sm">Address</p>
              <p className="text-white font-mono text-lg">{formatAddress(wallet.address)}</p>
            </div>

            <div className="mb-4">
              <div className={`inline-block px-4 py-2 rounded-full text-white font-bold ${getTierColor(wallet.estimatedTier)}`}>
                Tier {wallet.estimatedTier}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-gray-400 text-xs">Volume</p>
                <p className="text-white font-semibold">${formatNumber(wallet.volume)}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">PNL</p>
                <p className={`font-semibold ${wallet.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ${formatNumber(wallet.pnl)}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Active Days</p>
                <p className="text-white font-semibold">{wallet.activeDays}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Markets</p>
                <p className="text-white font-semibold">{wallet.marketsTraded}</p>
              </div>
            </div>

            <div className="mb-4 p-3 bg-white/5 rounded-lg">
              <p className="text-gray-300 text-sm mb-1">Percentile Rank</p>
              <div className="flex items-center">
                <div className="flex-1 bg-gray-700 rounded-full h-2 mr-2">
                  <div
                    className="bg-gradient-to-r from-blue-400 to-purple-400 h-2 rounded-full"
                    style={{ width: `${wallet.percentile}%` }}
                  />
                </div>
                <span className="text-white font-semibold">{wallet.percentile}%</span>
              </div>
            </div>

            <div className="mb-4 p-3 bg-purple-500/10 border border-purple-400/30 rounded-lg">
              <p className="text-purple-300 text-sm mb-1">Estimated $POLY</p>
              <p className="text-white font-bold text-lg">
                {formatNumber(wallet.estimatedAllocation.min)} - {formatNumber(wallet.estimatedAllocation.max)}
              </p>
            </div>

            {wallet.suggestions.length > 0 && (
              <div className="mb-4">
                <p className="text-yellow-300 text-sm font-semibold mb-2">Suggestions:</p>
                <ul className="text-gray-300 text-xs space-y-1">
                  {wallet.suggestions.map((suggestion, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="mr-1">•</span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {wallet.riskFactors.length > 0 && (
              <div>
                <p className="text-red-400 text-sm font-semibold mb-2">Risk Factors:</p>
                <ul className="text-red-300 text-xs space-y-1">
                  {wallet.riskFactors.map((risk, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="mr-1">⚠</span>
                      <span>{risk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mt-8">
        <h3 className="text-xl font-bold text-white mb-4">Comparison Table</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-white">
            <thead>
              <tr className="border-b border-white/20">
                <th className="text-left py-2 px-4">Address</th>
                <th className="text-right py-2 px-4">Volume</th>
                <th className="text-right py-2 px-4">PNL</th>
                <th className="text-right py-2 px-4">Tier</th>
                <th className="text-right py-2 px-4">Est. $POLY</th>
              </tr>
            </thead>
            <tbody>
              {wallets.map((wallet) => (
                <tr key={wallet.address} className="border-b border-white/10">
                  <td className="py-2 px-4 font-mono text-sm">{formatAddress(wallet.address)}</td>
                  <td className="text-right py-2 px-4">${formatNumber(wallet.volume)}</td>
                  <td className={`text-right py-2 px-4 ${wallet.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ${formatNumber(wallet.pnl)}
                  </td>
                  <td className="text-right py-2 px-4">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getTierColor(wallet.estimatedTier)}`}>
                      {wallet.estimatedTier}
                    </span>
                  </td>
                  <td className="text-right py-2 px-4">
                    {formatNumber(wallet.estimatedAllocation.min)}-{formatNumber(wallet.estimatedAllocation.max)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}