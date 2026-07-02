import AuthLayout from "../../src/components/auth/AuthLayout";
import LoginForm from "../../src/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Login to continue your music journey."
    >
      <LoginForm />
    </AuthLayout>
  );
}