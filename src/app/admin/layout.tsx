'use client';

import { useState, useEffect } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import { ShieldCheck, Lock, KeyRound, ArrowLeft, Eye, EyeOff, Loader2, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    // Check if session storage has authenticated flag
    const auth = sessionStorage.getItem('parrandon_admin_auth');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
    setIsCheckingAuth(false);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    setTimeout(() => {
      if (password === '#Seminario31') {
        sessionStorage.setItem('parrandon_admin_auth', 'true');
        setIsAuthenticated(true);
      } else {
        setErrorMsg('Contraseña incorrecta. Verifica con la administración del Seminario.');
      }
      setLoading(false);
    }, 400);
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-xs">
        <Loader2 className="h-6 w-6 text-amber-400 animate-spin mr-2" />
        <span>Verificando credenciales...</span>
      </div>
    );
  }

  // If NOT authenticated, render the Password Lock Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-blue-950/40 to-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl border border-amber-500/40 bg-slate-900/90 p-6 sm:p-8 shadow-2xl backdrop-blur-xl text-center space-y-6 animate-fadeIn">
          
          <div className="h-16 w-16 rounded-3xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30 shadow-lg shadow-amber-500/20">
            <Lock className="h-8 w-8" />
          </div>

          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 block mb-1">
              Seminario Mayor Santo Tomás de Aquino
            </span>
            <h2 className="text-2xl font-black text-white">
              Panel Administrativo
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Ingresa la contraseña de seguridad para acceder a la gestión y reportes del Parrandón 2026.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Contraseña de Administrador
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Introduce la contraseña..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl bg-slate-950 border border-slate-700 pl-10 pr-10 py-3 text-xs text-white focus:outline-none focus:border-amber-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-500 hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="rounded-xl bg-rose-950/80 border border-rose-500/40 p-3 text-xs text-rose-300">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 py-3.5 text-sm font-black text-slate-950 transition-all shadow-xl shadow-amber-500/25"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Validando acceso...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  <span>Ingresar al Panel</span>
                </>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-center">
            <Link
              href="/administracion-interna"
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Volver a Administración Interna</span>
            </Link>
          </div>

        </div>
      </div>
    );
  }

  // If Authenticated, render the protected admin layout
  return (
    <div className="flex-1 flex flex-col lg:flex-row min-h-[calc(100vh-4rem)] bg-slate-950">
      <AdminSidebar onLogout={() => {
        sessionStorage.removeItem('parrandon_admin_auth');
        setIsAuthenticated(false);
      }} />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
