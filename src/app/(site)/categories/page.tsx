import type { Metadata } from "next";
import { categories, categoriesPage } from "@/content/site";
import { Container } from "@/components/ui/Container";
import { VerifiedArtists } from "@/components/ui/VerifiedArtists";
import { CategoryTiles } from "@/components/categories/CategoryTiles";
import { MostBooked } from "@/components/home/MostBooked";

export const metadata: Metadata = {
  title: "All artist categories",
  description: `Book verified ${categories
    .slice(0, 4)
    .map((c) => c.name.toLowerCase())
    .join(", ")} and more in Ahmedabad and across Gujarat.`,
  alternates: { canonical: "/categories" },
};

// Every category as photo tiles (the app tab bar's Categories tab, like Headout's), then the
// most booked services.
export default function CategoriesPage() {
  return (
    <>
      <Container className="pb-12 pt-6 sm:pt-12">
        <h1 className="text-3xl font-bold sm:text-5xl sm:font-normal">{categoriesPage.title}</h1>
        <p className="mt-2 max-w-2xl text-body sm:mt-4 sm:text-lg">{categoriesPage.text}</p>
        <div className="mt-4">
          <VerifiedArtists variant="inline" />
        </div>
        <CategoryTiles className="mt-6 sm:mt-10" />
      </Container>
      <MostBooked />
    </>
  );
}
