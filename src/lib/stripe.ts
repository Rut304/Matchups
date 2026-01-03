import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
})

export const PRICE_TO_TIER: Record<string, 'pro' | 'elite'> = {
  [process.env.STRIPE_PRO_PRICE_ID!]: 'pro',
  [process.env.STRIPE_ELITE_PRICE_ID!]: 'elite',
}
