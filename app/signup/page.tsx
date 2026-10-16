import { AuthShell } from "@/components/AuthShell";

export default function SignupPage() {
  return (
    <AuthShell
      title="Start your assessment"
      subtitle="Create your account and verify your email."
      submit="Create account"
      withName
      altHref="/login"
      altText="Already have an account? Log in"
    />
  );
}
