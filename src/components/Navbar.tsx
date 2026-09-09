'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Ticket, Home, Search, ArrowLeft, ShieldCheck, Heart, Music2 } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/admin') || pathname === '/administracion-interna' || pathname === '/escanear' || pathname === '/cocina';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-primary/25 bg-background/95 backdrop-blur-md">
      <div className="border-b border-primary/20 bg-secondary px-4 py-2 text-[10px] font-bold uppercase tracking-[.12em] text-primary">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <span className="inline-flex items-center gap-2"><Music2 className="size-3" /> La navidad se celebra en comunidad</span>
          <span className="hidden sm:inline text-secondary-foreground/70">12 de diciembre · 6:00 p. m.</span>
        </div>
      </div>
      <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="group flex min-w-0 items-center gap-3">
          <div className="relative size-11 shrink-0 sm:size-12"><Image src="/images/seminario-logo.png" alt="Escudo del Seminario Mayor Santo Tomás de Aquino" fill sizes="48px" className="object-contain" priority /></div>
          <div className="min-w-0">
            <div className="flex items-center gap-2"><span className="font-serif text-base font-bold tracking-tight text-foreground sm:text-lg">Parrandón</span><span className="bg-primary px-1.5 py-0.5 text-[9px] font-black text-primary-foreground">2026</span></div>
            <span className="block truncate text-[10px] uppercase tracking-[.1em] text-muted-foreground">Seminario Mayor Santo Tomás</span>
          </div>
        </Link>
        <nav className="flex items-center gap-1.5 sm:gap-2">
          {!isAdmin ? <>
            <Link href="/" className={`hidden items-center gap-2 px-3 py-2 text-xs font-bold sm:flex ${pathname === '/' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}><Home className="size-4" /> Inicio</Link>
            <Link href="/#consultar" className="hidden items-center gap-2 px-3 py-2 text-xs font-bold text-muted-foreground hover:text-foreground md:flex"><Search className="size-4" /> Consultar</Link>
            <Link href="/donar" className={`flex items-center gap-2 border px-3 py-2 text-xs font-bold ${pathname === '/donar' ? 'border-accent bg-accent text-accent-foreground' : 'border-accent/50 text-accent hover:bg-accent hover:text-accent-foreground'}`}><Heart className="size-3.5" /> <span>Donar</span></Link>
            <Link href="/comprar" className="flex items-center gap-2 bg-primary px-3.5 py-2.5 text-xs font-black text-primary-foreground shadow-lg shadow-primary/20 sm:px-5"><Ticket className="size-4" /> <span>Comprar</span></Link>
          </> : <div className="flex items-center gap-2"><Link href="/administracion-interna" className="flex items-center gap-2 border border-primary/40 bg-secondary px-3 py-2 text-xs font-bold text-primary"><ShieldCheck className="size-4" /> Hub Operativo</Link><Link href="/" className="flex items-center gap-2 border border-border px-3 py-2 text-xs font-bold text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /><span className="hidden sm:inline">Portada</span></Link></div>}
        </nav>
      </div>
    </header>
  );
}
