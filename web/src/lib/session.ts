// Demo-only session state. Replace with calls to the Adawise backend later.
const KEYS = {
  onboarded: 'adawise.onboarded',
  msisdn: 'adawise.msisdn',
  signedIn: 'adawise.signedIn',
  /** Agreed to the Adawise terms (skips the Adawise welcome + terms next time) */
  adawiseTerms: 'adawise.termsAccepted',
} as const

function get(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function set(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    /* storage unavailable (private mode) — the demo still works, it just won't remember */
  }
}

export const session = {
  isOnboarded: () => get(KEYS.onboarded) === '1',
  markOnboarded: () => set(KEYS.onboarded, '1'),

  /** Full number with country code, e.g. 233241380745 */
  msisdn: () => get(KEYS.msisdn) ?? '',
  setMsisdn: (n: string) => set(KEYS.msisdn, n),

  hasAcceptedAdawiseTerms: () => get(KEYS.adawiseTerms) === '1',
  acceptAdawiseTerms: () => set(KEYS.adawiseTerms, '1'),

  isSignedIn: () => get(KEYS.signedIn) === '1',
  signIn: () => set(KEYS.signedIn, '1'),
  /** Logs out but remembers onboarding was seen, so the app reopens at Welcome */
  signOut: () => {
    set(KEYS.signedIn, null)
    set(KEYS.msisdn, null)
  },

  reset: () => Object.values(KEYS).forEach((k) => set(k, null)),
}

/** "233241380745" -> "******0745" (matches MoMo's masking) */
export function maskMsisdn(msisdn: string) {
  return '******' + msisdn.slice(-4)
}

/** Demo stand-in for a backend-issued OTP */
export function generateDemoCode() {
  return String(Math.floor(1000 + Math.random() * 9000))
}
