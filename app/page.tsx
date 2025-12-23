// app/page.tsx
import { redirect } from "next/navigation";
import { getAuthenticatedUserWithProfile } from "@/lib/auth.server";
import HomeCard from "@/components/marketing/HomeCard";

export default async function HomePage() {
  const user = await getAuthenticatedUserWithProfile();

  if (user) {
    redirect("/dashboard");
  }

  return <HomeCard />;
}
