'use client';

import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EntradaStatus } from '@/lib/entradas/types';

type ButtonVariant = 'primary' | 'verde' | 'outline' | 'quiet' | 'cream';
type ButtonSize = 'md' | 'lg' | 'sm';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-rojo text-paper hover:bg-rojo-2 shadow-[var(--shadow-soft)]',
  verde: 'bg-verde text-paper hover:bg-verde-2 shadow-[var(--shadow-soft)]',
  outline: 'bg-transparent text-ink border-2 border-ink/80 hover:bg-ink hover:text-paper',
  quiet: 'bg-transparent text-ink-2 hover:bg-paper-2 hover:text-ink',
  cream: 'bg-paper text-rojo hover:bg-card shadow-[var(--shadow-soft)]',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-9 px-3.5 text-sm rounded-lg gap-1.5',
  md: 'h-12 px-5 text-base rounded-xl gap-2',
  lg: 'h-14 px-7 text-lg rounded-xl gap-2.5',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, disabled, className, children, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-bold select-none transition-[background-color,color,transform,box-shadow] duration-150 active:translate-y-px disabled:opacity-50 disabled:pointer-events-none',
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...rest}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
});

export function Field({
  label,
  hint,
  error,
  children,
  htmlFor,
  className,
}: {
  label: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  children: ReactNode;
  htmlFor?: string;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={htmlFor} className="text-[0.95rem] font-bold text-ink">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-sm text-ink-3">{hint}</p>}
      {error && (
        <p role="alert" className="text-sm font-bold text-rojo">
          {error}
        </p>
      )}
    </div>
  );
}

export const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function TextInput(
  { className, ...rest },
  ref
) {
  return (
    <input
      ref={ref}
      className={cn(
        'h-12 w-full rounded-xl border-2 border-line bg-card px-4 text-base text-ink placeholder:text-ink-3 transition-colors focus:border-ink focus:outline-none disabled:opacity-60',
        className
      )}
      {...rest}
    />
  );
});

const NOTICE: Record<'info' | 'ok' | 'warn' | 'error', string> = {
  info: 'bg-paper-2 text-ink',
  ok: 'bg-verde-soft text-verde-2',
  warn: 'bg-oro-soft text-ink',
  error: 'bg-rojo-soft text-rojo-2',
};

export function Notice({
  tone = 'info',
  title,
  children,
  className,
}: {
  tone?: keyof typeof NOTICE;
  title?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={cn('rounded-xl px-4 py-3 text-[0.95rem]', NOTICE[tone], className)}>
      {title && <p className="font-bold">{title}</p>}
      {children && <div className={cn(title && 'mt-0.5')}>{children}</div>}
    </div>
  );
}

const PILL: Record<EntradaStatus, string> = {
  sin_vender: 'bg-paper-2 text-ink-2',
  por_verificar: 'bg-oro-soft text-oro-ink',
  activa: 'bg-verde-soft text-verde-2',
  anulada: 'bg-rojo-soft text-rojo-2',
};

const PILL_LABEL: Record<EntradaStatus, string> = {
  sin_vender: 'Sin vender',
  por_verificar: 'Por verificar',
  activa: 'Activa',
  anulada: 'Anulada',
};

export function StatusPill({
  status,
  className,
  publicView = false,
}: {
  status: EntradaStatus;
  className?: string;
  publicView?: boolean;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-sm font-bold whitespace-nowrap',
        PILL[status],
        className
      )}
    >
      <span
        aria-hidden
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          status === 'activa' && 'bg-verde',
          status === 'por_verificar' && 'bg-oro',
          status === 'sin_vender' && 'bg-ink-3',
          status === 'anulada' && 'bg-rojo'
        )}
      />
      {publicView && status === 'sin_vender' ? 'Sin activar' : PILL_LABEL[status]}
    </span>
  );
}

export function Spinner({ label = 'Cargando…', className }: { label?: string; className?: string }) {
  return (
    <div className={cn('flex items-center justify-center gap-2 py-10 text-ink-2', className)}>
      <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
      <span>{label}</span>
    </div>
  );
}

// Selector de opciones grandes (método de pago, tipo de vendedor…).
export function Choice<T extends string>({
  value,
  onChange,
  options,
  name,
  className,
}: {
  value: T | null;
  onChange: (v: T) => void;
  options: { value: T; label: ReactNode; detail?: ReactNode }[];
  name: string;
  className?: string;
}) {
  return (
    <div role="radiogroup" aria-label={name} className={cn('grid gap-2', className)}>
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              'flex min-h-12 flex-col items-start justify-center rounded-xl border-2 px-4 py-2.5 text-left transition-colors',
              active ? 'border-ink bg-ink text-paper' : 'border-line bg-card text-ink hover:border-ink-3'
            )}
          >
            <span className="font-bold">{o.label}</span>
            {o.detail && <span className={cn('text-sm', active ? 'text-paper/80' : 'text-ink-3')}>{o.detail}</span>}
          </button>
        );
      })}
    </div>
  );
}
