/**
 * KYC provider selection.
 *
 * `KYC_PROVIDER` in the environment picks the active one. Didit by default.
 * Persona is deliberately not implemented — see KYC_NOTES in ./provider. When
 * it is needed, it is a new file here and nothing above changes.
 */

import {
  KYC_ERROR,
  KYC_NOTES,
  KYC_STATUS,
  KycError,
  RESTARTABLE_KYC_STATUSES,
} from './provider';
import { DiditProvider } from './didit';

export { KYC_STATUS, KYC_ERROR, KYC_NOTES, KycError, RESTARTABLE_KYC_STATUSES };

let diditInstance = null;

export function getKycProvider() {
  const choice = (process.env.KYC_PROVIDER ?? 'didit').toLowerCase();

  if (choice === 'persona') {
    throw new KycError(
      KYC_ERROR.NOT_CONFIGURED,
      'KYC_PROVIDER is set to "persona", which is not implemented. Persona was ' +
        'evaluated and set aside on cost (US$250/month minimum on a 12-month ' +
        'contract). To adopt it, add lib/kyc/persona.js against the Hosted ' +
        'Flow and register it here.',
    );
  }

  if (choice !== 'didit') {
    throw new KycError(
      KYC_ERROR.NOT_CONFIGURED,
      `Unknown KYC_PROVIDER "${choice}". Supported: didit.`,
    );
  }

  return (diditInstance ??= new DiditProvider());
}

/** For the admin dashboard: what is actually wired up. */
export function kycStatus() {
  const provider = getKycProvider();
  return {
    id: provider.id,
    configured: provider.isConfigured(),
    notes: KYC_NOTES[provider.id] ?? [],
  };
}

/**
 * Human-readable status, for the onboarding tracker.
 * Deliberately avoids implying that a pass discharges the notary's own
 * statutory duty to confirm identity.
 */
export const KYC_STATUS_LABELS = Object.freeze({
  [KYC_STATUS.NOT_STARTED]: 'Not started',
  [KYC_STATUS.PENDING]: 'In progress',
  [KYC_STATUS.IN_REVIEW]: 'Under review',
  [KYC_STATUS.APPROVED]: 'Verified',
  [KYC_STATUS.DECLINED]: 'Could not be verified',
  [KYC_STATUS.EXPIRED]: 'Expired — start again',
});
