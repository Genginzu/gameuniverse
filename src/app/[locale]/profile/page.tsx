import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";

interface ProfilePageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { locale } = await params;
  const supabase = await createServerClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    // Redirect to login if not authenticated
    redirect(`/${locale}/auth/login`);
  }
  
  // Redirect to the user's player profile
  redirect(`/${locale}/players/${user.id}`);
}
