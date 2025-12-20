// src/types/user.ts

// Représente les données de base de Supabase Auth User
export interface SupabaseAuthUser {
  id: string;
  email?: string;
  // Ajoutez d'autres propriétés si nécessaire (ex: created_at)
}

export interface City {
    id: string;
    name: string | null;
}
// Structure de l'agence enrichie par la RPC
export interface AgencyInfo {
  id: string | null; // Peut être null si non assigné
  name: string | null;
  city: City | null;
  region: string | null;
}

// Profil utilisateur enrichi avec agence et rôles
export interface UserProfile {
  id: string;
  full_name: string | null;
  agency: AgencyInfo | null;
  roles: string[]; // Tableau de noms de rôles (ex: ['AGENT', 'FINANCE'])
}

// Structure globale des données utilisateur pour le contexte (client/serveur)
export interface UserData {
  user: SupabaseAuthUser; // L'objet utilisateur de Supabase Auth
  userProfile: UserProfile | null; // Notre profil enrichi
}

// Type pour les données reçues par les composants clients
export interface UserDataForClient {
    user: SupabaseAuthUser | null;
    userProfile: UserProfile | null;
}

// Types pour les données des listes (agences, rôles)
export interface AgencyOption {
  id: string;
  name: string | null;
  city: City | null;
}

export interface RoleOption {
  id: number;
  name: string;
}

// Type pour les données d'un utilisateur dans le tableau
export interface UserRowData {
  id: string;
  full_name: string | null;
  email: string | null;
  agency_id: string | null;
  agencies: AgencyInfo | null; // Correspond à AgencyInfo mais peut être null
  user_roles: { role_id: number; roles: { id: number; name: string } | null }[] | null;
  is_active: boolean;
}