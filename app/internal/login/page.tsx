import { AuthShell } from "@/components/AuthShell";

export default function InternalLoginPage() {
  return (
    <AuthShell
      title="Internal portal"
      subtitle="For NOAHFI analysts and staff."
      submit="Log in"
      altHref="/"
      altText="Back to NOAHFI"
    />
  );
}
