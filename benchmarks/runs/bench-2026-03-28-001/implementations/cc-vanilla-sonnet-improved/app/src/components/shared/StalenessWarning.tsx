export function StalenessWarning() {
  return (
    <div className="col-span-full mb-2 px-4 py-2 bg-amber-900/50 border border-amber-700 rounded-lg text-amber-300 text-sm flex items-center gap-2">
      <span>⚠️</span>
      <span>Data may be outdated. Click refresh to update.</span>
    </div>
  );
}
