import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  SUPPORTED_LOCATIONS,
  DEFAULT_LOCATION,
  type SupportedLocation,
  findLocationByName,
  detectUserLocation,
} from '../config/locations';

interface LocationState {
  activeLocation: SupportedLocation;
  radiusKm: number;
  isExplicitlySet: boolean;
  setLocation: (loc: SupportedLocation | string) => void;
  setRadius: (radius: number) => void;
  syncWithUser: (userAddress?: string | null, lat?: number, lng?: number) => void;
  resetToUserDefault: (userAddress?: string | null, lat?: number, lng?: number) => void;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set, get) => ({
      activeLocation: DEFAULT_LOCATION,
      radiusKm: DEFAULT_LOCATION.defaultRadiusKm,
      isExplicitlySet: false,

      setLocation: (loc) => {
        const resolved = typeof loc === 'string' ? findLocationByName(loc) : loc;
        if (resolved) {
          set({
            activeLocation: resolved,
            radiusKm: resolved.defaultRadiusKm,
            isExplicitlySet: true,
          });
        }
      },

      setRadius: (radiusKm) => set({ radiusKm }),

      syncWithUser: (userAddress, lat, lng) => {
        if (!get().isExplicitlySet) {
          const detected = detectUserLocation(userAddress, lat, lng);
          set({
            activeLocation: detected,
            radiusKm: detected.defaultRadiusKm,
          });
        }
      },

      resetToUserDefault: (userAddress, lat, lng) => {
        const detected = detectUserLocation(userAddress, lat, lng);
        set({
          activeLocation: detected,
          radiusKm: detected.defaultRadiusKm,
          isExplicitlySet: false,
        });
      },
    }),
    {
      name: 'stockbridge_location',
    }
  )
);
