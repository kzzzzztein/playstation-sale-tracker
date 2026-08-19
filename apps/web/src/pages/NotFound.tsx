import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-content-7xl px-4 py-24 text-center">
      <p className="font-display text-6xl font-semibold text-zinc-700">404</p>
      <p className="mt-3 text-zinc-400">This page doesn't exist.</p>
      <Link to="/" className="mt-6 inline-block rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white">
        Back to home
      </Link>
    </div>
  );
}
