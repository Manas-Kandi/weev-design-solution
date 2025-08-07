'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { stripe } from '@/lib/stripe';

interface BillingFormProps {
  subscriptionPlan: any; // Replace with your subscription plan type
}

export default function BillingForm({ subscriptionPlan }: BillingFormProps) {
  const [loading, setLoading] = useState(false);

  const redirectToCustomerPortal = async () => {
    setLoading(true);
    try {
      const { url } = await fetch('/api/stripe/create-portal-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }).then((res) => res.json());

      window.location.assign(url);
    } catch (error) {
      if (error) return alert((error as Error).message);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-lg font-medium">Subscription Plan</h3>
        <p className="text-sm text-muted-foreground">
          You are currently on the <strong>{subscriptionPlan.name}</strong> plan.
        </p>
      </div>
      <Button onClick={redirectToCustomerPortal} disabled={loading} variant="outline" size="sm">
        {loading ? 'Loading...' : 'Manage Subscription'}
      </Button>
    </div>
  );
}

