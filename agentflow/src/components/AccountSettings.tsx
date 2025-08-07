"use client";

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import BillingForm from './BillingForm';
import { ShieldCheck, CreditCard } from "lucide-react";

export default function AccountSettings() {
  const [loading, setLoading] = useState(false);

  const plans = [
    { id: "starter", name: "Starter", price: "$0", desc: "Up to 2 projects • Community support", priceId: null },
    { id: "pro", name: "Pro", price: "$19 / mo", desc: "Unlimited projects • Share & export", priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID },
    { id: "enterprise", name: "Enterprise", price: "Contact us", desc: "SSO • Dedicated support • SLA", priceId: null },
  ];

  const handleCheckout = async (priceId: string) => {
    setLoading(true);
    try {
      const { sessionId } = await fetch('/api/stripe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ price: { id: priceId } }),
      }).then((res) => res.json());

      const stripe = await (window as any).Stripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
      await stripe.redirectToCheckout({ sessionId });
    } catch (error) {
      alert((error as Error).message);
    }
    setLoading(false);
  };
  
  return (
    <div className="space-y-6 p-6">
      <BillingForm subscriptionPlan={{ name: "Starter" }} />

      {/* Plan Options */}
      <div className="grid md:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <Card key={plan.id}>
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>{plan.desc}</CardDescription>
            </CardHeader>
            <CardContent className="text-2xl font-bold">{plan.price}</CardContent>
            <CardFooter>
              {plan.priceId ? (
                <Button size="sm" className="w-full" onClick={() => handleCheckout(plan.priceId!)} disabled={loading}>
                  {loading ? 'Loading...' : 'Choose'}
                </Button>
              ) : (
                <Button size="sm" className="w-full" disabled={plan.id === "starter"}>
                  {plan.id === "starter" ? "Current Plan" : "Contact Us"}
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Payment Method */}
      <Card>
        <CardHeader className="flex-row items-center gap-4">
          <CreditCard className="w-6 h-6" />
          <CardTitle>Payment Method</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No card on file</p>
        </CardContent>
        <CardFooter>
          <Button size="sm">Add card</Button>
        </CardFooter>
      </Card>
    </div>
  );
}

