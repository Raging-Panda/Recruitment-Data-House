import { LoginCard } from "@/components/login-card";
import { FingerprintPattern } from "@/components/fingerprint-pattern";

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <FingerprintPattern />
      <div className="relative">
        <LoginCard />
      </div>
    </main>
  );
}
