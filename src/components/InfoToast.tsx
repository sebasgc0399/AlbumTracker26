import { useEffect, useState } from 'react';

const VISIBLE_MS = 3_000;

export type InfoToastVariant = 'success' | 'destructive' | 'neutral';

export interface InfoToastMessage {
  id: number;
  text: string;
  variant: InfoToastVariant;
}

interface InfoToastProps {
  message: InfoToastMessage | null;
  onDismiss: () => void;
}

const VARIANT_CLASSES: Record<InfoToastVariant, string> = {
  success: 'bg-success text-success-foreground',
  destructive: 'bg-destructive text-destructive-foreground',
  neutral: 'bg-foreground text-background',
};

export default function InfoToast({ message, onDismiss }: InfoToastProps) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!message) {
      setHidden(false);
      return;
    }
    setHidden(false);
    const id = window.setTimeout(() => {
      setHidden(true);
      onDismiss();
    }, VISIBLE_MS);
    return () => window.clearTimeout(id);
  }, [message, onDismiss]);

  if (!message || hidden) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-20 z-40 flex justify-center px-4"
    >
      <div
        className={`pointer-events-auto relative flex max-w-md items-center gap-3 overflow-hidden rounded-full px-4 py-2 text-sm font-semibold shadow-lg ${VARIANT_CLASSES[message.variant]}`}
      >
        <span>{message.text}</span>
        <span
          key={message.id}
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-current opacity-40"
          style={{ animation: `at26-countdown ${VISIBLE_MS}ms linear forwards` }}
        />
      </div>
    </div>
  );
}
