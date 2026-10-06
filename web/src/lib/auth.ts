export async function getAuthNonce(
  wallet: string,
) {
  const response = await fetch(
    "/api/backend/api/auth/nonce",
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        wallet,
      }),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error ??
        "Unable to create authentication nonce",
    );
  }

  return data as {
    nonce: string;
    message: string;
  };
}

export async function loginWithWallet(
  wallet: string,
  signMessage: (
    message: Uint8Array,
  ) => Promise<Uint8Array>,
) {
  const {
    nonce,
    message,
  } = await getAuthNonce(wallet);

  const encodedMessage =
    new TextEncoder().encode(message);

  const signature =
    await signMessage(encodedMessage);

  const signatureBase64 =
    btoa(
      String.fromCharCode(
        ...signature,
      ),
    );

  const response = await fetch(
    "/api/backend/api/auth/login",
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        wallet,
        nonce,
        signature:
          signatureBase64,
      }),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error ??
        "Wallet authentication failed",
    );
  }

  return data as {
    authenticated: boolean;
    wallet: string;
  };
}

export async function getSession() {
  const response = await fetch(
    "/api/backend/api/auth/session",
    {
      credentials: "include",
      cache: "no-store",
    },
  );

  if (!response.ok) {
    return null;
  }

  return response.json() as Promise<{
    authenticated: boolean;
    wallet: string;
  }>;
}

export async function logout() {
  await fetch(
    "/api/backend/api/auth/logout",
    {
      method: "POST",
      credentials: "include",
    },
  );
}
