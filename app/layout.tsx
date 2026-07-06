import type { Metadata } from "next";
import {
  Instrument_Serif,
  Karla,
  Special_Elite,
  Spline_Sans_Mono,
} from "next/font/google";
import "./globals.css";
import AuthHashHandler from "@/components/admin/AuthHashHandler";

/* Exact font families from the reference file — do not substitute. */
const display = Instrument_Serif({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

const typed = Special_Elite({
  variable: "--font-typed",
  subsets: ["latin"],
  weight: "400",
});

const body = Karla({
  variable: "--font-body",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const mono = Spline_Sans_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://wonderlustsalon.com"),
  title: "Wonderlust Salon — RiNo, Denver",
  description:
    "Wonderlust Salon: cuts, color, balayage, and styling in Denver's RiNo Arts District. Book online.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    title: "Wonderlust Salon — RiNo, Denver",
    description:
      "Cuts, color, balayage, and styling in Denver's RiNo Arts District. Three chairs. No assembly line. Book online.",
    url: "/",
    images: [{ url: "/images/wonderlust-exterior.jpg", width: 1200, height: 900 }],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Wonderlust Salon — RiNo, Denver",
    description:
      "Cuts, color, balayage, and styling in Denver's RiNo Arts District. Book online.",
    images: ["/images/wonderlust-exterior.jpg"],
  },
  robots: { index: true, follow: true },
};

const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "HairSalon",
  name: "Wonderlust Salon",
  description:
    "Cuts, color, balayage, and styling in Denver's RiNo Arts District. Three chairs. No assembly line.",
  url: "https://wonderlustsalon.com",
  telephone: "+1-303-297-8463",
  email: "wonderlust.salon@gmail.com",
  image: "https://wonderlustsalon.com/images/wonderlust-exterior.jpg",
  priceRange: "$$",
  address: {
    "@type": "PostalAddress",
    streetAddress: "1309 22nd Street",
    addressLocality: "Denver",
    addressRegion: "CO",
    postalCode: "80205",
    addressCountry: "US",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 39.75528439384605,
    longitude: -104.99025050378155,
  },
  openingHoursSpecification: [
    { "@type": "OpeningHoursSpecification", dayOfWeek: "Tuesday", opens: "09:00", closes: "20:00" },
    { "@type": "OpeningHoursSpecification", dayOfWeek: "Wednesday", opens: "09:00", closes: "20:00" },
    { "@type": "OpeningHoursSpecification", dayOfWeek: "Thursday", opens: "09:00", closes: "20:00" },
    { "@type": "OpeningHoursSpecification", dayOfWeek: "Friday", opens: "09:00", closes: "20:00" },
    { "@type": "OpeningHoursSpecification", dayOfWeek: "Saturday", opens: "09:00", closes: "20:00" },
  ],
  sameAs: [
    "https://www.instagram.com/wonderlust.salon/",
    "https://www.facebook.com/wonderlust.salon/",
    "https://www.yelp.com/biz/wonderlust-salon-denver",
  ],
  hasMap: "https://maps.google.com/?cid=6761306963118573768",
  currenciesAccepted: "USD",
  paymentAccepted: "Cash, Credit Card",
  areaServed: { "@type": "City", name: "Denver" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${typed.variable} ${body.variable} ${mono.variable}`}
    >
      <body className="bg-paper font-body leading-[1.6] text-ink antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
        />
        <AuthHashHandler />
        {children}
      </body>
    </html>
  );
}
