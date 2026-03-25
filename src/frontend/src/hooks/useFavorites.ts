import { useCallback, useEffect, useState } from "react";

export interface FavoriteModule {
  id: string;
  name: string;
  icon: string;
}

function getFavKey(companyId: string, userId: string) {
  return `favorites_${companyId}_${userId}`;
}

export function useFavorites(companyId?: string, userId?: string) {
  const key = companyId && userId ? getFavKey(companyId, userId) : null;

  const [favorites, setFavorites] = useState<FavoriteModule[]>(() => {
    if (!key) return [];
    try {
      const saved = localStorage.getItem(key);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  // Re-read when key changes (company/user switch)
  useEffect(() => {
    if (!key) {
      setFavorites([]);
      return;
    }
    try {
      const saved = localStorage.getItem(key);
      if (saved) setFavorites(JSON.parse(saved));
      else setFavorites([]);
    } catch {
      setFavorites([]);
    }
  }, [key]);

  const persist = useCallback(
    (next: FavoriteModule[]) => {
      if (!key) return;
      localStorage.setItem(key, JSON.stringify(next));
    },
    [key],
  );

  const isFavorite = useCallback(
    (id: string) => favorites.some((f) => f.id === id),
    [favorites],
  );

  const toggleFavorite = useCallback(
    (id: string, name: string, icon: string) => {
      setFavorites((prev) => {
        const exists = prev.some((f) => f.id === id);
        const next = exists
          ? prev.filter((f) => f.id !== id)
          : [...prev, { id, name, icon }];
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const getFavorites = useCallback(() => favorites, [favorites]);

  return { favorites, isFavorite, toggleFavorite, getFavorites };
}
