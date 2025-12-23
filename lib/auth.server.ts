// app/_lib/auth.server.ts
import { createClient } from "@/lib/supabase/server";

export async function getAuthenticatedUserWithProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase.rpc("get_user_auth_data", {
    user_id_param: user.id,
  });

  const profile = data?.[0];
  if (!profile) return null;

  return {
    id: user.id,
    profile: {
      id: profile.profile_id,
      fullName: profile.full_name,
      roles: profile.roles ?? [],
      agency: profile.agency_name
        ? {
            name: profile.agency_name,
            city: profile.agency_city,
            region: profile.agency_region,
          }
        : null,
    },
  };
}
