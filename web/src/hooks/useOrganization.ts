"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { PublicKey } from "@solana/web3.js";
import {
  useAnchorWallet,
  useConnection,
} from "@solana/wallet-adapter-react";

import { getProgram } from "@/lib/anchor";
import { getOrganizationPda, getOrganizationRolesPda } from "@/lib/pdas";

type OrganizationRolesData = {
  organization: PublicKey;
  admin: PublicKey;
  finance: PublicKey;
  approver: PublicKey;
  viewer: PublicKey;
};

export function useOrganization() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const walletKey =
    wallet?.publicKey.toBase58() ?? null;

  const [organization, setOrganization] =
    useState<PublicKey | null>(null);

  const [organizationRoles, setOrganizationRoles] =
    useState<OrganizationRolesData | null>(null);

  const [organizationRolesPda, setOrganizationRolesPda] =
    useState<PublicKey | null>(null);

  const [rolesExists, setRolesExists] =
    useState(false);

  const [exists, setExists] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const loadedWalletRef =
    useRef<string | null>(null);

  const loadingRef =
    useRef(false);

  const loadOrganization = useCallback(
    async (force = false) => {
      if (!walletKey) {
        loadedWalletRef.current = null;
        setOrganization(null);
        setOrganizationRoles(null);
        setOrganizationRolesPda(null);
        setRolesExists(false);
        setExists(false);
        setError(null);
        return;
      }

      if (
        !force &&
        loadedWalletRef.current === walletKey
      ) {
        return;
      }

      if (loadingRef.current) {
        return;
      }

      loadingRef.current = true;
      setLoading(true);
      setError(null);

      try {
        const walletPublicKey =
          new PublicKey(walletKey);

        const [organizationPda] =
          getOrganizationPda(
            walletPublicKey,
          );

        const account =
          await connection.getAccountInfo(
            organizationPda,
          );

        setOrganization(organizationPda);
        setExists(account !== null);

        const [rolesPda] =
          getOrganizationRolesPda(organizationPda);

        setOrganizationRolesPda(rolesPda);

        const rolesAccount =
          await connection.getAccountInfo(rolesPda);

        setRolesExists(rolesAccount !== null);

        if (rolesAccount && wallet) {
          try {
            const program = getProgram(
              connection,
              wallet,
            );

            const roleData =
              await program.account.organizationRoles.fetch(
                rolesPda,
              );

            setOrganizationRoles(
              roleData as OrganizationRolesData,
            );
          } catch (rolesErr) {
            console.error(
              "Failed to read organization roles",
              rolesErr,
            );
            setOrganizationRoles(null);
          }
        } else {
          setOrganizationRoles(null);
        }

        loadedWalletRef.current = walletKey;
      } catch (err) {
        console.error(err);

        setError(
          err instanceof Error
            ? err.message
            : "Failed to read Organization",
        );
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [connection, walletKey, wallet],
  );

  useEffect(() => {
    void loadOrganization(true);
  }, [loadOrganization, walletKey]);

  const initializeOrganizationRoles = useCallback(
    async (
      admin: PublicKey,
      finance: PublicKey,
      approver: PublicKey,
      viewer: PublicKey,
    ) => {
      if (!wallet) {
        throw new Error(
          "Connect your wallet first",
        );
      }

      const [organizationPda] =
        getOrganizationPda(
          wallet.publicKey,
        );

      const [rolesPda] =
        getOrganizationRolesPda(
          organizationPda,
        );

      const existing =
        await connection.getAccountInfo(
          rolesPda,
        );

      if (existing) {
        throw new Error(
          "Organization roles are already initialized",
        );
      }

      const program = getProgram(
        connection,
        wallet,
      );

      const signature =
        await program.methods
          .initializeOrganizationRoles(
            admin,
            finance,
            approver,
            viewer,
          )
          .accountsPartial({
            authority: wallet.publicKey,
            organization: organizationPda,
            roles: rolesPda,
          })
          .rpc();

      await loadOrganization(true);

      return {
        signature,
        rolesPda,
      };
    },
    [
      connection,
      wallet,
      loadOrganization,
    ],
  );

  const createOrganization = useCallback(
    async () => {
      if (!wallet) {
        throw new Error(
          "Connect your wallet first",
        );
      }

      const program = getProgram(
        connection,
        wallet,
      );

      const [organizationPda] =
        getOrganizationPda(
          wallet.publicKey,
        );

      const signature =
        await program.methods
          .createOrganization()
          .accounts({
            authority: wallet.publicKey,
          })
          .rpc();

      await loadOrganization(true);

      return {
        signature,
        organizationPda,
      };
    },
    [
      connection,
      wallet,
      loadOrganization,
    ],
  );

  return {
    organization,
    organizationRoles,
    organizationRolesPda,
    rolesExists,
    exists,
    loading,
    error,
    refresh: () =>
      loadOrganization(true),
    createOrganization,
    initializeOrganizationRoles,
  };
}