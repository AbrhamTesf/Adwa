import { useState, useEffect } from "react";

/**
 * Custom hook to batch fetch exhibit metadata for visitedExhibitIds.
 * Avoids N+1 layout shift and handles loading/error boundaries.
 */
export function useVisitedExhibits(visitedExhibitIds = []) {
  const [exhibits, setExhibits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!visitedExhibitIds || visitedExhibitIds.length === 0) {
      setExhibits([]);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    Promise.all(
      visitedExhibitIds.map(async (id) => {
        try {
          const res = await fetch(`/exhibits/${id}.json`);
          if (!res.ok) throw new Error(`HTTP error ${res.status}`);
          const data = await res.json();
          return data;
        } catch {
          // Fallback if individual exhibit JSON is missing or offline
          return {
            exhibit_id: id,
            name: id.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
            category: "heritage",
            persona_scripts: {
              usage: "Historical artifact preserved in the Adwa Victory Memorial Museum collection."
            }
          };
        }
      })
    )
      .then((data) => {
        if (isMounted) {
          setExhibits(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [JSON.stringify(visitedExhibitIds)]);

  return { exhibits, loading, error };
}
