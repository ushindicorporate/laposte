// actions/users.ts
'use server'

import { createClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"
import { logAuditEvent } from "@/lib/logger"
import { UserFormData, userSchema } from "@/lib/validations/users"

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// --- READ ---
export async function getUsers() {
  const supabase = await createClient()
  
  // On récupère le profil, l'agence liée, et les rôles
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      *,
      agency:agencies (id, name, code),
      user_roles (
        role:roles (code, name)
      )
    `)
    .order('full_name')

  if (error) throw new Error(error.message)
  return data
}

// --- UPDATE (Assignation Agence & Rôle) ---
export async function updateUser(userId: string, formData: UserFormData) {
  const supabase = await createClient()
  
  // 1. Validation
  const validation = userSchema.safeParse(formData)
  if (!validation.success) return { success: false, error: validation.error.format() }

  const { data: { user: currentUser } } = await supabase.auth.getUser()
  if (!currentUser) return { success: false, error: "Non authentifié" }

  // 2. Update Profile (Agence + Nom + Statut)
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      full_name: validation.data.full_name,
      agency_id: validation.data.agency_id || null, // Null si vide
      is_active: validation.data.is_active,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)

  if (profileError) return { success: false, error: profileError.message }

  // 3. Update Role (On remplace les rôles existants pour simplifier l'UI)
  // A. Trouver l'ID du rôle sélectionné
  const { data: roleData } = await supabase
    .from('roles')
    .select('id')
    .eq('code', validation.data.role)
    .single()
  
  if (roleData) {
    // B. Supprimer les anciens rôles
    await supabase.from('user_roles').delete().eq('user_id', userId)
    
    // C. Ajouter le nouveau rôle
    await supabase.from('user_roles').insert({
      user_id: userId,
      role_id: roleData.id,
      assigned_by: currentUser.id
    })
  }

  // 4. Audit
  await logAuditEvent({
    userId: currentUser.id,
    eventType: 'CHANGE_USER_ROLE',
    details: { 
      target_user: userId, 
      new_role: validation.data.role, 
      new_agency: validation.data.agency_id 
    },
    targetTable: 'profiles',
    targetId: userId
  })
  
  revalidatePath('/dashboard/users')
  return { success: true }
}

// --- HELPER AGENCES ---
export async function getAgenciesForSelect() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('agencies')
    .select('id, name, code')
    .eq('is_active', true)
    .order('name')
  
  return (data || []).map((a: any) => ({
    id: a.id,
    name: `${a.name} (${a.code})`
  }))
}

// --- CREATE USER (Nouveau) ---
export async function createUser(formData: UserFormData) {
  const supabase = await createClient()
  
  // 1. Validation
  const validation = userSchema.safeParse(formData)
  if (!validation.success) return { success: false, error: validation.error.format() }
  const data = validation.data

  // 2. Vérification Permissions (Celui qui demande)
  const { data: { user: requester } } = await supabase.auth.getUser()
  if (!requester) return { success: false, error: "Non authentifié" }

  // 3. Création Compte Auth (Via Admin Client)
  if (!data.password) return { success: false, error: "Mot de passe requis pour la création" }

  const { data: newUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true, // On valide direct l'email
    user_metadata: { full_name: data.full_name }
  })
  
  if (authError) return { success: false, error: "Erreur Auth: " + authError.message }
  if (!newUser.user) return { success: false, error: "Erreur création utilisateur" }

  const userId = newUser.user.id

  // 4. Mise à jour du Profil (Créé automatiquement par Trigger habituellement, mais on force l'update)
  // On attend un peu que le trigger se déclenche ou on upsert
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .upsert({
      id: userId,
      full_name: data.full_name,
      agency_id: data.agency_id || null,
      email: data.email,
      is_active: data.is_active
    })

  if (profileError) return { success: false, error: "Erreur Profil: " + profileError.message }

  // 5. Attribution Rôle
  // A. Trouver l'ID du rôle
  const { data: roleData } = await supabase
    .from('roles')
    .select('id')
    .eq('code', data.role)
    .single()
  
  if (roleData) {
    await supabaseAdmin.from('user_roles').insert({
      user_id: userId,
      role_id: roleData.id,
      assigned_by: requester.id
    })
  }

  // 6. Audit
  await logAuditEvent({
    userId: requester.id,
    eventType: 'CREATE_USER', // Ajoute ce type si manquant dans logger.ts
    details: { email: data.email, role: data.role },
    targetTable: 'users',
    targetId: userId
  })

  revalidatePath('/dashboard/users')
  return { success: true }
}