export type DemoLogin = { name: string; email: string; password: string; role: string };

export const CUSTOMER_DEMOS: DemoLogin[] = [
  { name: "Priya Raman", email: "priya.raman@example.com", password: "demo1234", role: "Customer" },
];

export const PARTNER_DEMOS: DemoLogin[] = [
  { name: "Daniel Whitfield", email: "daniel.whitfield@mapleharbour.example", password: "demo1234", role: "Partner · Maple Harbour Bank" },
];

export const INTERNAL_DEMOS: DemoLogin[] = [
  { name: "Mei Tanaka", email: "mei.tanaka@noahfi.example", password: "demo1234", role: "Analyst" },
  { name: "Samuel Adeyemi", email: "samuel.adeyemi@noahfi.example", password: "demo1234", role: "Analyst" },
  { name: "Isabelle Fontaine", email: "isabelle.fontaine@noahfi.example", password: "demo1234", role: "Reviewer" },
  { name: "Rohan Das", email: "rohan.das@noahfi.example", password: "demo1234", role: "Admin" },
  { name: "Grace Mwale", email: "grace.mwale@noahfi.example", password: "demo1234", role: "Compliance" },
];

export const ALL_DEMOS = [...CUSTOMER_DEMOS, ...PARTNER_DEMOS, ...INTERNAL_DEMOS];
