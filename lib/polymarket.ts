// Polymarket API utilities for fetching real trader data

interface Trade {
  proxyWallet: string
  timestamp: number
  conditionId: string
  type: string
  usdcSize?: number
  size: number
  price: number
  side: 'BUY' | 'SELL'
  transactionHash: string
  outcomeIndex: number
}

interface Position {
  buys: Trade[]
  sells: Trade[]
}

export interface TraderMetrics {
  totalVolume: number
  pnl: number
  activeDays: number
  uniqueMarkets: number
  totalTrades: number
  closedPositions: number
  consistency: number
  avgTradeSize: number
}

/**
 * Fetch all user activity from Polymarket API with pagination
 */
export async function fetchUserActivity(walletAddress: string): Promise<Trade[]> {
  const allTrades: Trade[] = []
  let offset = 0
  const limit = 500
  const maxRetries = 3

  while (true) {
    try {
      const url = `https://data-api.polymarket.com/activity?user=${walletAddress}&limit=${limit}&offset=${offset}&type=TRADE&sortBy=TIMESTAMP&sortDirection=DESC`

      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
        },
        // Add timeout
        signal: AbortSignal.timeout(10000)
      })

      if (!response.ok) {
        if (response.status === 404) {
          // No trades found
          break
        }
        throw new Error(`API responded with status: ${response.status}`)
      }

      const data = await response.json()

      if (!Array.isArray(data) || data.length === 0) {
        break
      }

      allTrades.push(...data)

      // Stop if we got less than limit (means we reached the end)
      if (data.length < limit) {
        break
      }

      offset += limit

      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100))

    } catch (error) {
      console.error(`Error fetching trades at offset ${offset}:`, error)
      // If we have some trades, return what we have
      if (allTrades.length > 0) {
        break
      }
      throw error
    }
  }

  return allTrades
}

/**
 * Calculate comprehensive metrics from trades data
 */
export function calculateMetrics(trades: Trade[]): TraderMetrics {
  if (!trades || trades.length === 0) {
    return {
      totalVolume: 0,
      pnl: 0,
      activeDays: 0,
      uniqueMarkets: 0,
      totalTrades: 0,
      closedPositions: 0,
      consistency: 0,
      avgTradeSize: 0
    }
  }

  let totalVolume = 0
  const activeDaysSet = new Set<string>()
  const uniqueMarketsSet = new Set<string>()
  const positions: Record<string, Position> = {}

  // First pass: collect basic metrics
  trades.forEach(trade => {
    // Calculate volume
    const tradeVolume = trade.usdcSize || (trade.size * trade.price)
    totalVolume += tradeVolume

    // Track active days
    const date = new Date(trade.timestamp * 1000).toISOString().split('T')[0]
    activeDaysSet.add(date)

    // Track unique markets
    uniqueMarketsSet.add(trade.conditionId)

    // Group positions for PNL calculation
    const positionKey = `${trade.conditionId}-${trade.outcomeIndex}`
    if (!positions[positionKey]) {
      positions[positionKey] = { buys: [], sells: [] }
    }

    if (trade.side === 'BUY') {
      positions[positionKey].buys.push({ ...trade, size: trade.size })
    } else {
      positions[positionKey].sells.push({ ...trade, size: trade.size })
    }
  })

  // Second pass: Calculate PNL using FIFO matching
  let totalPnl = 0
  let closedPositions = 0

  for (const positionKey in positions) {
    const { buys, sells } = positions[positionKey]

    // Sort by timestamp for FIFO
    buys.sort((a, b) => a.timestamp - b.timestamp)
    sells.sort((a, b) => a.timestamp - b.timestamp)

    let buyIndex = 0
    let remainingBuySize = buys[buyIndex]?.size || 0

    for (const sell of sells) {
      let remainingSellSize = sell.size

      while (remainingSellSize > 0 && buyIndex < buys.length) {
        const buy = buys[buyIndex]

        if (remainingBuySize === 0) {
          buyIndex++
          if (buyIndex < buys.length) {
            remainingBuySize = buys[buyIndex].size
          }
          continue
        }

        const matchedSize = Math.min(remainingSellSize, remainingBuySize)
        const profit = (sell.price - buy.price) * matchedSize

        totalPnl += profit
        remainingSellSize -= matchedSize
        remainingBuySize -= matchedSize
      }
    }

    // Check if position is fully closed
    const totalBuySize = buys.reduce((sum, b) => sum + b.size, 0)
    const totalSellSize = sells.reduce((sum, s) => sum + s.size, 0)
    if (Math.abs(totalBuySize - totalSellSize) < 0.0001) {
      closedPositions++
    }
  }

  // Calculate consistency (trading frequency)
  const activeDays = activeDaysSet.size
  const timestamps = trades.map(t => t.timestamp).sort((a, b) => a - b)
  const firstTrade = timestamps[0]
  const lastTrade = timestamps[timestamps.length - 1]
  const totalDays = Math.max(1, Math.ceil((lastTrade - firstTrade) / 86400))
  const consistency = activeDays / totalDays

  const avgTradeSize = totalVolume / trades.length

  return {
    totalVolume: Math.round(totalVolume * 100) / 100,
    pnl: Math.round(totalPnl * 100) / 100,
    activeDays,
    uniqueMarkets: uniqueMarketsSet.size,
    totalTrades: trades.length,
    closedPositions,
    consistency: Math.round(consistency * 100) / 100,
    avgTradeSize: Math.round(avgTradeSize * 100) / 100
  }
}

/**
 * Detect risk factors in trading behavior
 */
export function detectRiskFactors(metrics: TraderMetrics): string[] {
  const risks: string[] = []

  // Delta-neutral farming detection
  if (metrics.totalVolume > 10000 && Math.abs(metrics.pnl) < metrics.totalVolume * 0.01) {
    risks.push('Potential delta-neutral farming detected (high volume, near-zero PNL)')
  }

  // Wash trading detection
  if (metrics.totalTrades > 100 && metrics.uniqueMarkets < 5) {
    risks.push('Limited market diversity despite high trade count')
  }

  // Low consistency
  if (metrics.consistency < 0.1) {
    risks.push('Low trading consistency (inactive for extended periods)')
  }

  // Negative PNL with high volume
  if (metrics.totalVolume > 50000 && metrics.pnl < -1000) {
    risks.push('High volume with significant negative PNL')
  }

  return risks
}

/**
 * Generate suggestions for improving airdrop eligibility
 */
export function generateSuggestions(metrics: TraderMetrics): string[] {
  const suggestions: string[] = []

  if (metrics.totalVolume < 1000) {
    suggestions.push(`Increase trading volume to at least $1,000 (currently $${Math.round(metrics.totalVolume)})`)
  }

  if (metrics.activeDays < 30) {
    suggestions.push(`Trade for ${30 - metrics.activeDays} more days to improve consistency`)
  }

  if (metrics.uniqueMarkets < 10) {
    suggestions.push(`Trade in ${10 - metrics.uniqueMarkets} more markets to diversify`)
  }

  if (metrics.closedPositions < 5) {
    suggestions.push('Close more positions to demonstrate complete trading cycles')
  }

  if (metrics.consistency < 0.3) {
    suggestions.push('Increase trading frequency - aim for at least 3 days per week')
  }

  return suggestions
}
