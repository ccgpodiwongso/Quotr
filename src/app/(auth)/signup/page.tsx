'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password, companyName }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Er is iets misgegaan.');
        return;
      }

      // Redirect to login so they can sign in (or handle email confirmation)
      router.push('/login?registered=true');
    } catch {
      setError('Er is iets misgegaan. Probeer het opnieuw.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="bg-white border border-zinc-200 shadow-sm rounded-[6px] p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">
            Quotr
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Maak een nieuw account aan
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-[4px] px-3 py-2">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-zinc-700 mb-1">
              Volledige naam
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              placeholder="Jan de Vries"
              className="w-full rounded-[4px] border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-zinc-700 mb-1">
              E-mailadres
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="naam@bedrijf.nl"
              className="w-full rounded-[4px] border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-zinc-700 mb-1">
              Wachtwoord
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="Minimaal 8 tekens"
              className="w-full rounded-[4px] border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="companyName" className="block text-sm font-medium text-zinc-700 mb-1">
              Bedrijfsnaam
            </label>
            <input
              id="companyName"
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
              placeholder="Mijn Bedrijf B.V."
              className="w-full rounded-[4px] border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#111112] text-white text-sm font-medium py-2 px-4 rounded-[4px] hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Account aanmaken...' : 'Account aanmaken'}
          </button>
        </form>
      </div>

      <p className="text-center text-sm text-zinc-500 mt-4">
        Al een account?{' '}
        <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
          Inloggen
        </Link>
      </p>
    </div>
  );
}
