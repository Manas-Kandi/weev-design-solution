"use client";

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/primitives/card";
import { Badge } from "@/components/primitives/badge";
import { Button } from "@/components/primitives/button";
import BillingForm from './BillingForm';
import { ShieldCheck, CreditCard, Check, Star, Zap } from "lucide-react";

export default function AccountSettings() {
  const [loading, setLoading] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  const plans = [
    { 
      id: "starter", 
      name: "Starter", 
      price: "$0", 
      yearlyPrice: "$0",
      desc: "Perfect for getting started with AI agent design", 
      priceId: null,
      features: [
        "Up to 2 projects",
        "Basic node library",
        "Community support",
        "Export to JSON"
      ],
      isPopular: false
    },
    { 
      id: "pro", 
      name: "Pro", 
      price: "$19", 
      yearlyPrice: "$15",
      desc: "Everything you need for professional agent development", 
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
      features: [
        "Unlimited projects",
        "Advanced node library",
        "Real-time collaboration",
        "Priority support",
        "Export to code",
        "Custom integrations",
        "Advanced analytics"
      ],
      isPopular: true
    },
    { 
      id: "enterprise", 
      name: "Enterprise", 
      price: "Custom", 
      yearlyPrice: "Custom",
      desc: "Advanced features for teams and organizations", 
      priceId: null,
      features: [
        "Everything in Pro",
        "SSO integration",
        "Dedicated support",
        "SLA guarantee",
        "Custom deployment",
        "Advanced security",
        "Team management"
      ],
      isPopular: false
    },
  ];

  const handleCheckout = async (priceId: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ price: { id: priceId } }),
      });
      const ct = res.headers.get('content-type') || '';
      const isJson = ct.includes('application/json');
      const payload = isJson ? await res.json().catch(() => ({})) : await res.text();
      if (!res.ok) {
        const msg = isJson ? (payload as any)?.message : String(payload);
        throw new Error(msg || `Checkout session failed (HTTP ${res.status})`);
      }
      const sessionId = (payload as any)?.sessionId;
      if (!sessionId) throw new Error('No sessionId returned');

      const stripe = await (window as any).Stripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
      await stripe.redirectToCheckout({ sessionId });
    } catch (error) {
      alert((error as Error).message);
    }
    setLoading(false);
  };
  
  return (
    <div className="w-full max-w-none space-y-12 p-6">
      {/* Current Subscription Section */}
      <div className="space-y-4 pb-8 border-b border-border/50">
        <div>
          <h2 className="text-xl font-medium mb-2 text-white/80">Current Subscription</h2>
          <p className="text-sm text-white/50">Manage your subscription and billing information</p>
        </div>
        <BillingForm subscriptionPlan={{ name: "Starter" }} />
      </div>

      {/* Pricing Plans Section */}
      <div className="space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-medium text-white/80">Choose Your Plan</h2>
          <p className="text-base text-white/50 max-w-2xl mx-auto">
            Scale your AI agent development with plans designed for every stage of your journey
          </p>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 p-1 bg-muted rounded-lg w-fit mx-auto">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                billingCycle === 'monthly' 
                  ? 'bg-background text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                billingCycle === 'annual' 
                  ? 'bg-background text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Annual
              <Badge variant="secondary" className="text-xs px-1.5 py-0.5">Save 20%</Badge>
            </button>
          </div>
        </div>

        {/* Plan Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-7xl mx-auto w-full px-4">
          {plans.map((plan) => {
            const currentPrice = billingCycle === 'annual' ? plan.yearlyPrice : plan.price;
            const isCurrentPlan = plan.id === "starter";
            
            return (
              <Card 
                key={plan.id} 
                className={`relative h-full transition-all duration-200 hover:shadow-lg ${
                  plan.isPopular 
                    ? 'border-2 border-primary shadow-lg scale-105' 
                    : 'border hover:border-muted-foreground/20'
                }`}
                style={plan.isPopular ? {
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(139, 92, 246, 0.03))',
                  backdropFilter: 'blur(8px)',
                  boxShadow: 'inset 0 1px 0 rgba(99, 102, 241, 0.1), 0 4px 20px rgba(99, 102, 241, 0.08)'
                } : {}}
              >
                {/* Popular Badge */}
                {plan.isPopular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-3 py-1 flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-xl font-medium text-white/80">{plan.name}</CardTitle>
                  <CardDescription className="text-sm text-white/50">{plan.desc}</CardDescription>
                </CardHeader>
                
                <CardContent className="text-center pb-6">
                  <div className="mb-6">
                    {plan.price === "Custom" ? (
                      <div className="text-3xl font-medium text-white/80">Custom</div>
                    ) : (
                      <div className="space-y-1">
                        <div className="text-4xl font-medium text-white/85">
                          {currentPrice}
                          {plan.price !== "$0" && (
                            <span className="text-base font-normal text-white/50">
                              /{billingCycle === 'annual' ? 'mo' : 'mo'}
                            </span>
                          )}
                        </div>
                        {billingCycle === 'annual' && plan.price !== "$0" && (
                          <div className="text-xs text-white/40">
                            Billed annually (${parseInt(plan.yearlyPrice.replace('$', '')) * 12}/year)
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Features List */}
                  <div className="space-y-2 text-left">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-xs leading-tight text-white/60">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
                
                <CardFooter className="pt-0">
                  {plan.id === "starter" ? (
                    <Button 
                      size="lg" 
                      className="w-full font-semibold" 
                      variant="secondary"
                      disabled={isCurrentPlan}
                    >
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4" />
                        Current Plan
                      </div>
                    </Button>
                  ) : plan.id === "pro" ? (
                    <Button 
                      size="lg" 
                      className="w-full font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
                      onClick={() => plan.priceId && handleCheckout(plan.priceId)} 
                      disabled={loading}
                      style={{
                        boxShadow: '0 4px 20px rgba(99, 102, 241, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                      }}
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          Loading...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4" />
                          Upgrade to Pro
                        </div>
                      )}
                    </Button>
                  ) : (
                    <Button 
                      size="lg" 
                      className="w-full font-semibold" 
                      variant="outline"
                    >
                      Contact Sales
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Payment Method Section */}
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-medium mb-2 text-white/80">Payment Method</h2>
          <p className="text-sm text-white/50">Manage your payment information and billing details</p>
        </div>
        
        <Card className="max-w-2xl">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="p-2 bg-muted rounded-lg">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-base font-medium text-white/80">Credit Card</CardTitle>
                <CardDescription className="text-sm text-white/50">Secure payment processing</CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-6 bg-gradient-to-r from-blue-600 to-blue-400 rounded flex items-center justify-center">
                  <span className="text-white text-xs font-bold">💳</span>
                </div>
                <div>
                  <p className="text-sm font-normal text-white/60">No card on file</p>
                  <p className="text-xs text-white/40">Add a payment method to upgrade your plan</p>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="w-8 h-5 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">V</div>
                <div className="w-8 h-5 bg-red-600 rounded text-white text-xs flex items-center justify-center font-bold">M</div>
                <div className="w-8 h-5 bg-blue-500 rounded text-white text-xs flex items-center justify-center font-bold">A</div>
              </div>
            </div>
          </CardContent>
          
          <CardFooter>
            <Button variant="outline" size="lg" className="w-full font-semibold">
              <CreditCard className="w-4 h-4 mr-2" />
              Add Payment Method
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

