"use client";

import {
    useEffect,
    useState,
} from "react";
import {
    useParams,
    useRouter,
} from "next/navigation";
import {
    useWallet,
} from "@solana/wallet-adapter-react";
import {
    WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";

import {
    getSession,
    loginWithWallet,
} from "@/lib/auth";

import {
    acceptEmployeeInvitation,
} from "@/lib/company";

export default function EmployeeJoinPage() {
    const router =
        useRouter();

    const params =
        useParams<{
            code: string;
        }>();

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

    const [
        accepted,
        setAccepted,
    ] = useState(false);

    const code =
        typeof params?.code ===
        "string"
            ? decodeURIComponent(
                  params.code,
              )
            : "";

    useEffect(() => {
        setMounted(true);
    }, []);

    async function accept() {
        if (!publicKey) {
            setError(
                "Connect the invited employee wallet first.",
            );
            return;
        }

        if (!signMessage) {
            setError(
                "This wallet does not support message signing.",
            );
            return;
        }

        if (!code) {
            setError(
                "Invalid invitation link.",
            );
            return;
        }

        setError("");
        setLoading(true);

        try {
            const session =
                await getSession();

            if (
                !session?.authenticated ||
                session.wallet !==
                    publicKey.toBase58()
            ) {
                await loginWithWallet(
                    publicKey.toBase58(),
                    signMessage,
                );
            }

            await acceptEmployeeInvitation(
                code,
            );

            setAccepted(true);

            setTimeout(() => {
                router.replace(
                    "/app",
                );
            }, 1200);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to accept invitation",
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="min-h-screen bg-black px-6 py-16 text-white">
            <div className="mx-auto flex min-h-[70vh] max-w-md items-center justify-center">
                <section className="w-full rounded-2xl border border-white/10 bg-white/[0.03] p-8">
                    <p className="text-sm font-medium text-white/50">
                        TOKENVAPAY
                    </p>

                    <h1 className="mt-3 text-3xl font-semibold">
                        Join your company
                    </h1>

                    <p className="mt-3 text-sm leading-6 text-white/55">
                        Connect the employee wallet that received this invitation.
                    </p>

                    {accepted ? (
                        <div className="mt-8 rounded-xl border border-green-400/20 bg-green-400/10 p-4">
                            <p className="text-sm text-green-300">
                                Invitation accepted.
                            </p>

                            <p className="mt-1 text-xs text-green-400/70">
                                Opening your employee workspace...
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="mt-8 flex justify-center">
                                {mounted && (
                                    <WalletMultiButton />
                                )}
                            </div>

                            {mounted &&
                                connected && (
                                    <button
                                        type="button"
                                        onClick={
                                            accept
                                        }
                                        disabled={
                                            loading
                                        }
                                        className="mt-5 w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {loading
                                            ? "Verifying invitation..."
                                            : "Accept invitation"}
                                    </button>
                                )}
                        </>
                    )}

                    {error && (
                        <p className="mt-5 rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300">
                            {error}
                        </p>
                    )}

                    <p className="mt-6 text-center text-xs text-white/25">
                        The invitation is wallet-specific and cannot be accepted
                        by another wallet.
                    </p>
                </section>
            </div>
        </main>
    );
}