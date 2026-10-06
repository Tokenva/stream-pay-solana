export type Company = {
  id: string;
  name: string;
  treasury_wallet: string | null;
  created_by: string;
  pilot_status:
    | "pending"
    | "approved"
    | "active"
    | "expired"
    | "rejected";
  pilot_start: string | null;
  pilot_end: string | null;
  created_at: string;
  updated_at: string;
  role:
    | "owner"
    | "admin"
    | "finance"
    | "approver"
    | "viewer"
    | "employee";
};

export type CompanyAccess = {
  company: Company | null;
  hasDashboardAccess: boolean;
  accessStatus:
    | "pending"
    | "approved"
    | "active"
    | "expired"
    | "rejected"
    | null;
};

export async function getCompany() {
  const response = await fetch(
    "/api/backend/api/company",
    {
      credentials: "include",
      cache: "no-store",
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error ?? "Unable to load company",
    );
  }

  return data as {
    company: Company | null;
  };
}

export async function getCompanyAccess() {
  const response = await fetch(
    "/api/backend/api/company/access",
    {
      credentials: "include",
      cache: "no-store",
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error ??
        "Unable to load company access",
    );
  }

  return data as CompanyAccess;
}

export async function createCompany(
  name: string,
  treasuryWallet?: string,
) {
  const response = await fetch(
    "/api/backend/api/company",
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        name,
        treasuryWallet,
      }),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error ??
        "Unable to create company",
    );
  }

  return data as {
    company: Company;
  };
}