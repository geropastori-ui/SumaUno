"use client";

import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";

type BottomSheetProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
};

/** Hoja inferior accesible basada en <dialog> (foco atrapado y Esc nativos). */
export function BottomSheet({ open, onClose, title, children, footer }: BottomSheetProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      // Solo Esc (cancel) y el clic afuera piden cerrar: el cierre programático no avisa,
      // así abrir una hoja desde otra no las cierra a las dos.
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      aria-labelledby="sheet-title"
      className="m-0 mt-auto max-h-[90dvh] w-full max-w-none bg-transparent p-0 text-ink backdrop:backdrop-blur-[2px] sm:m-auto sm:max-w-md"
    >
      <div className="animate-sheet-up flex max-h-[90dvh] flex-col rounded-t-[28px] bg-surface pb-safe sm:rounded-[28px]">
        <div className="flex items-center justify-between px-5 pt-3">
          <span aria-hidden className="absolute left-1/2 top-2 h-1 w-10 -translate-x-1/2 rounded-full bg-line" />
          <h2 id="sheet-title" className="font-display pt-3 text-2xl font-bold uppercase tracking-wide">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="mt-2 grid size-10 place-items-center rounded-full text-muted hover:bg-surface-2"
            aria-label="Cerrar"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 pb-4 pt-2">{children}</div>
        {footer && <div className="border-t border-line px-5 py-3">{footer}</div>}
      </div>
    </dialog>
  );
}
