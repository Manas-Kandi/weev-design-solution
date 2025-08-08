import { stripe } from '@/lib/stripe';
import { supabase } from '@/lib/supabaseClient';
import { NextApiRequest, NextApiResponse } from 'next';
import { NextResponse } from 'next/server';

const getURL = () => {
  let url =
    process?.env?.NEXT_PUBLIC_SITE_URL ?? // Set this to your site URL in production
    process?.env?.NEXT_PUBLIC_VERCEL_URL ?? // Automatically set by Vercel.
    'http://localhost:3000/';
  // Make sure to include `https://` when not localhost.
  url = url.includes('http') ? url : `https://${url}`;
  // Make sure to include a trailing `/`.
  url = url.charAt(url.length - 1) === '/' ? url : `${url}/`;
  return url;
};

export async function POST(req: Request) {
  const { price, quantity = 1, metadata = {} } = await req.json();

  try {
    // For now, we'll use a hardcoded user. In a real application, you'd get this from your authentication system.
    const user = { id: 'user_placeholder_id', email: 'user@example.com' };

    let customer;
    // In a real app, you would fetch the user's Stripe customer ID from your database.
    // const { data: profile } = await supabase.from('profiles').select('stripe_customer_id').eq('id', user.id).single();
    // if (profile?.stripe_customer_id) {
    //   customer = { id: profile.stripe_customer_id };
    // } else {
      customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id,
        },
      });
      // And you would save the new customer ID to your database.
      // await supabase.from('profiles').update({ stripe_customer_id: customer.id }).eq('id', user.id);
    // }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      billing_address_collection: 'required',
      customer: customer.id,
      line_items: [
        {
          price: price.id,
          quantity,
        },
      ],
      mode: 'subscription',
      success_url: `${getURL()}account`,
      cancel_url: `${getURL()}`,
      subscription_data: {
        metadata,
      },
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (err: any) {
    console.log(err);
    return new NextResponse('Error creating checkout session', { status: 500 });
  }
}

