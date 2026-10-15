export default function Navbar() {
  return (
    <nav className="flex items-center gap-4 px-5 py-3 bg-canvas border-b border-white/10 w-full">
      <div className="w-12 h-10 shrink-0 flex items-center justify-center rounded-xl bg-surface-raised border border-white/10 text-accent font-bold text-sm tracking-wide">
        FS
      </div>

      <div className="hidden sm:block w-44 shrink-0 text-white/90 font-semibold text-sm leading-tight">
        Fantasy Scout Report
      </div>

      <button
        className="w-10 h-10 rounded-full bg-surface-raised border border-white/10 hover:border-white/20 transition-colors shrink-0 ml-auto"
        aria-label="Account"
      />
    </nav>
  );
}
