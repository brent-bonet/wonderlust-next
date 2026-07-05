import BookBand from "@/components/BookBand";
import Hero from "@/components/Hero";
import MoodDivider from "@/components/MoodDivider";
import ServicesMenu from "@/components/ServicesMenu";
import Team from "@/components/Team";
import Visit from "@/components/Visit";
import { getBusinessHours, getServiceGroups, getStylists } from "@/lib/data";

export default async function Home() {
  const [groups, stylists, hours] = await Promise.all([
    getServiceGroups(),
    getStylists(),
    getBusinessHours(),
  ]);

  return (
    <main id="top">
      <Hero />
      <ServicesMenu groups={groups} />
      <MoodDivider />
      <Team stylists={stylists} />
      <BookBand />
      <Visit hours={hours} />
    </main>
  );
}
