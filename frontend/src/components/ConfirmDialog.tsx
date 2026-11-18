import { useEffect, useRef, type ReactNode } from 'react';
export default function ConfirmDialog({ title, children, busy, onDismiss }: { title: string; children: ReactNode; busy: boolean; onDismiss: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return <dialog ref={ref} aria-labelledby="confirm-title" onCancel={event => { event.preventDefault(); if (!busy) onDismiss(); }} className="m-auto w-[calc(100%-40px)] max-w-sm rounded-3xl bg-white p-6 shadow-xl backdrop:bg-black/50">
    <div className="flex flex-col gap-4"><h2 id="confirm-title" className="font-display font-bold">{title}</h2>{children}</div>
  </dialog>;
}
