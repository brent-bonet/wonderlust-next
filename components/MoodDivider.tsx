import Image from "next/image";

export default function MoodDivider() {
  return (
    <section className="p-0 leading-[0]" aria-hidden="true">
      <Image
        src="/images/wonderlust-mood.jpg"
        alt="Wonderlust Salon Denver RiNo Arts District"
        width={2100}
        height={900}
        sizes="100vw"
        className="aspect-[21/9] w-full object-cover object-[center_top] saturate-[.95]"
      />
    </section>
  );
}
