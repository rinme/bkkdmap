import React, { useState } from 'react';
import { Lock, ArrowRight, ShieldCheck, KeyRound } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface AdminLoginFormProps {
  onSuccess: () => void;
}

export const AdminLoginForm: React.FC<AdminLoginFormProps> = ({ onSuccess }) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Please enter admin password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Incorrect admin password');
      } else {
        onSuccess();
      }
    } catch (err: any) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-6">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-sm">
        <Lock className="w-7 h-7" />
      </div>

      <div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Admin Dashboard
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Enter your secure admin password to manage districts and logged places.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Admin Password
          </label>
          <div className="relative">
            <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password (default: bkk2026)"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>
          {error && <p className="text-xs font-semibold text-rose-500 mt-1">{error}</p>}
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={loading}
          className="w-full"
        >
          <span>Unlock Admin Panel</span>
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </form>

      <div className="pt-2 text-[11px] text-slate-400 border-t border-slate-100 dark:border-slate-800">
        Configured via <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">ADMIN_PASSWORD</code> in <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">.env.local</code>
      </div>
    </div>
  );
};
