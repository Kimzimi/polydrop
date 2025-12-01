import { NextRequest, NextResponse } from 'next/server'
import { WalletData } from '@/types'
import { fetchUserActivity, calculateMetrics, detectRiskFactors, generateSuggestions } from '@/lib/polymarket'

// Cache for storing results (in production, use Redis or similar)
const cache = new Map<string, { data: WalletData; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// Estimate tier and allocation based on real metrics
function estimateAirdrop(metrics: {
  totalVolume: number
  pnl: number
  activeDays: number
  uniqueMarkets: number
  totalTrades: number
  closedPositions: number
  consistency: number
}) {
  const { totalVolume, pnl, activeDays, uniqueMarkets, totalTrades, closedPositions, consistency } = metrics

  let tier: WalletData['estimatedTier'] = 'None'
  let percentile = 0
  let minAllocation = 0
  let maxAllocation = 0

  // Calculate weighted score
  const volumeScore = Math.min(totalVolume / 100000, 1) * 40 // 40% weight, max at $100k
  const consistencyScore = consistency * 30 // 30% weight
  const diversityScore = Math.min(uniqueMarkets / 50, 1) * 15 // 15% weight, max at 50 markets
  const activityScore = Math.min(totalTrades / 200, 1) * 10 // 10% weight, max at 200 trades
  const pnlScore = pnl > 0 ? Math.min(pnl / 10000, 1) * 5 : 0 // 5% weight, max at $10k profit

  const totalScore = volumeScore + consistencyScore + diversityScore + activityScore + pnlScore

  // Tier assignment based on score and volume
  if (totalScore >= 70 && totalVolume >= 50000) {
    tier = 'S'
    percentile = Math.min(99, 90 + totalScore / 10)
    minAllocation = 5000
    maxAllocation = 20000
  } else if (totalScore >= 50 && totalVolume >= 10000) {
    tier = 'A'
    percentile = Math.min(95, 75 + totalScore / 4)
    minAllocation = 1000
    maxAllocation = 5000
  } else if (totalScore >= 30 && totalVolume >= 1000) {
    tier = 'B'
    percentile = Math.min(85, 50 + totalScore / 2)
    minAllocation = 500
    maxAllocation = 2000
  } else if (totalVolume >= 100) {
    tier = 'C'
    percentile = Math.min(70, 20 + totalScore)
    minAllocation = 100
    maxAllocation = 500
  } else {
    percentile = Math.min(50, totalScore)
    minAllocation = 0
    maxAllocation = 100
  }

  // Bonus for positive PNL
  if (pnl >= 1000 && tier !== 'None') {
    percentile = Math.min(99.5, percentile + 3)
    minAllocation = Math.round(minAllocation * 1.3)
    maxAllocation = Math.round(maxAllocation * 1.3)
  }

  // Penalty for low consistency
  if (consistency < 0.2 && activeDays < 30) {
    percentile = Math.max(0, percentile - 15)
    minAllocation = Math.round(minAllocation * 0.7)
    maxAllocation = Math.round(maxAllocation * 0.7)
  }

  return {
    estimatedTier: tier,
    percentile: Math.round(percentile),
    estimatedAllocation: {
      min: Math.round(minAllocation),
      max: Math.round(maxAllocation)
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const { addresses } = await req.json()

    if (!addresses || !Array.isArray(addresses)) {
      return NextResponse.json(
        { error: 'Invalid addresses provided' },
        { status: 400 }
      )
    }

    if (addresses.length > 20) {
      return NextResponse.json(
        { error: 'Maximum 20 addresses allowed per request' },
        { status: 400 }
      )
    }

    // Record statistics (non-blocking)
    fetch(`${req.nextUrl.origin}/api/stats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ addressCount: addresses.length })
    }).catch(() => {})

    // Process each address with caching
    const results = await Promise.all(
      addresses.map(async (address: string) => {
        // Check cache first
        const cached = cache.get(address)
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
          return cached.data
        }

        try {
          // Fetch real data from Polymarket
          const trades = await fetchUserActivity(address)
          const metrics = calculateMetrics(trades)
          const airdropEstimate = estimateAirdrop(metrics)
          const riskFactors = detectRiskFactors(metrics)
          const suggestions = generateSuggestions(metrics)

          const result: WalletData = {
            address,
            volume: metrics.totalVolume,
            pnl: metrics.pnl,
            activeDays: metrics.activeDays,
            marketsTraded: metrics.uniqueMarkets,
            liquidityProvided: 0, // Not available from current API
            ...airdropEstimate,
            suggestions,
            riskFactors
          }

          // Cache the result
          cache.set(address, { data: result, timestamp: Date.now() })

          return result
        } catch (error) {
          console.error(`Error processing ${address}:`, error)
          // Return default data for failed addresses
          return {
            address,
            volume: 0,
            pnl: 0,
            activeDays: 0,
            marketsTraded: 0,
            liquidityProvided: 0,
            estimatedTier: 'None' as const,
            percentile: 0,
            estimatedAllocation: { min: 0, max: 0 },
            suggestions: ['Unable to fetch data - please check wallet address'],
            riskFactors: []
          }
        }
      })
    )

    return NextResponse.json(results)
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze wallets' },
      { status: 500 }
    )
  }
}
