import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0D0D12]">
      <div className="text-center">
        <p
          className="text-8xl font-extrabold mb-4"
          style={{
            background: "linear-gradient(135deg, #E040A0 0%, #FF6B35 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          404
        </p>
        <h1 className="text-2xl font-bold text-white mb-2">Page not found</h1>
        <p className="text-white/50 text-sm mb-6">
          The page you&apos;re looking for doesn&apos;t exist or you don&apos;t have access.
        </p>
        <Link
          href="/"
          className="inline-flex px-6 py-3 rounded-full font-bold text-sm text-white bg-gradient-to-r from-[#E040A0] to-[#FF6B35] hover:opacity-90 transition-opacity"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
