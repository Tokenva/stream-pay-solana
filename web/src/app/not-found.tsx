import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 sm:px-8">
        <header className="flex h-20 items-center justify-between border-b border-white/[0.08]">
            <Link href="/" className="group flex items-center gap-2.5">
              <Image src='/logo.svg' alt='logo' width='200' height='200' />
            </Link>

          <span className="text-xs uppercase tracking-[0.2em] text-white/30">
            Tokenva
          </span>
        </header>

        <div className="flex flex-1 items-center justify-center py-20">
          <section className="w-full max-w-xl text-center">
            <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-white/30">
              Error 404
            </p>

            <h1 className="mt-5 text-6xl font-medium tracking-[-0.06em] text-white sm:text-8xl">
              404
            </h1>

            <h2 className="mt-6 text-2xl font-medium tracking-[-0.03em] sm:text-3xl">
              Page not found
            </h2>

            <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-white/40">
              The page you are looking for does not exist or may have
              been moved.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/"
                className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
              >
                Back to TokenvaPay
              </Link>

              <Link
                href="/login"
                className="rounded-xl border border-white/[0.12] bg-white/[0.04] px-6 py-3 text-sm font-medium text-white transition hover:bg-white/[0.08]"
              >
                Sign in
              </Link>
            </div>
          </section>
        </div>

        <footer className="flex min-h-16 items-center justify-between border-t border-white/[0.07] py-5 text-[10px] uppercase tracking-[0.16em] text-white/20">
          <span>TokenvaPay · A product of Tokenva</span>
          <span>© {new Date().getFullYear()} Tokenva</span>
        </footer>
      </div>
    </main>
  );
}