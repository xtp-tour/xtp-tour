import { useState, useEffect, useCallback } from 'react';
import { useAPI } from '../services/apiProvider';

const PROFILE_COMPLETE_KEY = 'xtp_profile_complete';

interface ProfileStatus {
  isComplete: boolean;
  isLoading: boolean;
  isValidating: boolean;
  revalidate: () => Promise<void>;
  clearCache: () => void;
}

/**
 * Hook for managing profile completion status with optimistic rendering.
 *
 * On first load for new users: shows loading state while checking profile.
 * On subsequent loads for returning users: assumes profile is complete (from cache),
 * validates in background, and only shows setup if profile is actually incomplete.
 */
export function useProfileStatus(): ProfileStatus {
  const api = useAPI();

  // Check cache for optimistic initial state
  const cachedComplete = localStorage.getItem(PROFILE_COMPLETE_KEY) === 'true';

  // If cached as complete, start optimistically as complete (no loading modal)
  // If not cached, start as loading (first-time user needs to see loading)
  const [isComplete, setIsComplete] = useState(cachedComplete);
  const [isLoading, setIsLoading] = useState(!cachedComplete);
  const [isValidating, setIsValidating] = useState(false);

  const validateProfile = useCallback(async (isBackground: boolean) => {
    if (isBackground) {
      setIsValidating(true);
    } else {
      setIsLoading(true);
    }

    try {
      const response = await api.getUserProfile();
      if (response.profile) {
        const profile = response.profile;
        const profileIsComplete = !!(
          profile.firstName &&
          profile.lastName &&
          profile.ntrpLevel &&
          profile.city
        );

        setIsComplete(profileIsComplete);

        // Update cache
        if (profileIsComplete) {
          localStorage.setItem(PROFILE_COMPLETE_KEY, 'true');
        } else {
          localStorage.removeItem(PROFILE_COMPLETE_KEY);
        }
      } else {
        // No profile exists
        setIsComplete(false);
        localStorage.removeItem(PROFILE_COMPLETE_KEY);
      }
    } catch (error) {
      // On error, if we had cached complete, keep showing content
      // Otherwise, show profile setup
      if (!cachedComplete) {
        setIsComplete(false);
      }
      console.error('Error validating profile:', error);
    } finally {
      setIsLoading(false);
      setIsValidating(false);
    }
  }, [api, cachedComplete]);

  const revalidate = useCallback(async () => {
    await validateProfile(true);
  }, [validateProfile]);

  const clearCache = useCallback(() => {
    localStorage.removeItem(PROFILE_COMPLETE_KEY);
    setIsComplete(false);
  }, []);

  useEffect(() => {
    // If cached as complete, validate in background (no loading modal)
    // If not cached, validate with loading state
    validateProfile(cachedComplete);
  }, [validateProfile, cachedComplete]);

  return {
    isComplete,
    isLoading,
    isValidating,
    revalidate,
    clearCache,
  };
}

/**
 * Mark profile as complete and update cache.
 * Call this after successful profile creation/update.
 */
export function markProfileComplete(): void {
  localStorage.setItem(PROFILE_COMPLETE_KEY, 'true');
}

/**
 * Clear the profile completion cache.
 * Call this on logout.
 */
export function clearProfileCache(): void {
  localStorage.removeItem(PROFILE_COMPLETE_KEY);
}
