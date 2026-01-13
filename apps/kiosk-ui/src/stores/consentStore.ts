/**
 * Consent Store - DPDP Act Compliance
 * Tracks user consent for biometric/UIDAI data processing
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// =============================================================================
// TYPES
// =============================================================================

interface ConsentState {
    // State
    hasConsented: boolean;
    consentTimestamp: string | null;
    consentVersion: string;

    // Actions
    giveConsent: () => void;
    revokeConsent: () => void;
    checkConsentValidity: () => boolean;
}

// Current consent version - update when consent text changes
const CONSENT_VERSION = '1.0.0';

// Consent validity period (24 hours for kiosk sessions)
const CONSENT_VALIDITY_MS = 24 * 60 * 60 * 1000;

// =============================================================================
// STORE
// =============================================================================

export const useConsentStore = create<ConsentState>()(
    persist(
        (set, get) => ({
            // Initial state
            hasConsented: false,
            consentTimestamp: null,
            consentVersion: CONSENT_VERSION,

            // Actions
            giveConsent: () => {
                const timestamp = new Date().toISOString();
                set({
                    hasConsented: true,
                    consentTimestamp: timestamp,
                    consentVersion: CONSENT_VERSION,
                });

                // Log consent for audit trail (mock implementation)
                console.log('[DPDP Audit] Consent granted:', {
                    timestamp,
                    version: CONSENT_VERSION,
                    userAgent: navigator.userAgent,
                });
            },

            revokeConsent: () => {
                set({
                    hasConsented: false,
                    consentTimestamp: null,
                });

                // Log revocation for audit trail
                console.log('[DPDP Audit] Consent revoked:', {
                    timestamp: new Date().toISOString(),
                });
            },

            checkConsentValidity: () => {
                const state = get();

                // Check if consent version matches
                if (state.consentVersion !== CONSENT_VERSION) {
                    return false;
                }

                // Check if consent has expired
                if (state.consentTimestamp) {
                    const consentTime = new Date(state.consentTimestamp).getTime();
                    const now = Date.now();
                    if (now - consentTime > CONSENT_VALIDITY_MS) {
                        return false;
                    }
                }

                return state.hasConsented;
            },
        }),
        {
            name: 'suvidha-consent',
            storage: createJSONStorage(() => sessionStorage),
        }
    )
);

// =============================================================================
// SELECTORS
// =============================================================================

export const selectHasConsented = (state: ConsentState) => state.hasConsented;
export const selectConsentTimestamp = (state: ConsentState) => state.consentTimestamp;
