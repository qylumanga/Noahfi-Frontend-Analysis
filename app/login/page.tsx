import { AuthShell } from "@/components/AuthShell";

export default function LoginPage() {
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to follow your case."
      submit="Log in"
      altHref="/signup"
      altText="New here? Create an account"
    />
  );
}
