/**
 * Navbar – Top navigation bar spanning the full viewport width.
 *
 * Left side:  NebulaLearn logo (stacked-layers SVG icon in a blue
 *             rounded square) followed by the brand name in white.
 * Right side: Student name, major/year label, and a circular avatar
 *             with the student's initials.
 *
 * The bar uses a solid blue (#1d4ed8) background matching the
 * Figma design's top strip.
 */

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between bg-blue-700 px-8 py-3.5">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-900/40">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            className="text-white"
          >
            <path
              d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <span className="text-lg font-bold text-white">NebulaLearn</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right leading-tight">
          <p className="text-sm font-semibold text-white">Temoc Student</p>
          <p className="text-xs text-blue-200">Computer Science Senior</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white/20 ring-2 ring-white/30">
          <span className="text-sm font-bold text-white">TS</span>
        </div>
      </div>
    </nav>
  );
}
