// Areas for the Goa pilot. posts.area must use exactly these strings so the
// feed can put "your area" first.
export const AREAS = ['North Goa', 'South Goa', 'Elsewhere'] as const;
export type Area = (typeof AREAS)[number];
