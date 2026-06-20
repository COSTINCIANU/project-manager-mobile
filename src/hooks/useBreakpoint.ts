// =====================================================
// useBreakpoint — Detecte la taille de l'ecran
// Retourne true si l'ecran est large (tablette/desktop)
// Seuil : 768px (taille iPad Mini)
// =====================================================

import { useState, useEffect } from "react";
import { Dimensions } from "react-native";

export function useBreakpoint() {
  const [width, setWidth] = useState(Dimensions.get("window").width);

  useEffect(() => {
    // Ecoute les changements de taille d'ecran
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setWidth(window.width);
    });
    return () => subscription.remove();
  }, []);

  return {
    width,
    // Tablette si largeur >= 768px
    isTablet: width >= 768,
    // Desktop si largeur >= 1024px
    isDesktop: width >= 1024,
  };
}
