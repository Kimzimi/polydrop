import { NextRequest, NextResponse } from 'next/server'

// Simple in-memory storage (for production, use a real database)
let stats = {
  totalChecks: 0,
  totalAddresses: 0,
  checksWithMultipleAddresses: 0,
  checksWithOver2Addresses: 0,
  checksWithOver10Addresses: 0,
  lastUpdated: new Date().toISOString()
}

export async function POST(req: NextRequest) {
  try {
    const { addressCount } = await req.json()

    if (!addressCount || typeof addressCount !== 'number') {
      return NextResponse.json(
        { error: 'Invalid data' },
        { status: 400 }
      )
    }

    // Update statistics
    stats.totalChecks++
    stats.totalAddresses += addressCount

    if (addressCount > 1) {
      stats.checksWithMultipleAddresses++
    }

    if (addressCount > 2) {
      stats.checksWithOver2Addresses++
    }

    if (addressCount > 10) {
      stats.checksWithOver10Addresses++
    }

    stats.lastUpdated = new Date().toISOString()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Stats Error:', error)
    return NextResponse.json(
      { error: 'Failed to record stats' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  // Simple auth check - require a secret key
  const authHeader = req.headers.get('authorization')
  const secret = process.env.STATS_SECRET || 'polydrop-admin-2024'

  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  return NextResponse.json(stats)
}
