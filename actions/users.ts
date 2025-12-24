// actions/users.ts
'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { logAuditEvent } from "@/lib/logger"
import { UserFormData, userSchema } from "@/lib/validations/users"

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