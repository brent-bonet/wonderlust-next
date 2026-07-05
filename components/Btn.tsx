import Link from "next/link";

/*
 * Reference .btn: 12px 22px padding, pill radius, .82rem/700/uppercase,
 * .12em tracking, background+transform transition at .15s ease.
 * "violet" = reference .btn.violet (toner bg). "band" = .book-band .btn
 * (toner bg, paper hover). Renders a Link when href is given, else a button.
 */
const base =
  "inline-block cursor-pointer rounded-full border-none px-[22px] py-3 text-[.82rem] font-bold uppercase tracking-[.12em] no-underline transition-[background-color,transform] duration-150 ease-[ease] hover:-translate-y-px focus-visible:-translate-y-px disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0";

const variants = {
  default: "bg-ink text-paper hover:bg-toner-deep focus-visible:bg-toner-deep",
  violet: "bg-toner text-ink hover:bg-toner-deep hover:text-paper",
  band: "bg-toner text-ink hover:bg-paper",
} as const;

type CommonProps = {
  variant?: keyof typeof variants;
  className?: string;
  children: React.ReactNode;
};

type LinkProps = CommonProps & { href: string };
type ButtonProps = CommonProps & {
  href?: undefined;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
};

export default function Btn(props: LinkProps | ButtonProps) {
  const { variant = "default", className = "", children } = props;
  const classes = `${base} ${variants[variant]} ${className}`;

  if (props.href !== undefined) {
    return (
      <Link href={props.href} className={classes}>
        {children}
      </Link>
    );
  }
  return (
    <button
      type={props.type ?? "button"}
      onClick={props.onClick}
      disabled={props.disabled}
      className={classes}
    >
      {children}
    </button>
  );
}
