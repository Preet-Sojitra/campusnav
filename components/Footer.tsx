/**
 * Footer – Slim page footer for NebulaLearn.
 *
 * Uses a subtle indigo bottom-border accent to tie back to the
 * navbar gradient. Links shift to indigo on hover for brand cohesion.
 */

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white px-8 py-5">
      <div className="mx-auto flex max-w-3xl items-center justify-between text-[13px] text-gray-400">
        <span>&copy; 2023 NebulaLearn for UTD Students</span>
        <div className="flex gap-5">
          <a href="#" className="transition-colors hover:text-nebula">
            Support
          </a>
          <a href="#" className="transition-colors hover:text-nebula">
            Privacy
          </a>
          <a href="#" className="transition-colors hover:text-nebula">
            Campus Status
          </a>
        </div>
      </div>
    </footer>
  );
}
