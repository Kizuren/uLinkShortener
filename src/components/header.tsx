'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, signOut, useSession } from 'next-auth/react';
import styles from './Header.module.css';
import LoadingIcon from '@/components/ui/LoadingIcon';
import { useToast } from '@/contexts/ToastContext';

const copyAccountIdToClipboard = (accountId: string) => {
  if (navigator.clipboard && accountId) {
    navigator.clipboard
      .writeText(accountId)
      .then(() => {
        const displayElement = document.querySelector(`.${styles.accountIdDisplay}`);
        if (displayElement) {
          displayElement.classList.add(styles.copied);
          setTimeout(() => {
            displayElement.classList.remove(styles.copied);
          }, 1500);
        }
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
      });
  }
};

export default function Header() {
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { data: session, status } = useSession();
  const { showToast } = useToast();

  const isLoggedIn = status === 'authenticated';
  const accountId = (session?.user?.accountId as string) || '';

  useEffect(() => {
    if (showLoginForm && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 10);
    }
  }, [showLoginForm]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const enteredAccountId = inputRef.current?.value;

    if (enteredAccountId) {
      setIsLoading(true);
      try {
        const result = await signIn('credentials', {
          accountId: enteredAccountId,
          redirect: false,
        });

        if (result?.error) {
          showToast('Account not found. Please check your Account ID.', 'error');
        } else {
          setShowLoginForm(false);
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Login error:', error);
        showToast('An error occurred during login. Please try again.', 'error');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleRegister = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Registration failed');
      }

      const data = await response.json();

      if (data.success && data.account_id) {
        await signIn('credentials', {
          accountId: data.account_id,
          redirect: false,
        });

        router.push('/dashboard');
      } else {
        throw new Error(data.message || 'Failed to create account');
      }
    } catch (error) {
      console.error('Registration error:', error);
      showToast('An error occurred during registration. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await signOut({ redirect: false });
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
      showToast('An error occurred during logout. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.logo}>
          <Link href='/'>
            <h1>µLinkShortener</h1>
          </Link>
        </div>

        <div className={styles.auth}>
          {status === 'loading' || isLoading ? (
            <LoadingIcon size={24} color='var(--accent)' />
          ) : isLoggedIn ? (
            <div className={`${styles.userInfo} ${styles.animateIn}`}>
              <span
                className={styles.accountIdDisplay}
                onClick={() => copyAccountIdToClipboard(accountId)}
                title='Click to copy account ID'
              >
                <span className={styles.idLabel}>Account ID: </span>
                {accountId}
                <span className={styles.copyMessage}>Copied!</span>
              </span>
              <button className={styles.logoutBtn} onClick={handleLogout}>
                Logout
              </button>
              <Link href='/dashboard'>
                <button className={styles.dashboardBtn}>Dashboard</button>
              </Link>
            </div>
          ) : !showLoginForm ? (
            <>
              <button className={styles.loginBtn} onClick={() => setShowLoginForm(true)}>
                Login
              </button>
              <button className={styles.registerBtn} onClick={handleRegister}>
                Register
              </button>
            </>
          ) : (
            <form
              onSubmit={handleLoginSubmit}
              className={`${styles.loginForm} ${styles.animateIn}`}
            >
              <input
                ref={inputRef}
                type='text'
                placeholder='Enter Account ID'
                pattern='[0-9]*'
                inputMode='numeric'
                className={styles.accountInput}
                required
              />
              <button type='submit' className={styles.loginSubmitBtn}>
                Login
              </button>
              <button
                type='button'
                className={styles.cancelBtn}
                onClick={() => setShowLoginForm(false)}
              >
                Cancel
              </button>
            </form>
          )}
        </div>
      </div>
    </header>
  );
}
