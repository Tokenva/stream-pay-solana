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
import {
  getOrganizationPda,
  getOrganizationRolesPda,
} from "@/lib/pdas";

export type OrganizationRolesData = {
  organization: PublicKey;
  admin: PublicKey;
  finance: PublicKey;
  approver: PublicKey;
  viewer: PublicKey;
};

export function useOrganization(companyOwnerAddress = "") {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const walletKey =
    wallet?.publicKey.toBase58() ?? "";

  const ownerKey =
    companyOwnerAddress.trim() || walletKey;

  const [organization, setOrganization] =
    useState<PublicKey | null>(null);

  const [organizationAuthority, setOrganizationAuthority] =
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

  const loadedKeyRef =
    useRef<string | null>(null);

  const loadOrganization = useCallback(
    async (force = false) => {
      if (!ownerKey) {
        loadedKeyRef.current = null;
        setOrganization(null);
        setOrganizationAuthority(null);
        setOrganizationRoles(null);
        setOrganizationRolesPda(null);
        setRolesExists(false);
        setExists(false);
        setError(null);
        return;
      }

      const loadKey = `${walletKey}:${ownerKey}`;

      if (!force && loadedKeyRef.current === loadKey) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const owner = new PublicKey(ownerKey);

        const [organizationPda] =
          getOrganizationPda(owner);

        const account =
          await connection.getAccountInfo(
            organizationPda,
          );

        setOrganization(organizationPda);
        setExists(account !== null);

        if (!account || !wallet) {
          setOrganizationAuthority(null);
          setOrganizationRoles(null);
          setOrganizationRolesPda(null);
          setRolesExists(false);
          loadedKeyRef.current = loadKey;
          return;
        }

        const program =
          getProgram(connection, wallet);

        const organizationData =
          await program.account.organization.fetch(
            organizationPda,
          );

        setOrganizationAuthority(
          organizationData.authority,
        );

        const [rolesPda] =
          getOrganizationRolesPda(
            organizationPda,
          );

        setOrganizationRolesPda(rolesPda);

        const rolesAccount =
          await connection.getAccountInfo(
            rolesPda,
          );

        setRolesExists(
          rolesAccount !== null,
        );

        if (rolesAccount) {
          const roleData =
            await program.account.organizationRoles.fetch(
              rolesPda,
            );

          setOrganizationRoles(
            roleData as OrganizationRolesData,
          );
        } else {
          setOrganizationRoles(null);
        }

        loadedKeyRef.current = loadKey;
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to read Organization",
        );
      } finally {
        setLoading(false);
      }
    },
    [
      connection,
      wallet,
      walletKey,
      ownerKey,
    ],
  );

  useEffect(() => {
    void loadOrganization(true);
  }, [loadOrganization]);

  const createOrganization = useCallback(
    async () => {
      if (!wallet) {
        throw new Error(
          "Connect your wallet first",
        );
      }

      const program =
        getProgram(connection, wallet);

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

  const initializeOrganizationRoles =
    useCallback(
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

        const owner =
          new PublicKey(ownerKey);

        const [organizationPda] =
          getOrganizationPda(owner);

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

        if (!organizationAuthority ||
            !wallet.publicKey.equals(organizationAuthority)) {
          throw new Error(
            "Only the company owner can initialize roles",
          );
        }

        const program =
          getProgram(connection, wallet);

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
        ownerKey,
        organizationAuthority,
        loadOrganization,
      ],
    );

  return {
    organization,
    organizationAuthority,
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
