'use client';

import { useEffect, useRef } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { useToast } from '@/contexts/ToastContext';

export default function SessionMonitor() {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (!session?.user) return;

    const checkSession = async () => {
      try {
        const res = await fetch('/api/auth/check-session');

        if (!res.ok) {
          const data = await res.json();
          console.log('Session check failed:', data.message);

          showToast('Your session has expired or been revoked from another device', 'error');
          await signOut({ redirect: true, callbackUrl: '/' });
        }
      } catch (error) {
        console.error('Error checking session:', error);
      }
    };

    intervalRef.current = setInterval(checkSession, 10000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [session, showToast]);

  return null;
}
