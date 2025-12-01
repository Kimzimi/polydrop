import { NextRequest, NextResponse } from 'next/server'
import { WalletData } from '@/types'

// Helper function to fetch Polymarket data
async function fetchPolymarketData(address: string) {
  try {
    // Fetch user activity from Polymarket API
    const activityResponse = await fetch(
      `https://polymarket.com/api/core/user-activity?user=${address}&type=TRADE&limit=500`,
      {
        headers: {
          'Accept': 'application/json',
        }
      }
    )

    if (!activityResponse.ok) {
      console.error(`Failed to fetch activity for ${address}`)
      return null
    }

    const activityData = await activityResponse.json()

    // Also try to fetch trades data
    const tradesResponse = await fetch(
      `https://data-api.polymarket.com/trades?user=${address}&limit=500`,
      {
        headers: {
          'Accept': 'application/json',
        }
      }
    )

    const tradesData = tradesResponse.ok ? await tradesResponse.json() : null

    return {
      activity: activityData,
      trades: tradesData
    }
  } catch (error) {
    console.error(`Error fetching data for ${address}:`, error)
    return null
  }
}

// Calculate metrics from Polymarket data
function calculateMetrics(data: any): Partial<WalletData> {
  if (!data) {
    return {
      volume: 0,
      pnl: 0,
      activeDays: 0,
      marketsTraded: 0,
      liquidityProvided: 0
    }
  }

  let volume = 0
  let pnl = 0
  const uniqueDays = new Set<string>()
  const uniqueMarkets = new Set<string>()

  // Process activity data
  if (data.activity && Array.isArray(data.activity)) {
    data.activity.forEach((item: any) => {
      // Calculate volume
      if (item.usdcSize) {
        volume += parseFloat(item.usdcSize)
      }

      // Track unique days
      if (item.timestamp) {
        const date = new Date(item.timestamp).toISOString().split('T')[0]
        uniqueDays.add(date)
      }

      // Track unique markets
      if (item.marketId || item.conditionId) {
        uniqueMarkets.add(item.marketId || item.conditionId)
      }
    })
  }

  // Process trades data for additional metrics
  if (data.trades && Array.isArray(data.trades)) {
    data.trades.forEach((trade: any) => {
      // Additional volume calculation if needed
      if (trade.size && trade.price) {
        const tradeVolume = parseFloat(trade.size) * parseFloat(trade.price)
        if (!isNaN(tradeVolume)) {
          volume = Math.max(volume, tradeVolume) // Use max to avoid double counting
        }
      }

      // Simple PNL calculation (this is simplified, real calculation would be more complex)
      if (trade.side === 'SELL' && trade.profit) {
        pnl += parseFloat(trade.profit)
      }
    })
  }

  return {
    volume: Math.round(volume),
    pnl: Math.round(pnl),
    activeDays: uniqueDays.size,
    marketsTraded: uniqueMarkets.size,
    liquidityProvided: 0 // Would need additional API calls for LP data
  }
}

// Estimate tier and allocation based on metrics
function estimateAirdrop(metrics: Partial<WalletData>) {
  const { volume = 0, pnl = 0, activeDays = 0, marketsTraded = 0 } = metrics

  let tier: WalletData['estimatedTier'] = 'None'
  let percentile = 0
  let minAllocation = 0
  let maxAllocation = 0
  const suggestions: string[] = []
  const riskFactors: string[] = []

  // Tier calculation based on community criteria
  if (volume >= 1000000) {
    tier = 'S'
    percentile = 99
    minAllocation = 5000
    maxAllocation = 20000
  } else if (volume >= 50000) {
    tier = 'A'
    percentile = 98
    minAllocation = 1000
    maxAllocation = 5000
  } else if (volume >= 10000) {
    tier = 'B'
    percentile = 90
    minAllocation = 500
    maxAllocation = 2000
  } else if (volume >= 1000) {
    tier = 'C'
    percentile = 70
    minAllocation = 100
    maxAllocation = 500
  } else {
    percentile = 30
    suggestions.push('Increase trading volume to at least $1,000 to qualify')
  }

  // Adjust based on PNL
  if (pnl >= 1000) {
    percentile = Math.min(99.5, percentile + 5)
    minAllocation *= 1.5
    maxAllocation *= 1.5
  } else if (pnl < -1000) {
    riskFactors.push('Negative PNL may reduce allocation')
  }

  // Consistency check
  if (activeDays < 30) {
    suggestions.push(`Trade for ${30 - activeDays} more days to improve consistency`)
    percentile = Math.max(0, percentile - 10)
  }

  if (marketsTraded < 5) {
    suggestions.push(`Trade in ${5 - marketsTraded} more markets to diversify`)
  }

  // Risk factors
  if (volume > 100000 && pnl < 0) {
    riskFactors.push('High volume with negative PNL may indicate wash trading')
  }

  return {
    estimatedTier: tier,
    percentile: Math.round(percentile),
    estimatedAllocation: {
      min: Math.round(minAllocation),
      max: Math.round(maxAllocation)
    },
    suggestions,
    riskFactors
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

    // Process each address
    const results = await Promise.all(
      addresses.map(async (address: string) => {
        const data = await fetchPolymarketData(address)
        const metrics = calculateMetrics(data)
        const airdropEstimate = estimateAirdrop(metrics)

        return {
          address,
          ...metrics,
          ...airdropEstimate
        } as WalletData
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