import type {
  BookableService,
  HoursRow,
  ServiceGroup,
  StylistCard,
} from "./types";

/**
 * Content mirrored verbatim from reference/index.html (names, categories, and
 * display prices are exact). Used whenever Supabase isn't configured or a
 * query fails, so the site always renders the reference design; also the
 * source of truth for the seed script. Durations and deposits are sensible
 * defaults the owner can edit in /admin.
 */

const svc = (
  id: string,
  category: string,
  name: string,
  price: number | null,
  priceDisplay: string,
  durationMinutes: number,
  overrides: Partial<BookableService> = {},
): BookableService => ({
  id,
  name,
  category,
  description: null,
  price,
  priceDisplay,
  durationMinutes,
  // Default policy: cheap flat services are paid in full at booking; priced
  // services take a $20 deposit under $100, $50 at $100+; consults are free.
  depositAmount:
    price === null || price === 0 ? null : price >= 100 ? 50 : 20,
  fullPrepayment: false,
  ...overrides,
});

const CUTS = "Haircuts & Color";
const STYLING = "Styling & Specialty";
const AESTHETIC = "Aesthetic";

export const FALLBACK_SERVICES: BookableService[] = [
  svc("svc-womens-haircut", CUTS, "Women's haircut", 80, "$80+", 60),
  svc("svc-mens-haircut", CUTS, "Men's haircut", 45, "$45+", 45),
  svc("svc-kids-haircut", CUTS, "Kid's haircut", 25, "$25+", 30),
  svc("svc-all-over-color", CUTS, "All-over color", 70, "$70+", 120),
  svc("svc-partial-highlight", CUTS, "Partial highlight", 100, "$100+", 150),
  svc("svc-full-highlight", CUTS, "Full highlight", 120, "$120+", 180),
  svc("svc-partial-hl-color", CUTS, "Partial highlight/color", 140, "$140+", 180),
  svc("svc-full-hl-color", CUTS, "Full highlight/color", 150, "$150+", 210),
  svc("svc-balayage", CUTS, "Balayage", 100, "$100+", 180),
  svc("svc-toner-gloss", CUTS, "Toner / gloss", 20, "$20+", 45),
  svc("svc-blowout", STYLING, "Blowout", 40, "$40+", 45),
  svc("svc-updo", STYLING, "Updo", 60, "$60+", 60),
  svc("svc-bridal-styling", STYLING, "Bridal styling", 90, "$90+", 90),
  svc("svc-perm", STYLING, "Perm", 125, "$125+", 150),
  svc("svc-brazilian-blowout", STYLING, "Brazilian Blowout", 150, "$150+", 180),
  svc("svc-b3", STYLING, "Brazilian Bond Builder", 25, "$25+", 30),
  svc("svc-split-end-mender", STYLING, "Split End Mender", 25, "$25+", 30),
  svc("svc-extensions", STYLING, "Extensions", null, "consult", 30),
  svc("svc-facial-waxing", AESTHETIC, "Facial waxing", 15, "$15", 15, {
    depositAmount: null,
    fullPrepayment: true,
  }),
  svc("svc-consultation", AESTHETIC, "Consultation", 0, "free", 30),
  svc("svc-makeup-airbrush", AESTHETIC, "Makeup & airbrush", null, "consult", 60),
];

export function groupServices(services: BookableService[]): ServiceGroup[] {
  const groups = new Map<string, ServiceGroup>();
  for (const service of services) {
    const title = service.category || "Services";
    if (!groups.has(title)) groups.set(title, { title, items: [] });
    groups.get(title)!.items.push({
      name: service.name,
      price: service.priceDisplay,
    });
  }
  return [...groups.values()];
}

export const FALLBACK_SERVICE_GROUPS: ServiceGroup[] =
  groupServices(FALLBACK_SERVICES);

export const FALLBACK_STYLISTS: StylistCard[] = [
  {
    id: "sty-lindsey",
    name: "Lindsey Kubla",
    role: "Owner / Master Stylist",
    bio: "Placeholder bio — a couple of sentences on specialties (color? balayage? curly hair?), years behind the chair, and what she loves about RiNo.",
    photoUrl: "/images/lindsey.jpg",
  },
  {
    id: "sty-amy",
    name: "Amy",
    role: "Master Stylist",
    bio: "Placeholder bio — needs a photo and last name too.",
    photoUrl: null,
  },
  {
    id: "sty-reiley",
    name: "Reiley",
    role: "Hairstylist",
    bio: "Placeholder bio — photo pulled from the Fresha profile; needs last name and a couple of sentences.",
    photoUrl: "/images/reiley.png",
  },
];

export const FALLBACK_HOURS: HoursRow[] = [
  { day: "Sunday", display: "closed", closed: true },
  { day: "Monday", display: "closed", closed: true },
  { day: "Tuesday", display: "9:00a – 8:00p", closed: false },
  { day: "Wednesday", display: "9:00a – 8:00p", closed: false },
  { day: "Thursday", display: "9:00a – 8:00p", closed: false },
  { day: "Friday", display: "9:00a – 8:00p", closed: false },
  { day: "Saturday", display: "9:00a – 8:00p", closed: false },
];

/** Open days (0=Sun..6=Sat) and window used for demo slots pre-Supabase. */
export const FALLBACK_OPEN_DAYS = new Set([2, 3, 4, 5, 6]);
export const FALLBACK_OPEN_WINDOW = { start: 9 * 60, end: 20 * 60 };
