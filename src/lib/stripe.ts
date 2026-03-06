import Stripe from 'stripe'

// Lazy initialization to avoid build-time errors when env vars are missing
let stripeInstance: Stripe | null = null

export const getStripe = (): Stripe => {
  if (!stripeInstance) {
    const secretKey = process.env.STRIPE_SECRET_KEY
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured')
    }
    stripeInstance = new Stripe(secretKey, {
      typescript: true,
    })
  }
  return stripeInstance
}

// For backwards compatibility
export const stripe = new Proxy({} as Stripe, {
  get: (target, prop) => {
    const stripeInstance = getStripe()
    const value = stripeInstance[prop as keyof Stripe]
    if (typeof value === 'function') {
      return value.bind(stripeInstance)
    }
    return value
  }
})

export const PRICE_TO_TIER: Record<string, 'pro' | 'elite'> = {
  [process.env.STRIPE_PRO_PRICE_ID || 'price_pro_placeholder']: 'pro',
  [process.env.STRIPE_ELITE_PRICE_ID || 'price_elite_placeholder']: 'elite',
}
