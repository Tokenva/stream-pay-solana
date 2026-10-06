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
} from "@/lib/auth";

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

      if (session?.authenticated) {
        router.push("/");
      }
    })();
  }, [router]);

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

      router.push("/");
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
    <main className="min-h-screen bg-black px-6 py-16 text-white">
      <div className="mx-auto flex min-h-[70vh] max-w-md items-center justify-center">
        <section className="w-full rounded-2xl border border-white/10 bg-white/[0.03] p-8">
          <div className="mb-8">
            <p className="text-sm font-medium text-white/50">
              TOKENVA
            </p>

            <h1 className="mt-3 text-3xl font-semibold">
              Company workspace
            </h1>

            <p className="mt-3 text-sm leading-6 text-white/55">
              Connect your Solana wallet to
              authenticate with Tokenva.
            </p>
          </div>

          <div className="flex justify-center">
            {mounted && (
              <WalletMultiButton />
            )}
          </div>

          {mounted && connected && (
            <button
              type="button"
              onClick={authenticate}
              disabled={loading}
              className="mt-5 w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Signing..."
                : "Sign in with wallet"}
            </button>
          )}

          {error && (
            <p className="mt-5 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-300">
              {error}
            </p>
          )}
        </section>
      </div>
    </main>
  );
}