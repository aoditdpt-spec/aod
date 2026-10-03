import { finalCta } from "@/content/site";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

// Big orange call-to-action band at the end of a page.
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
        <h2 className="text-3xl font-medium !text-white sm:text-[2.5rem]">{title}</h2>
        <p className="mt-3 text-lg text-white">{text}</p>
        {/* ButtonLink opens external links (e.g. Gmail compose) in a new tab */}
        <ButtonLink href={href} variant="white" className="mt-8">
          {cta}
        </ButtonLink>
      </section>
    </Container>
  );
}
