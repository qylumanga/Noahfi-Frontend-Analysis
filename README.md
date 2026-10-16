# NOAHFI

Frontend demo for a Canadian-equivalent credit assessment. Newcomers upload home-country documents. Analysts map them to a 300–900 profile. Partner banks see a report only when the customer consents.

There is no database and no third-party network call. Business rules run in mock Route Handlers. The browser keeps changes in `localStorage`.

## Run

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000.

```bash
pnpm build
pnpm tsc --noEmit
```

## Demo accounts

Password for every account: `demo1234`.

| Persona | Email |
| --- | --- |
| Customer (Priya Raman) | priya.raman@example.com |
| Partner (Daniel Whitfield, Maple Harbour Bank) | daniel.whitfield@mapleharbour.example |
| Analyst | mei.tanaka@noahfi.example |
| Analyst | samuel.adeyemi@noahfi.example |
| Reviewer | isabelle.fontaine@noahfi.example |
| Admin | rohan.das@noahfi.example |
| Compliance | grace.mwale@noahfi.example |

Each sign-in screen has a **Use demo account** panel. The floating **Demo controls** button can switch persona, reset data, advance a case, force the next API error, tamper a document, and open the email outbox.

## Payments and email

- Assessment price: **USD 100** plus local tax. The checkout country selector shows a mock FX conversion.
- Success card: `4242 4242 4242 4242`
- Decline card: `4000 0000 0000 0002`
- Email OTP: `123456` (also shown in the outbox at `/dev/outbox`)

## Routes

Public: `/`, `/verify`, `/login`, `/signup`, `/verify-email`, `/forgot-password`, `/design-system`, `/dev/outbox`.

Customer: `/dashboard`, `/requests/new`, `/requests/[caseId]/payment`, `/requests/[caseId]/confirmation`, `/cases/[caseId]`, `/cases/[caseId]/report`, `/cases/[caseId]/certificate`, `/notifications`.

Partner: `/partner/login`, `/partner`, `/partner/evidence`, `/partner/submissions`, `/partner/consents`, `/partner/integrations`, `/partner/audit`.

Internal: `/internal/login`, `/internal`, `/internal/cases/[caseId]`, `/internal/cases/[caseId]/rating`, `/internal/cases/[caseId]/qa`, `/internal/cases/[caseId]/feedback`, `/internal/admin`.

Mock handlers live under `app/api` and mirror a future REST API (`/api/auth/*`, `/api/cases/*`, `/api/payments/*`, `/api/partners/*`, `/api/internal/*`, `/api/provenance/*`). `GET /api/cases/[caseId]/workspace` is a read model that composes the case, documents, notes, and ledger for the workspace screens.

## Overlay pattern

Route Handlers are stateless. They read `lib/mock/*.json`, validate with zod, and return the new entity. `lib/services/*` write that entity into `localStorage` (`noahfi:v1:<collection>`). Reads merge seed and overlay by id. The overlay wins. See `lib/demo-db/README.md`.

UI code imports services only. It does not import `lib/mock` or `lib/demo-db`.

On a mutation, the service sends the current entity as `base` so the handler can apply the status rules without a server database.

## Swapping mock for real

| Today | Later |
| --- | --- |
| `lib/mock/*.json` + Route Handlers | Neon + Prisma |
| `localStorage` session | Neon Auth |
| `POST /api/uploads` metadata | Vercel Blob `put()` |
| `sendEmail()` outbox | Resend |
| `usePolling` | SWR |
| This Next.js app | Vercel |

Replace handler internals and `lib/demo-db`. Keep the service function names so pages stay put.

## Notes

- Signup collects a password so the later login step works. The product prompt listed identity fields and not a password.
- File bytes are not stored. The browser computes SHA-256 and the API records that fingerprint.
- “Tamper a document” changes the stored fingerprint. The public `/verify` page still matches the original file, because the ledger keeps the upload hash.
- Copy stays in English. The footer says more languages are coming.
