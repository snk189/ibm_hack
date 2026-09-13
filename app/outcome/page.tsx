import OutcomeCard from "@/components/OutcomeCard";
import { t } from "@/lib/i18n";

// Outcome card screen (route: /outcome)
// Reference number, result, playbook name, duration.
// Full transcript hidden behind "View full conversation" (collapsed by default).
export default function OutcomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50/50">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t("outcome.title")}</h1>
      <OutcomeCard />
    </main>
  );
}
