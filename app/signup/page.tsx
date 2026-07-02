import AuthLayout from "../../src/components/auth/AuthLayout";
import SignupForm from "../../src/components/auth/SignupForm";

export default function SignupPage() {
  return (
    <AuthLayout
      title="Create Account"
      subtitle="Start your music journey today."
    >
      <SignupForm />
    </AuthLayout>
  );
}