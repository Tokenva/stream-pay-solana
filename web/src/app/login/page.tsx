"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  useWallet,
} from "@solana/wallet-adapter-react";

import {
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";

import {
  loginWithWallet,
  getSession,
  logout,
} from "@/lib/auth";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();

  const {
    publicKey,
    connected,
    signMessage,
  } = useWallet();

  const [
    mounted,
    setMounted,
  ] = useState(false);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  useEffect(() => {
    setMounted(true);

    void (async () => {
      const session =
        await getSession();

      if (!session?.authenticated) {
        return;
      }

      if (
        publicKey &&
        session.wallet ===
        publicKey.toBase58()
      ) {
        router.push("/app");
        return;
      }

      await logout();
    })();
  }, [router, publicKey]);

  async function authenticate() {
    if (!publicKey) {
      return;
    }

    if (!signMessage) {
      setError(
        "This wallet does not support message signing.",
      );
      return;
    }

    setError("");
    setLoading(true);

    try {
      await loginWithWallet(
        publicKey.toBase58(),
        signMessage,
      );

      router.push("/app");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Authentication failed",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      {/* Subtle ambient lighting */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
      >
        <div className="absolute left-1/2 top-[-18rem] h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-white/[0.035] blur-3xl" />
        <div className="absolute bottom-[-20rem] left-1/2 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-white/[0.02] blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 sm:px-8">
        {/* Header */}
        <header className="flex h-20 items-center justify-between border-b border-white/[0.08]">
          <Link
            href="/"
            className="text-sm font-semibold tracking-[-0.02em] text-white"
          >
            TokenvaPay
          </Link>

          <Link
            href="/"
            className="text-xs text-white/40 transition hover:text-white"
          >
            Back to website
          </Link>
        </header>

        {/* Login */}
        <div className="flex flex-1 items-center justify-center py-16 sm:py-20">
          <section className="w-full max-w-[440px]">
            <div className="rounded-3xl border border-white/[0.11] bg-white/[0.035] p-7 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-9">
              <div className="mb-9">
                <div className="mb-6 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  <span className="text-[10px] font-medium uppercase tracking-[0.28em] text-white/40">
                    TokenvaPay
                  </span>
                </div>

                <h1 className="text-3xl font-medium tracking-[-0.04em] text-white sm:text-[34px]">
                  Sign in to your workspace.
                </h1>

                <p className="mt-4 max-w-[360px] text-sm leading-6 text-white/45">
                  Connect your Solana wallet to securely access your
                  TokenvaPay workspace.
                </p>
              </div>

              <div className="space-y-3">
                <div className="rounded-2xl border border-white/[0.08] bg-black/30 p-3">
                  <p className="mb-3 px-1 text-[10px] font-medium uppercase tracking-[0.2em] text-white/30">
                    Wallet
                  </p>

                  <div className="flex justify-center">
                    {mounted && (
                      <WalletMultiButton
                        className="h-12 w-full justify-center rounded-xl border border-white/15 bg-white px-4 text-sm font-semibold text-black shadow-none transition hover:bg-white/90"
                      />
                    )}

                    {!mounted && (
                      <button
                        type="button"
                        disabled
                        className="h-12 cursor-pointer w-full rounded-xl border border-white/10 bg-white/[0.06] text-sm font-medium text-white/35"
                      >
                        Select wallet
                      </button>
                    )}
                  </div>
                </div>

                {mounted && connected && (
                  <button
                    type="button"
                    onClick={authenticate}
                    disabled={loading}
                    className="group flex cursor-pointer h-12 w-full items-center justify-center rounded-xl border border-white/[0.14] bg-white/[0.06] px-4 text-sm font-semibold text-white transition hover:border-white/25 hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <span>
                      {loading
                        ? "Signing..."
                        : "Continue with wallet"}
                    </span>
                    {!loading && (
                      <span className="ml-2 text-white/35 transition-transform group-hover:translate-x-0.5">
                        →
                      </span>
                    )}
                  </button>
                )}
              </div>

              {error && (
                <div className="mt-5 rounded-2xl border border-red-400/15 bg-red-400/[0.07] px-4 py-3">
                  <p className="text-sm leading-5 text-red-300">
                    {error}
                  </p>
                </div>
              )}

              <div className="mt-8 flex items-start gap-3 border-t border-white/[0.07] pt-6">
                <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-white/20 text-[9px] text-white/50">
                  ✓
                </span>
                <p className="text-[11px] leading-5 text-white/30">
                  Your wallet signature is used to authenticate your
                  session. TokenvaPay never asks for your private key.
                </p>
              </div>
            </div>

            <p className="mt-6 text-center text-[11px] text-white/25">
              TokenvaPay · A product of Tokenva
            </p>
          </section>
        </div>

        {/* Footer */}
        <footer className="flex min-h-16 items-center justify-between border-t border-white/[0.07] py-5 text-[10px] uppercase tracking-[0.16em] text-white/20">
          <span>Secure wallet authentication</span>
          <span>© 2026 Tokenva</span>
        </footer>
      </div>
    </main>
  );
}
