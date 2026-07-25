'use client';

import Image from 'next/image';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

interface LogoProps {
  variant?: 'full' | 'icon';
  className?: string;
}

export default function Logo({ variant = 'full', className }: LogoProps) {
  if (variant === 'icon') {
    return (
      <div
        className={cn(
          'relative h-8 w-8 shrink-0 overflow-hidden rounded-lg dark:bg-white dark:p-0.5',
          className
        )}
      >
        <Image
          src="/images/logo/dev-init-logo.png"
          alt="dev-init"
          fill
          className="object-cover object-left"
        />
      </div>
    );
  }

  return (
    <div className="inline-flex items-center rounded-md dark:bg-white dark:px-2 dark:py-1">
      <Image
        src="/images/logo/dev-init-logo.png"
        alt="dev-init"
        width={1200}
        height={459}
        preload
        className={cn('h-8 w-auto', className)}
      />
    </div>
  );
}
