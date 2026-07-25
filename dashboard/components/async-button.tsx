'use client';

import { useState } from 'react';

export function AsyncButton({
  children,
  pendingLabel,
  className,
  onAction,
}: {
  children: React.ReactNode;
  pendingLabel: string;
  className?: string;
  onAction: () => Promise<void> | void;
}) {
  const [pending, setPending] = useState(false);

  async function run() {
    if (pending) return;
    setPending(true);
    try {
      await onAction();
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      aria-busy={pending}
      className={`${className ?? ''} ${pending ? 'is-pending' : ''}`.trim()}
      disabled={pending}
      onClick={run}
      type="button"
    >
      {pending && <span aria-hidden="true" className="spinner" />}
      <span>{pending ? pendingLabel : children}</span>
    </button>
  );
}
