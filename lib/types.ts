export type ServiceGroup = {
  title: string;
  items: { name: string; price: string }[];
};

export type StylistCard = {
  id: string;
  name: string;
  role: string;
  bio: string;
  photoUrl: string | null;
};

export type HoursRow = {
  day: string;
  display: string;
  closed: boolean;
};

export type BookableService = {
  id: string;
  name: string;
  category: string;
  description: string | null;
  /** Dollars; null = priced at consultation, 0 = free. */
  price: number | null;
  /** Exact display string, e.g. "$80+", "consult", "free". */
  priceDisplay: string;
  /** Dollars; null = no deposit configured (charge full price). */
  depositAmount: number | null;
  durationMinutes: number;
  fullPrepayment: boolean;
};

export type Slot = {
  /** 24h "HH:MM" */
  value: string;
  /** Reference-style label, e.g. "9:00a" */
  label: string;
};
