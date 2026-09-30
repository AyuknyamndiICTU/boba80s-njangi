import { AppShell } from "@/components/app-shell";
import { LedgerProvider } from "@/components/ledger-provider";
import { getLedger, getSelectedYear, listYears } from "@/lib/data";
import { requireUser } from "@/lib/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const year = await getSelectedYear();
  const [ledger, years] = await Promise.all([getLedger(year), listYears()]);

  return (
    <LedgerProvider data={ledger} years={years}>
      <AppShell userName={user.name}>{children}</AppShell>
    </LedgerProvider>
  );
}
