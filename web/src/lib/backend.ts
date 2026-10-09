export type IndexedStream = {
  address: string;
  organization: string;
  employee: string;
  vault: string;
  escrow: string;
  mint: string;
  stream_id: string;
  total_amount: string;
  start_time: string;
  end_time: string;
  claimed_amount: string;
  canceled: boolean;
  cancel_time: string;
  updated_at: string;
};

export async function fetchIndexedStreams(
  params?: {
    companyId?: string
    organization?: string;
    employee?: string;
    canceled?: boolean;
  },
): Promise<IndexedStream[]> {
  const searchParams = new URLSearchParams();
  if (params?.companyId) {
    searchParams.set(
      "companyId",
      params.companyId,
    );
  }
  if (params?.organization) {
    searchParams.set("organization", params.organization);
  }

  if (params?.employee) {
    searchParams.set("employee", params.employee);
  }

  if (params?.canceled !== undefined) {
    searchParams.set(
      "canceled",
      String(params.canceled),
    );
  }

  const query = searchParams.toString();

  const response = await fetch(
    `/api/backend/api/indexed/streams${query ? `?${query}` : ""}`,
    {
      credentials: "include",
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    },
  );

  if (!response.ok) {
    throw new Error(
      "Failed to fetch indexed streams",
    );
  }

  const data = (await response.json()) as {
    count: number;
    streams: IndexedStream[];
  };

  return data.streams;
}

export type Activity = {
  id: string;
  signature: string;
  instruction_index: number;
  instruction: string;
  slot: string;
  block_time: string | null;
  stream_address: string | null;
  organization: string | null;
  employee: string | null;
  created_at: string;
  amount_received: string | null;
};

export async function fetchActivities(
  params?: {
    companyId?: string;
    stream?: string;
    employee?: string;
    organization?: string;
    limit?: number;
    offset?: number;
  },
): Promise<{
  count: number;
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
  activities: Activity[];
}> {
  const searchParams =
    new URLSearchParams();

  if (params?.companyId) {
    searchParams.set(
      "companyId",
      params.companyId,
    );
  }

  if (params?.stream) {
    searchParams.set(
      "stream",
      params.stream,
    );
  }

  if (params?.employee) {
    searchParams.set(
      "employee",
      params.employee,
    );
  }

  if (params?.organization) {
    searchParams.set(
      "organization",
      params.organization,
    );
  }

  if (params?.limit !== undefined) {
    searchParams.set(
      "limit",
      String(params.limit),
    );
  }

  if (params?.offset !== undefined) {
    searchParams.set(
      "offset",
      String(params.offset),
    );
  }

  const query =
    searchParams.toString();

  const response = await fetch(
    `/api/backend/api/activities${query ? `?${query}` : ""
    }`,
    {
      credentials: "include",
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const body = await response.text();

    throw new Error(
      `Failed to fetch activities (${response.status}): ${body}`,
    );
  }

  return (await response.json()) as {
    count: number;
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
    activities: Activity[];
  };
}