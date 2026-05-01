export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white">
        <img src="/cato-cloud.svg" alt="" className="h-7 w-7" aria-hidden />
      </span>
      <div className="leading-tight">
        <div className="text-[15px] font-semibold text-cato-mist">
          Cato Networks
        </div>
        <div className="text-[11px] uppercase tracking-[0.14em] text-cato-green">
          API Guard Wizard
        </div>
      </div>
    </div>
  );
}
