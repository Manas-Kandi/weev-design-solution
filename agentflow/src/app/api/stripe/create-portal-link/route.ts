import { stripe } from '@/lib/stripe';
import { NextRequest, NextResponse } from 'next/server';

const getURL = () => {
  let url =
    process?.env?.NEXT_PUBLIC_SITE_URL ??
    process?.env?.NEXT_PUBLIC_VERCEL_URL ??
    'http://localhost:3000/';
  url = url.includes('http') ? url : `https://${url}`;
  url = url.charAt(url.length - 1) === '/' ? url : `${url}/`;
  return url;
};

export async function POST(req: NextRequest) {
  try {
    // For now, we'll use a hardcoded user and customer ID.
    // In a real application, you would fetch this from your database based on the authenticated user.
    const customerId = 'cus_placeholder_id'; // This would be fetched from your user profile

    if (!customerId) {
      throw new Error('Customer ID not found.');
    }

    const { url } = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${getURL()}account`,
    });

    return NextResponse.json({ url });
  } catch (err: any) {
    console.error(err);
    return new NextResponse('Error creating customer portal link', { status: 500 });
  }
}

