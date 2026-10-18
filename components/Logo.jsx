'use client';

/**
 * The WiScribbles logo.
 *
 * THE BUG THE BRIEF REPORTS AS "LOGO VISIBILITY", AND WHY THERE WERE FOUR
 *
 * The previous version built a `<style>` element in a `useEffect`, appended it
 * to `document.head`, and removed it on cleanup. Four things were wrong with
 * that, and they compounded:
 *
 *   1. THE EFFECT RE-RAN ON EVERY RENDER. Its dependency was `[sizeConfig]`,
 *      and `sizeConfig` came from a `sizes` object literal rebuilt inside the
 *      component body each render — so the dependency was a new object identity
 *      every time. The effect therefore tore down and re-ran constantly:
 *      remove the stylesheet from head, build a new one, append it. Every
 *      render, with a window in between where the rules did not exist.
 *
 *   2. EVERY INSTANCE WROTE THE SAME SELECTOR. The injected rules targeted
 *      `.logo-image`, which every logo on the page carries. Two logos at
 *      different sizes each wrote `.logo-image { height: X !important }`, so
 *      whichever mounted last set the height for both.
 *
 *   3. UNMOUNTING ONE REMOVED THE RULES FOR ALL. Because the selector was
 *      shared, the first logo to unmount took the `!important` height rules
 *      with it. The remaining logo then fell back to its inline height — fine
 *      on a desktop, but on a narrow screen the mobile override was gone, so
 *      the logo rendered at full desktop height inside a mobile header and was
 *      clipped or pushed out of view. That is the reported symptom.
 *
 *   4. `responsiveStyle` was dead code: an object with an `@media` key, passed
 *      nowhere. Inline styles cannot hold media queries, which is what sent
 *      the original author to the injected-stylesheet workaround in the first
 *      place.
 *
 * THE FIX IS TO STOP INJECTING ANYTHING. Media queries belong in a stylesheet,
 * so the rules now live in `app/globals.css` keyed on a `data-logo-size`
 * attribute. Each logo gets its own size from its own attribute, nothing is
 * written to `document.head`, nothing is removed on unmount, and two logos at
 * different sizes coexist. No `!important` is needed because nothing is
 * fighting an inline height any more.
 */

import Image from 'next/image';
import Link from 'next/link';

const SOURCES = {
  dark: '/assets/images/logos/logo.png',
  light: '/assets/images/logos/logo-white.png',
  'dark-2': '/assets/images/logos/logo.png',
  'light-2': '/assets/images/logos/logo-white.png',
  sm: '/assets/images/logos/logo-white.png',
  'sm-light': '/assets/images/logos/logo-white.png',
};

/**
 * Sizes are a name, not a pixel value.
 *
 * The component passes the NAME to CSS and lets the stylesheet decide the
 * height at each breakpoint. That is what makes the responsive rules static
 * and shareable instead of per-instance and injected.
 */
const SIZES = ['small', 'default', 'large'];

/**
 * Intrinsic dimensions for `next/image`.
 *
 * Required, and worth getting roughly right rather than guessing: a wrong
 * aspect ratio makes the browser reserve the wrong space and the page shifts
 * as the image loads. The rendered height comes from CSS; these only set the
 * ratio used to reserve space.
 */
const INTRINSIC = { width: 420, height: 120 };

export default function Logo({
  variant = 'dark',
  size = 'default',
  linkTo = '/',
  className = '',
  style = {},
  priority = false,
}) {
  const source = SOURCES[variant] ?? SOURCES.dark;
  const sizeName = SIZES.includes(size) ? size : 'default';

  const image = (
    <Image
      src={source}
      /* The brand is "WiScribbles", plural. The old alt text said
         "WiScribble Logo" and the title attribute described the product as a
         "Document Management System" — which showed as a tooltip on every page
         of a notarisation platform. */
      alt="WiScribbles"
      width={INTRINSIC.width}
      height={INTRINSIC.height}
      className={`logo-image ${className}`.trim()}
      data-logo-size={sizeName}
      /* The logo is above the fold on every page, so it is worth loading
         eagerly — but only when the caller says so, since a logo in a footer
         is not. */
      priority={priority}
      style={style}
    />
  );

  if (!linkTo) return image;

  return (
    <Link href={linkTo} className="logo-link d-inline-block">
      {image}
    </Link>
  );
}
