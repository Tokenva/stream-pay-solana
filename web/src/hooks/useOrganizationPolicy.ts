"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import {
  useAnchorWallet,
  useConnection,
} from "@solana/wallet-adapter-react";

import { getProgram } from "@/lib/anchor";
import {
  getOrganizationPda,
  getOrganizationPolicyPda,
} from "@/lib/pdas";

const DECIMALS = 6;

function toBaseUnits(value: string): BN {
  const normalized = value.trim();

  if (!/^\d+(\.\d+)?$/.test(normalized)) {
    throw new Error("Enter a valid policy amount");
  }

  const [whole, fraction = ""] =
    normalized.split(".");

  if (fraction.length > DECIMALS) {
    throw new Error(
      `Policy amounts support ${DECIMALS} decimal places`,
    );
  }

  const base =
    new BN(10).pow(new BN(DECIMALS));

  return new BN(whole)
    .mul(base)
    .add(
      new BN(
        fraction
          .padEnd(DECIMALS, "0") || "0",
      ),
    );
}

export type OrganizationPolicyData = {
  organization: PublicKey;
  approvedMint: PublicKey;
  maxTransactionAmount: BN;
  maxPayrollAmount: BN;
  maxEmployeeAmount: BN;
  requireApproval: boolean;
  paused: boolean;
  bump: number;
  createdAt: BN;
};

export function useOrganizationPolicy(
  companyOwnerAddress = "",
) {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const walletKey =
    wallet?.publicKey.toBase58() ?? "";

  const ownerKey =
    companyOwnerAddress.trim() || walletKey;

  const [organizationPolicy, setOrganizationPolicy] =
    useState<OrganizationPolicyData | null>(null);

  const [policyPda, setPolicyPda] =
    useState<PublicKey | null>(null);

  const [exists, setExists] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const loadPolicy = useCallback(
    async () => {
      if (!ownerKey || !wallet) {
        setOrganizationPolicy(null);
        setPolicyPda(null);
        setExists(false);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const owner =
          new PublicKey(ownerKey);

        const [organization] =
          getOrganizationPda(owner);

        const [policy] =
          getOrganizationPolicyPda(
            organization,
          );

        setPolicyPda(policy);

        const account =
          await connection.getAccountInfo(policy);

        setExists(account !== null);

        if (!account) {
          setOrganizationPolicy(null);
          return;
        }

        const program =
          getProgram(connection, wallet);

        const data =
          await program.account.organizationPolicy.fetch(
            policy,
          );

        setOrganizationPolicy(
          data as OrganizationPolicyData,
        );
      } catch (err) {
        setOrganizationPolicy(null);
        setExists(false);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to read organization policy",
        );
      } finally {
        setLoading(false);
      }
    },
    [
      connection,
      wallet,
      ownerKey,
    ],
  );

  useEffect(() => {
    void loadPolicy();
  }, [loadPolicy]);

  const initializePolicy = useCallback(
    async (
      approvedMint: PublicKey,
      maxTransactionAmount: string,
      maxPayrollAmount: string,
      maxEmployeeAmount: string,
      requireApproval: boolean,
      paused: boolean,
    ) => {
      if (!wallet) {
        throw new Error(
          "Connect your wallet first",
        );
      }

      const owner =
        new PublicKey(ownerKey);

      const [organization] =
        getOrganizationPda(owner);

      const [policy] =
        getOrganizationPolicyPda(
          organization,
        );

      const program =
        getProgram(connection, wallet);

      const signature =
        await program.methods
          .initializeOrganizationPolicy(
            approvedMint,
            toBaseUnits(maxTransactionAmount),
            toBaseUnits(maxPayrollAmount),
            toBaseUnits(maxEmployeeAmount),
            requireApproval,
            paused,
          )
          .accountsPartial({
            authority: wallet.publicKey,
            organization,
            policy,
          })
          .rpc();

      await loadPolicy();

      return {
        signature,
        policyPda: policy,
      };
    },
    [
      connection,
      wallet,
      ownerKey,
      loadPolicy,
    ],
  );

  const updatePolicy = useCallback(
    async (
      approvedMint: PublicKey,
      maxTransactionAmount: string,
      maxPayrollAmount: string,
      maxEmployeeAmount: string,
      requireApproval: boolean,
      paused: boolean,
    ) => {
      if (!wallet) {
        throw new Error(
          "Connect your wallet first",
        );
      }

      const owner =
        new PublicKey(ownerKey);

      const [organization] =
        getOrganizationPda(owner);

      const [policy] =
        getOrganizationPolicyPda(
          organization,
        );

      const program =
        getProgram(connection, wallet);

      const signature =
        await program.methods
          .updateOrganizationPolicy(
            approvedMint,
            toBaseUnits(maxTransactionAmount),
            toBaseUnits(maxPayrollAmount),
            toBaseUnits(maxEmployeeAmount),
            requireApproval,
            paused,
          )
          .accountsPartial({
            authority: wallet.publicKey,
            organization,
            policy,
          })
          .rpc();

      await loadPolicy();

      return {
        signature,
        policyPda: policy,
      };
    },
    [
      connection,
      wallet,
      ownerKey,
      loadPolicy,
    ],
  );

  return {
    organizationPolicy,
    policyPda,
    exists,
    loading,
    error,
    refresh: loadPolicy,
    initializePolicy,
    updatePolicy,
  };
}
