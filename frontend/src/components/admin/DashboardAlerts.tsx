import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

interface DashboardAlertsProps {
  verificationPending: number;
}

export function DashboardAlerts({ verificationPending }: DashboardAlertsProps) {
  if (verificationPending === 0) return null;

  return (
    <Alert className="rounded-2xl border-orange-200 bg-orange-50/90 py-4 shadow-sm dark:border-orange-900 dark:bg-orange-950/45">
      <AlertCircle className="size-5 text-orange-600 dark:text-orange-300" />
      <AlertTitle className="font-semibold text-orange-900 dark:text-orange-100">Your attention is needed</AlertTitle>
      <AlertDescription className="text-orange-800 dark:text-orange-200">
        {verificationPending} restaurant{verificationPending > 1 ? "s are" : " is"} pending
        verification.{" "}
        <Link href="/admin/verification" className="inline-flex items-center gap-1 font-semibold underline decoration-orange-400 underline-offset-4">
          Review now <ArrowRight className="size-3.5" />
        </Link>
      </AlertDescription>
    </Alert>
  );
}
