'use client'

import { useState, useEffect } from 'react';
import { UserData } from '../types/user';

export const useUser = () => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/user'); 
        if (!response.ok) {
          // Si la réponse n'est pas OK (ex: 401 Unauthorized), traiter comme non connecté
          setUserData(null); 
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        if (data?.user && data.userProfile) {
          // Typage correct ici
          setUserData(data as UserData); 
        } else {
           // Si les données ne sont pas valides (ex: user existe mais pas de profil/rôles)
           setUserData(null); 
        }
      } catch (error) {
        console.error("Erreur dans useUser hook:", error);
        setUserData(null); // En cas d'erreur, considérer comme non connecté
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []); 

  return { user: userData?.user, userProfile: userData?.userProfile, loading };
};