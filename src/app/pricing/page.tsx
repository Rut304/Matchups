'use client'

import { useState } from 'react'
import { Check, Zap, Crown, Sparkles } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'

const tiers = [
  {
    name: 'Free',
    id: 'free',
    price: '$0',
    description: 'Perfect for casual bettors',
    features: [
      'Basic matchup analysis',
      'Live scores & odds',
      'Injury reports',
      'Public betting trends',
      'Community access',
      'Basic stats & trends',
    ],
    cta: 'Current Plan',
    icon: Sparkles,
    popular: false,
  },
  {
    name: 'Pro',
    id: 'pro',
    price: '$29',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || 'price_pro_test',
    description: 'For serious sports bettors',
    features: [
      'Everything in Free',
      'Advanced analytics & AI insights',
      'Sharp money indicators',
      'Line movement alerts',
      'CLV tracking',
      'Historical trend analysis',
      'Expert pick tracking',
      'Priority support',
    ],
    cta: 'Upgrade to Pro',
    icon: Zap,
    popular: true,
  },
  {
    name: 'Elite',
    id: 'elite',
    price: '$99',
    priceId: process.env.NEXT_PUBLIC_STRIPE_ELITE_PRICE_ID || 'price_elite_test',
    description: 'Maximum edge for professionals',
    features: [
      'Everything in Pro',
      'API access for automation',
      'Custom betting models',
      'Real-time edge detection',
      'Whale tracking',
      'Advanced pattern discovery',
      'Unlimited alerts',
      'White-glove support',
      'Early access to new features',
    ],
    cta: 'Upgrade to Elite',
    icon: Crown,
    popular: false,
  },
]

export default function PricingPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const handleCheckout = async (priceId: string, tierId: string) => {
    if (!user) {
      router.push('/auth/signin?redirect=/pricing')
      return
    }

    if (tierId === 'free') {
      return
    }

    setLoading(tierId)

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId }),
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('No checkout URL returned')
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Failed to start checkout. Please try again.')
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background-secondary py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-4">
            Choose Your Edge
          </h1>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto">
            Unlock advanced betting intelligence and maximize your winning potential
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {tiers.map((tier) => {
            const Icon = tier.icon
            return (
              <div
                key={tier.id}
                className={`relative rounded-2xl border-2 p-8 ${
                  tier.popular
                    ? 'border-accent bg-background-secondary shadow-2xl shadow-accent/20 scale-105'
                    : 'border-border bg-background'
                } transition-all hover:shadow-xl`}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-accent text-background px-4 py-1 rounded-full text-sm font-bold">
                    MOST POPULAR
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-lg ${tier.popular ? 'bg-accent/20' : 'bg-background-secondary'}`}>
                    <Icon className={`w-6 h-6 ${tier.popular ? 'text-accent' : 'text-text-secondary'}`} />
                  </div>
                  <h2 className="text-2xl font-bold text-text-primary">{tier.name}</h2>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-bold text-text-primary">{tier.price}</span>
                    {tier.id !== 'free' && <span className="text-text-secondary">/month</span>}
                  </div>
                  <p className="text-text-secondary mt-2">{tier.description}</p>
                </div>

                <button
                  onClick={() => handleCheckout(tier.priceId || '', tier.id)}
                  disabled={tier.id === 'free' || loading === tier.id}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-all mb-8 ${
                    tier.popular
                      ? 'bg-accent text-background hover:bg-accent-hover'
                      : tier.id === 'free'
                      ? 'bg-background-secondary text-text-secondary cursor-not-allowed'
                      : 'bg-background-secondary text-text-primary hover:bg-background-tertiary border border-border'
                  } ${loading === tier.id ? 'opacity-50 cursor-wait' : ''}`}
                >
                  {loading === tier.id ? 'Loading...' : tier.cta}
                </button>

                <ul className="space-y-4">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className={`w-5 h-5 mt-0.5 flex-shrink-0 ${tier.popular ? 'text-accent' : 'text-success'}`} />
                      <span className="text-text-secondary">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>

        {/* FAQ Section */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-text-primary text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div className="bg-background-secondary rounded-lg p-6 border border-border">
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                Can I cancel anytime?
              </h3>
              <p className="text-text-secondary">
                Yes! You can cancel your subscription at any time. You'll continue to have access until the end of your billing period.
              </p>
            </div>
            <div className="bg-background-secondary rounded-lg p-6 border border-border">
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-text-secondary">
                We accept all major credit cards through our secure Stripe payment processor.
              </p>
            </div>
            <div className="bg-background-secondary rounded-lg p-6 border border-border">
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                Is there a free trial?
              </h3>
              <p className="text-text-secondary">
                The Free tier is available forever with no credit card required. Upgrade anytime to unlock advanced features.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
