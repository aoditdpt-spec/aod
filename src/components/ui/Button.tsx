import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "outline" | "white" | "dark" | "ghost-light";
type Size = "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-brand text-white hover:bg-brand-hover",
  outline: "border-2 border-brand text-brand hover:bg-wash",
  white: "bg-white text-ink hover:bg-wash",
  dark: "bg-night text-white hover:bg-black",
  "ghost-light": "border border-white/70 text-white hover:bg-white/10",
};

const sizes: Record<Size, string> = {
  md: "h-10 px-5 text-sm",
  lg: "h-12 px-7 text-base",
};

export function buttonClasses(variant: Variant = "primary", size: Size = "md", className = "") {
  return `inline-flex items-center justify-center gap-2 rounded-lg font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${variants[variant]} ${sizes[size]} ${className}`;
}

type ButtonLinkProps = Omit<ComponentProps<typeof Link>, "className"> & {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
};

// Internal links go through next/link; external ones (WhatsApp, tel:, mailto:) open as plain anchors.
export function ButtonLink({ variant, size, className, href, children, ...rest }: ButtonLinkProps) {
  const classes = buttonClasses(variant, size, className);
  const url = String(href);
  if (/^(https?:|tel:|mailto:)/.test(url)) {
    const external = url.startsWith("http");
    return (
      <a
        href={url}
        className={classes}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={classes} {...rest}>
      {children}
    </Link>
  );
}
