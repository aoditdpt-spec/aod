import { closing } from "@/data/home";
import { Container } from "@/components/ui/Container";
import { Dots } from "@/components/ui/Dots";
import { Reveal } from "@/components/motion/Reveal";

// The last word before the footer, with the logo's orange dot (its line and buttons were removed
// on request, 2026-11-18).
export function Closing() {
  return (
    <section className="border-t border-line py-24 lg:py-32">
      <Container>
        <Reveal>
          <h2 className="text-5xl sm:text-7xl">
            <Dots>{closing.title}</Dots>
          </h2>
        </Reveal>
      </Container>
    </section>
  );
}
