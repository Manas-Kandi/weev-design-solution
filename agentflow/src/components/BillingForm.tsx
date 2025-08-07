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
    <Card>
      <CardHeader>
        <CardTitle>Subscription Plan</CardTitle>
        <CardDescription>
          You are currently on the <strong>{subscriptionPlan.name}</strong> plan.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mt-5 space-y-4">
          <Button onClick={redirectToCustomerPortal} disabled={loading}>
            {loading ? 'Loading...' : 'Manage Subscription'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

