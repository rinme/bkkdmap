import React, { useState } from 'react';
import { Lock, ArrowRight, ShieldCheck, KeyRound } from 'lucide-react';
import { Button } from '../ui/Button';

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
    <div className="max-w-md w-full mx-auto my-8 glass-panel rounded-3xl p-8 border border-white/[0.1] shadow-2xl text-center space-y-6 bg-[#0c1322]/90">
      <div className="relative w-16 h-16 mx-auto rounded-3xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shadow-glow-emerald">
        <Lock className="w-7 h-7" />
        <div className="absolute -inset-1 rounded-3xl bg-emerald-500/20 blur-xl -z-10" />
      </div>

      <div>
        <h2 className="text-2xl font-black text-white tracking-tight">
          Admin Dashboard
        </h2>
        <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
          Enter your admin password to log visits, edit district landmarks, and manage data.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300">
            Admin Password
          </label>
          <div className="relative">
            <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password (default: bkk2026)"
              className="w-full pl-10 pr-4 py-2.5 bg-[#060913]/90 border border-white/[0.1] rounded-2xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all shadow-inner"
            />
          </div>
          {error && <p className="text-xs font-bold text-rose-400 mt-1">{error}</p>}
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={loading}
          className="w-full mt-2"
        >
          <span>Unlock Admin Panel</span>
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </form>

      <div className="pt-3 text-[11px] text-slate-400 border-t border-white/[0.06]">
        Configured via <code className="bg-[#060913] px-1.5 py-0.5 rounded text-emerald-400 font-mono text-[10px]">ADMIN_PASSWORD</code> in <code className="bg-[#060913] px-1.5 py-0.5 rounded text-slate-300 font-mono text-[10px]">.env.local</code>
      </div>
    </div>
  );
};

