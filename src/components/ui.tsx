import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "gold" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-[var(--radius)] font-semibold transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2",
        size === "sm" && "px-3 py-1.5 text-sm",
        size === "md" && "px-5 py-2.5 text-sm",
        size === "lg" && "px-7 py-3.5 text-base",
        variant === "primary" && "bg-burdeo text-marfil hover:bg-burdeo-600 shadow-sm",
        variant === "gold" && "bg-dorado text-negro hover:bg-dorado-soft shadow-sm",
        variant === "outline" &&
          "border-[1.5px] border-dashed border-burdeo/35 bg-transparent hover:bg-burdeo/5",
        variant === "ghost" && "hover:bg-white/10",
        className,
      )}
      {...props}
    />
  );
}

/** Tarjeta con estilo "ticket": borde punteado, esquinas suaves. */
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius)] border-[1.5px] border-dashed border-burdeo/25 bg-card shadow-[0_1px_3px_rgba(20,16,15,0.06)]",
        className,
      )}
      {...props}
    />
  );
}

/** Etiqueta tipo "sello": esquinas cuadradas, borde punteado, mayúsculas. */
export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border-[1.5px] border-dashed border-dorado/50 bg-dorado/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-burdeo",
        className,
      )}
      {...props}
    />
  );
}

/** Sello circular para puntajes destacados (doble anillo, número rotado). */
export function ScoreStamp({
  value,
  size = 88,
  rotate = -6,
  tone = "coral",
  className,
}: {
  value: number | string;
  size?: number;
  rotate?: number;
  tone?: "coral" | "gold";
  className?: string;
}) {
  const color = tone === "gold" ? "var(--dorado)" : "var(--coral)";
  return (
    <div
      className={cn("mx-auto flex shrink-0 items-center justify-center rounded-full", className)}
      style={{
        width: size,
        height: size,
        border: `3px double ${color}`,
        transform: `rotate(${rotate}deg)`,
      }}
    >
      <span
        className="font-black leading-none"
        style={{ color, fontSize: size * 0.36, transform: `rotate(${-rotate}deg)` }}
      >
        {value}
      </span>
    </div>
  );
}

/** Rótulo tipo "sello de goma": rotado, fondo sólido, mayúsculas pequeñas. */
export function StampLabel({
  children,
  rotate = -3,
  className,
}: {
  children: React.ReactNode;
  rotate?: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-block rounded-md bg-burdeo px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-marfil",
        className,
      )}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      {children}
    </span>
  );
}
