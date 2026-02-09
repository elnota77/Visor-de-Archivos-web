'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, ArrowRight, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const res = await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });

            if (res.ok) {
                router.push('/');
            } else {
                setError('Access Denied');
                setIsLoading(false);
            }
        } catch {
            setError('Connection Error');
            setIsLoading(false);
        }
    };

    return (
        <main className="flex min-h-screen items-center justify-center bg-[#0a0a12] font-mono relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(61,90,254,0.1),transparent_70%)]" />
            <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-neon-blue/5 to-transparent" />

            <div className="relative z-10 w-full max-w-md p-8">
                <div className="backdrop-blur-xl bg-black/60 border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] p-0 overflow-hidden ring-1 ring-white/5">

                    {/* Header */}
                    <div className="bg-white/5 p-6 border-b border-white/5 flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-blue to-neon-cyan p-[1px]">
                            <div className="w-full h-full rounded-2xl bg-black flex items-center justify-center">
                                <ShieldCheck size={32} className="text-neon-cyan" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-wider text-center">SECURE ACCESS</h1>
                            <p className="text-gray-500 text-xs text-center tracking-[0.2em] mt-1">WEB FILE MANAGER SYSTEM</p>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-8">
                        <div className="mb-6 relative group">
                            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-neon-cyan transition-colors" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter Access Key"
                                className="w-full bg-black/50 text-white border border-white/10 rounded-xl py-4 pl-12 pr-4 outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan/50 transition-all placeholder:text-gray-700 font-bold tracking-widest"
                                autoFocus
                            />
                        </div>

                        {error && (
                            <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 text-center text-sm py-2 rounded-lg font-bold animate-pulse">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-neon-blue to-neon-cyan text-black font-black py-4 rounded-xl hover:shadow-[0_0_20px_rgba(0,229,255,0.4)] transition-all active:scale-[0.98] flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'AUTHENTICATING...' : 'INITIALIZE SESSION'}
                            {!isLoading && <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />}
                        </button>
                    </form>
                </div>

                <div className="mt-8 text-center">
                    <p className="text-gray-600 text-[10px] tracking-widest uppercase">
                        Encrypted Connection • Version 2.0.26
                    </p>
                </div>
            </div>
        </main>
    );
}
