import Link from "next/link";
import { finalCta } from "@/content/site";
import { buttonClasses } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

// Big green call-to-action band at the end of a page.
export function FinalCta({
  title = "Stop hunting. Start booking.",
  text = finalCta.text,
  cta = "Book an artist",
  href = "/book",
}: {
  title?: string;
  text?: string;
  cta?: string;
  href?: string;
}) {
  return (
    <Container className="pt-16">
      <section className="rounded-[1.25rem] bg-gradient-to-r from-brand-bright via-brand to-brand-bright px-6 py-14 text-center">
        <h2 className="text-3xl font-medium !text-white sm:text-[40px]">{title}</h2>
        <p className="mt-3 text-lg text-white">{text}</p>
        <Link href={href} className={buttonClasses("white", "md", "mt-8")}>
          {cta}
        </Link>
      </section>
    </Container>
  );
}
