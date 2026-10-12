import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

export const inputClasses =
  "w-full rounded-2xl border border-line bg-surface px-4 h-12 text-[16px] text-ink placeholder:text-muted outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/25 aria-[invalid=true]:border-danger";

type FieldProps = {
  label: string;
  htmlFor: string;
  hint?: ReactNode;
  error?: string;
  optional?: boolean;
  children: ReactNode;
  className?: string;
};

export function Field({ label, htmlFor, hint, error, optional, children, className }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-sm font-semibold text-ink-soft">
        {label}
        {optional && <span className="ml-1 font-normal text-muted">(opcional)</span>}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${htmlFor}-hint`} className="text-sm text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(inputClasses, className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(inputClasses, "h-auto min-h-24 py-3 leading-relaxed", className)}
      {...props}
    />
  );
}
