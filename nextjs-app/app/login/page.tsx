'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [tokenInput, setTokenInput] = useState('');

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const token = tokenInput.trim() || `guest-${Date.now()}`;
    login(token);
    router.push('/');
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 p-4 dark:from-gray-900 dark:to-gray-800">
      <section className="mx-auto mt-16 max-w-md rounded-2xl bg-white p-8 shadow-xl dark:bg-gray-900">
        <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">Sign in to Sakash Voice</h1>
        <p className="mb-6 text-gray-600 dark:text-gray-300">Enter your auth token or continue as a guest session.</p>

        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200" htmlFor="token">
            Access token
          </label>
          <input
            id="token"
            value={tokenInput}
            onChange={(event) => setTokenInput(event.target.value)}
            placeholder="Paste your token"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />

          <button
            type="submit"
            className="w-full rounded-lg bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-700"
          >
            Continue
          </button>
        </form>

        <Link href="/" className="mt-4 inline-block text-sm text-blue-600 hover:underline">
          Back to mode selection
        </Link>
      </section>
    </main>
  );
}
