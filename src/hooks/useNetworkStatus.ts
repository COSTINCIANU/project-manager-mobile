// =====================================================
// useNetworkStatus — Hook de detection reseau
// Surveille la connexion internet en temps reel
// Affiche une banniere quand l'app est hors ligne
// =====================================================

import { useState, useEffect } from "react";
import * as Network from "expo-network";

interface NetworkStatus {
  isOnline: boolean;
  isLoading: boolean;
}

export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verifie l'etat du reseau au demarrage
    checkNetwork();

    // Verifie toutes les 10 secondes
    const interval = setInterval(checkNetwork, 10000);

    // Nettoyage a la destruction du composant
    return () => clearInterval(interval);
  }, []);

  const checkNetwork = async () => {
    try {
      const state = await Network.getNetworkStateAsync();
      setIsOnline(state.isConnected ?? false);
    } catch {
      setIsOnline(false);
    } finally {
      setIsLoading(false);
    }
  };

  return { isOnline, isLoading };
}
