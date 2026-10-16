import { AuthShell } from "@/components/AuthShell";

export default function PartnerLoginPage() {
  return (
    <AuthShell
      title="Partner portal"
      subtitle="For participating financial institutions."
      submit="Log in to portal"
      altHref="/"
      altText="Back to NOAHFI"
    />
  );
}
