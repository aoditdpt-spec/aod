import Image from "next/image";
import Link from "@/components/ui/AppLink";
import { categoriesSection, categoryIcons } from "@/data/home";
import { categories } from "@/data/site";
import { Container } from "@/components/ui/Container";
import { Dots } from "@/components/ui/Dots";
import { Stagger, StaggerItem } from "@/components/motion/Reveal";
import { TiltCard } from "@/components/motion/TiltCard";

// The six categories as cards with a picture each (in the style of Urban Company's), arriving in a
// wave and leaning towards the pointer.
export function Categories() {
  return (
    <section id="categories" className="scroll-mt-20 border-t border-line py-20 lg:py-28">
      <Container>
        <h2 className="text-4xl sm:text-5xl">
          <Dots>{categoriesSection.title}</Dots>
        </h2>

        <Stagger className="mt-12 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          {categories.map((c) => (
            <StaggerItem key={c.slug}>
              <TiltCard className="h-full">
                <Link
                  href={`/categories/${c.slug}`}
                  className="flex h-full flex-col rounded-xl border border-line bg-gradient-to-b from-wash to-paper p-4 transition-colors hover:border-ink sm:p-6"
                >
                  {/* The category's picture (categoryIcons in src/data/home.ts), a transparent cut-out. */}
                  <Image src={categoryIcons[c.slug]} alt="" width={512} height={512} className="h-16 w-16 sm:h-24 sm:w-24" />
                  <span className="mt-4 text-xl font-medium leading-tight tracking-tight text-ink sm:mt-6 sm:text-2xl">{c.name}</span>
                  <span className="mt-2 text-sm text-muted">{c.blurb}</span>
                </Link>
              </TiltCard>
            </StaggerItem>
          ))}
        </Stagger>

      </Container>
    </section>
  );
}
