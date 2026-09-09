'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, ArrowLeft, Sparkles } from 'lucide-react';
import DonationModal from '@/components/DonationModal';
import { useRouter } from 'next/navigation';

export default function DonarPage() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);

  const handleClose = () => {
    setIsOpen(false);
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
      {/* Background ambient */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-rose-950/20 via-slate-950 to-slate-950 pointer-events-none" />

      <div className="relative z-10 text-center max-w-lg mb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver al Gran Parrandón Navideño</span>
        </Link>
      </div>

      <DonationModal isOpen={isOpen} onClose={handleClose} />
    </div>
  );
}
