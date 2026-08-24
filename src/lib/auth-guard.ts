import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { NextResponse } from 'next/server';

export async function validateAdminSession() {
  const session = await getServerSession(authOptions);
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!session || !session.user) {
    return {
      authorized: false,
      response: NextResponse.json({ error: 'Unauthorized: Authentication required.' }, { status: 401 }),
      user: null,
    };
  }

  // If ADMIN_EMAIL is set, validate strict match
  if (adminEmail && session.user.email?.toLowerCase() !== adminEmail.toLowerCase()) {
    console.warn(`[Forbidden Access Attempt] User ${session.user.email} attempted admin endpoint access.`);
    return {
      authorized: false,
      response: NextResponse.json({ error: 'Access Denied: You do not have administrator permissions.' }, { status: 403 }),
      user: session.user,
    };
  }

  return {
    authorized: true,
    response: null,
    user: session.user,
  };
}
