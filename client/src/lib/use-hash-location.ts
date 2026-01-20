import { useState, useEffect, useCallback } from "react";

// returns the current hash location (without the #)
const currentLocation = () => window.location.hash.replace(/^#/, "") || "/";

export const useHashLocation = () => {
  const [loc, setLoc] = useState(currentLocation());

  useEffect(() => {
    const handler = () => setLoc(currentLocation());

    // subscribe to hash changes
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);

  const navigate = useCallback((to: string) => {
    window.location.hash = to;
  }, []);

  return [loc, navigate] as const;
};
