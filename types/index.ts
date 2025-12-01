export interface WalletData {
  address: string
  volume: number
  pnl: number
  activeDays: number
  marketsTraded: number
  liquidityProvided: number
  estimatedTier: 'S' | 'A' | 'B' | 'C' | 'None'
  percentile: number
  estimatedAllocation: {
    min: number
    max: number
  }
  suggestions: string[]
  riskFactors: string[]
}