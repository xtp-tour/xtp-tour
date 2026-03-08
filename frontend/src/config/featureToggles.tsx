import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface FeatureToggles {
  addPlace: boolean;
}

const defaultToggles: FeatureToggles = {
  addPlace: false,
};

const FeatureTogglesContext = createContext<FeatureToggles>(defaultToggles);

export function FeatureTogglesProvider({ children }: { children: ReactNode }) {
  const [features, setFeatures] = useState<FeatureToggles>(defaultToggles);

  useEffect(() => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
    fetch(`${baseUrl}/api/config`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (data?.features) {
          setFeatures(data.features);
        }
      })
      .catch(err => {
        console.warn('Failed to fetch feature toggles, using defaults', err);
      });
  }, []);

  return (
    <FeatureTogglesContext.Provider value={features}>
      {children}
    </FeatureTogglesContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useFeatureToggles(): FeatureToggles {
  return useContext(FeatureTogglesContext);
}
