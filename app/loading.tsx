export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0D0D12]">
      <div className="flex flex-col items-center gap-4">
        <div
          className="w-10 h-10 rounded-full border-2 border-transparent animate-spin"
          style={{
            borderTopColor: "#E040A0",
            borderRightColor: "#FF6B35",
          }}
        />
        <p className="text-white/40 text-sm">Loading…</p>
      </div>
    </div>
  );
}
