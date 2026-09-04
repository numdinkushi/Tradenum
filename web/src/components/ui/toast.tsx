"use client";

import { useEffect, useState } from "react";

type ToastItem = {
  id: number;
  message: string;
  confirm?: { label: string; resolve: (ok: boolean) => void };
};

let nextId = 1;
let items: ToastItem[] = [];
const listeners = new Set<(next: ToastItem[]) => void>();

function emit() {
  for (const listener of listeners) listener(items);
}

function dismiss(id: number) {
  items = items.filter((item) => item.id !== id);
  emit();
}

export function toast(message: string) {
  const id = nextId++;
  items = [...items, { id, message }];
  emit();
  window.setTimeout(() => dismiss(id), 5600);
}

export function toastConfirm(message: string, confirmLabel = "OK"): Promise<boolean> {
  return new Promise((resolve) => {
    const id = nextId++;
    items = [
      ...items,
      {
        id,
        message,
        confirm: {
          label: confirmLabel,
          resolve: (ok) => {
            dismiss(id);
            resolve(ok);
          },
        },
      },
    ];
    emit();
  });
}

export function ToastViewport() {
  const [toasts, setToasts] = useState(items);

  useEffect(() => {
    listeners.add(setToasts);
    setToasts(items);
    return () => {
      listeners.delete(setToasts);
    };
  }, []);

  if (!toasts.length) return null;

  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2">
      {toasts.map((item) => (
        <div
          key={item.id}
          className="pointer-events-auto border border-white/10 bg-[#12141c]/95 px-3 py-2 font-mono text-[11px] leading-relaxed text-white/85 shadow-lg backdrop-blur"
        >
          <p>{item.message}</p>
          {item.confirm ? (
            <div className="mt-2 flex justify-end gap-1.5">
              <button
                type="button"
                onClick={() => item.confirm?.resolve(false)}
                className="rounded px-2 py-1 text-[10px] tracking-[0.14em] uppercase text-white/50 hover:bg-white/10 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => item.confirm?.resolve(true)}
                className="rounded bg-amber-300 px-2 py-1 text-[10px] tracking-[0.14em] uppercase text-black hover:bg-amber-200"
              >
                {item.confirm.label}
              </button>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
