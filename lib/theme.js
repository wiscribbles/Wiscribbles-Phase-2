/**
 * The existing WiScribbles palette, extracted — not invented.
 *
 * Every value here is already in use across the Phase 1 components; this file
 * only gives them names so that Phase 2 additions match the site instead of
 * drifting toward a second look. Changing a value here changes it everywhere,
 * which is the point. Do not add a colour that is not already on the site
 * without deciding that deliberately.
 *
 * Counts from the existing codebase at the time of extraction:
 *   #E2E8F0 ×158, #274171 ×156, #2D3748 ×108, #718096 ×81, #4A5568 ×41,
 *   #F7FAFC ×38
 */

export const COLORS = Object.freeze({
  /** Primary brand navy. Buttons, active states, links. */
  brand: '#274171',
  /** Deepest navy, used for primary button fills and headings. */
  brandDark: '#0C1134',
  /** Body text. */
  ink: '#2D3748',
  /** Secondary text. */
  inkMuted: '#718096',
  /** Tertiary text and captions. */
  inkSubtle: '#4A5568',
  /** Hairlines and card borders. */
  border: '#E2E8F0',
  /** Page and panel backgrounds. */
  surface: '#F7FAFC',
  white: '#ffffff',

  /* Status. Bootstrap's own values, since the theme already uses them. */
  success: '#1b7f4b',
  successBg: '#e8f6ee',
  danger: '#dc3545',
  dangerText: '#b3261e',
  dangerBg: '#fdecea',
  warning: '#d39106',
  warningText: '#8a5a00',
  warningBg: '#fff6e5',
  infoBg: '#eef2f9',
});

/** Headings use Jost, as the existing auth and marketing pages do. */
export const FONTS = Object.freeze({
  heading: 'Jost, sans-serif',
});

export const RADIUS = Object.freeze({
  sm: '6px',
  md: '8px',
  lg: '12px',
  pill: '999px',
});

/* ------------------------------------------------------------------------- */
/* Reusable inline-style objects                                              */
/*                                                                            */
/* The codebase styles with inline objects on react-bootstrap components      */
/* rather than CSS modules. These follow that convention rather than          */
/* introducing a second one.                                                  */
/* ------------------------------------------------------------------------- */

export const STYLES = Object.freeze({
  pageHeading: {
    fontFamily: FONTS.heading,
    fontSize: '1.8rem',
    color: COLORS.ink,
    marginBottom: '0.5rem',
  },

  sectionHeading: {
    fontSize: '1.05rem',
    color: COLORS.ink,
    marginBottom: '0.4rem',
  },

  lede: {
    color: COLORS.inkMuted,
    maxWidth: '64ch',
    lineHeight: 1.7,
  },

  card: {
    border: `1px solid ${COLORS.border}`,
    borderRadius: RADIUS.md,
    background: COLORS.white,
  },

  /** Primary action. */
  buttonPrimary: {
    background: COLORS.brandDark,
    borderColor: COLORS.brandDark,
    color: COLORS.white,
    padding: '0.55rem 1.4rem',
  },

  /** Affirmative action — approve, go live. */
  buttonPositive: {
    background: COLORS.success,
    borderColor: COLORS.success,
    color: COLORS.white,
    padding: '0.55rem 1.4rem',
  },

  tabActive: {
    borderRadius: 0,
    border: 'none',
    borderBottom: `2px solid ${COLORS.brand}`,
    color: COLORS.brand,
    fontWeight: 600,
    padding: '0.6rem 1rem',
  },

  tabInactive: {
    borderRadius: 0,
    border: 'none',
    borderBottom: '2px solid transparent',
    color: COLORS.inkMuted,
    fontWeight: 500,
    padding: '0.6rem 1rem',
  },
});

/** Status pill colouring, shared by the onboarding tracker and admin queue. */
export const STATUS_TONE = Object.freeze({
  neutral: { background: COLORS.surface, color: COLORS.inkSubtle },
  info: { background: COLORS.infoBg, color: COLORS.brand },
  success: { background: COLORS.successBg, color: COLORS.success },
  warning: { background: COLORS.warningBg, color: COLORS.warningText },
  danger: { background: COLORS.dangerBg, color: COLORS.dangerText },
});

export const pill = (tone = 'neutral') => ({
  ...STATUS_TONE[tone],
  borderRadius: RADIUS.pill,
  padding: '0.25rem 0.8rem',
  fontSize: '0.86rem',
  fontWeight: 600,
  display: 'inline-block',
});
