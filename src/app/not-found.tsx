import Link from "next/link";
import { buttonClasses } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

export default function NotFound() {
  return (
    <Container className="py-32 text-center">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-brand">404</p>
      <h1 className="mt-4 text-4xl font-normal sm:text-5xl">This page isn&apos;t booked.</h1>
      <p className="mt-4 text-body">The page you&apos;re looking for doesn&apos;t exist.</p>
      <Link href="/" className={buttonClasses("primary", "lg", "mt-8")}>
        Back to home
      </Link>
    </Container>
  );
}
