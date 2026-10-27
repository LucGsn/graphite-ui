import type { Metadata } from "next";
import { OnboardingDemo } from "../../components/onboarding-demo";

export const metadata: Metadata = { title: "Onboarding — graphite-ui" };

export default function Page() {
  return <OnboardingDemo />;
}
