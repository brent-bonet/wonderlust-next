/* Reference .eyebrow and .sect-title */

export function Eyebrow({
  children,
  className = "text-toner-deep",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={`mb-3.5 font-mono text-[.8rem] uppercase tracking-[.18em] ${className}`}
    >
      {children}
    </p>
  );
}

export function SectTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-10 font-display text-[clamp(2rem,5vw,3rem)] font-normal leading-[1.1]">
      {children}
    </h2>
  );
}
