import type {
  PilotApplication,
} from "@/lib/application";

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
  | "rejected"
  | null;
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
  application:
  | PilotApplication
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

export async function getCompanies() {
  const response = await fetch(
    "/api/backend/api/companies",
    {
      credentials: "include",
      cache: "no-store",
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error ?? "Unable to load companies",
    );
  }

  return data as {
    companies: Company[];
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

export type EmployeeInvitation = {
  id: string;
  company_id: string;
  employee_wallet: string;
  status:
    | "pending"
    | "accepted"
    | "revoked";
  expires_at: string;
  accepted_at: string | null;
  revoked_at: string | null;
  created_by: string;
  created_at: string;
};

export async function getEmployeeInvitations(
  companyId: string,
) {
  const response = await fetch(
    `/api/backend/api/company/invitations?companyId=${encodeURIComponent(
      companyId,
    )}`,
    {
      credentials: "include",
      cache: "no-store",
    },
  );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data.error ??
        "Unable to load employee invitations",
    );
  }

  return data as {
    invitations: EmployeeInvitation[];
  };
}

export async function createEmployeeInvitation(
  companyId: string,
  employeeWallet: string,
) {
  const response = await fetch(
    "/api/backend/api/company/invitations",
    {
      method: "POST",
      headers: {
        "content-type":
          "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        companyId,
        employeeWallet,
      }),
    },
  );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data.error ??
        "Unable to create employee invitation",
    );
  }

  return data as {
    invitation: EmployeeInvitation;
    code: string;
    path: string;
  };
}

export async function revokeEmployeeInvitation(
  companyId: string,
  invitationId: string,
) {
  const response = await fetch(
    `/api/backend/api/company/invitations/${encodeURIComponent(
      invitationId,
    )}?companyId=${encodeURIComponent(
      companyId,
    )}`,
    {
      method: "DELETE",
      credentials: "include",
    },
  );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data.error ??
        "Unable to revoke invitation",
    );
  }

  return data as {
    success: boolean;
  };
}

export async function acceptEmployeeInvitation(
  code: string,
) {
  const response = await fetch(
    "/api/backend/api/company/invitations/accept",
    {
      method: "POST",
      headers: {
        "content-type":
          "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        code,
      }),
    },
  );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data.error ??
        "Unable to accept invitation",
    );
  }

  return data as {
    success: boolean;
    companyId: string;
  };
}