/**
 * Service Store - Global Service Context
 * Manages the currently selected utility service
 */

import { create } from 'zustand';

// =============================================================================
// TYPES
// =============================================================================

export type ServiceType = 'electricity' | 'water' | 'gas' | 'municipal' | null;

interface ServiceState {
    // State
    activeService: ServiceType;

    // Actions
    setActiveService: (service: ServiceType) => void;
    toggleService: (service: Exclude<ServiceType, null>) => void;
    clearActiveService: () => void;
}

// =============================================================================
// STORE
// =============================================================================

export const useServiceStore = create<ServiceState>((set, get) => ({
    // Initial state
    activeService: null,

    // Actions
    setActiveService: (service) => {
        set({ activeService: service });
    },

    toggleService: (service) => {
        const current = get().activeService;
        set({ activeService: current === service ? null : service });
    },

    clearActiveService: () => {
        set({ activeService: null });
    },
}));

// =============================================================================
// SELECTORS
// =============================================================================

export const selectActiveService = (state: ServiceState) => state.activeService;
