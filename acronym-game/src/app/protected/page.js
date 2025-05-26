'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProtectedPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // If the session is loading, do nothing yet.
    if (status === 'loading') return;

    // If there's no session (user is not authenticated), redirect to sign-in page.
    if (!session) {
      router.push('/signin');
    }
  }, [session, status, router]);

  // If the session is loading, or if there's no session (before redirection happens),
  // show a loading message or null to prevent flashing unauthenticated content.
  if (status === 'loading' || !session) {
    return <p>Loading...</p>;
  }

  // If authenticated, render the protected content.
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <main className="flex flex-col items-center justify-center flex-1 px-20 text-center">
        <h1 className="text-6xl font-bold">
          Protected Page
        </h1>
        <p className="mt-3 text-2xl">
          Welcome, {session.user?.username || session.user?.name || 'User'}!
        </p>
        <p className="mt-3">
          If you can see this, you are authenticated.
        </p>
      </main>
    </div>
  );
}
