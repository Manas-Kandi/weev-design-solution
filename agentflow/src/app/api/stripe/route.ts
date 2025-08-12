import { stripe } from '@/lib/stripe';
import { getAuthedUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

const getURL = () => {
  let url =
    process?.env?.NEXT_PUBLIC_SITE_URL ??
    process?.env?.NEXT_PUBLIC_VERCEL_URL ??
    'http://localhost:3000/';
  url = url.includes('http') ? url : `https://${url}`;
  url = url.charAt(url.length - 1) === '/' ? url : `${url}/`;
  return url;
};

export async function POST(req: Request) {
  const { price, quantity = 1, metadata = {} } = await req.json();

  const user = await getAuthedUser(req);
  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { userId: user.id },
    });

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
