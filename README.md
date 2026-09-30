# BOBA 80s Njangi

Web app for the **Cameroon Protestant College Bali, BOBA 80S** Njangi contribution register.
It works on phones, tablets and computers.

## Features

- **Sign up / log in.** Everyone shares one BOBA 80s ledger. You need an access code to create an account.
- **Months** (home page). There is one animated card per month. Tap a card to enter each member's contribution and withdrawal.
- **Annual.** The yearly register, laid out like `BOBA 80s.pdf`: S/N, name, Jan–Dec, Total, Withdraw, Balance.
  - Totals and balances are calculated automatically. A positive balance shows **+green** and a negative one shows **-red**.
  - Tap a member to edit all 12 months for that member.
- **Alerts.** Lists every member with no contribution for a month that has already ended. You can view it by month or by member. There is a one-tap "Share on WhatsApp" button.
- **Analysis.** Key figures, charts (monthly contributions vs withdrawals, running balance, per-member totals, share of contributions), how regularly each member pays, and a summary per member.
- **Members.** Add, rename, reorder or remove members for each year.
- **Years.** A year selector in the header. A new year copies the member list from the previous year.
- **Exports.** Excel (.xlsx, with live formulas) and PDF for the annual register, the monthly report, missing contributions and the analysis summary.
- **English / French** switch. The app can also be installed on a phone (add to home screen).

## Run locally

```bash
npm install
cp .env.example .env.local   # then set AUTH_SECRET and SIGNUP_ACCESS_CODE
npm run dev
```

If `DATABASE_URL` is empty, the app uses an embedded Postgres database stored in `./.pglite`. It sets up the tables automatically and pre-loads the 12 members from the PDF.

## Deploy for free (Vercel + Neon)

1. **Database.** Create a free project at [neon.tech](https://neon.tech) and copy the connection string (`postgresql://...`).
2. **Code.** Push this folder to a GitHub repository.
3. **Vercel.** Go to [vercel.com](https://vercel.com), choose *Add New > Project*, and import the repository. Add these environment variables:
   | Name | Value |
   | --- | --- |
   | `DATABASE_URL` | Neon connection string |
   | `AUTH_SECRET` | Long random string (32+ characters) |
   | `SIGNUP_ACCESS_CODE` | Code you give to the people allowed to create accounts |
4. Click **Deploy**. The build runs `scripts/migrate.ts`, which creates the tables and the 12 starting members, then builds the app.

To stop new sign-ups, change or remove `SIGNUP_ACCESS_CODE` in Vercel and redeploy.

## Tech

Next.js 16 (App Router, Server Actions), React 19, Tailwind CSS 4, Motion, Recharts, Drizzle ORM, Postgres (Neon / PGlite), ExcelJS, jsPDF.

- Database schema: `src/db/schema.ts`
- Migrations: `drizzle/` (run `npm run db:generate` after schema changes)
