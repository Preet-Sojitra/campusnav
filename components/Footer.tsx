/**
 * Footer – Slim page footer matching the NebulaLearn Figma design.
 *
 * Left:  "© 2023 NebulaLearn for UTD Students" copyright notice.
 * Right: Support, Privacy, and Campus Status links.
 *
 * The footer sits at the very bottom of the page and spans the
 * full viewport width with a top border separator.
 */

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white px-8 py-5">
      <div className="mx-auto flex max-w-3xl items-center justify-between text-[13px] text-gray-400">
        <span>&copy; 2023 NebulaLearn for UTD Students</span>
        <div className="flex gap-5">
          <a href="#" className="transition-colors hover:text-gray-600">
            Support
          </a>
          <a href="#" className="transition-colors hover:text-gray-600">
            Privacy
          </a>
          <a href="#" className="transition-colors hover:text-gray-600">
            Campus Status
          </a>
        </div>
      </div>
    </footer>
  );
}
