export type ApplicationStatus =
  | "pending"
  | "approved"
  | "rejected";

export type PilotApplication = {
  id: string;
  wallet: string;
  company_name: string;
  company_website: string;
  work_email: string;
  country: string;
  team_size: number;
  monthly_stablecoin_payroll_volume: string;
  primary_use_case: string;
  why_tokenva: string;
  status: ApplicationStatus;
  rejection_reason: string | null;
  company_id: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
};

export async function getApplication() {
  const response = await fetch(
    "/api/backend/api/application",
    {
      credentials: "include",
      cache: "no-store",
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error ??
        "Unable to load application",
    );
  }

  return data as {
    application:
      | PilotApplication
      | null;
  };
}

export async function createApplication(
  input: {
    companyName: string;
    companyWebsite: string;
    workEmail: string;
    country: string;
    teamSize: number;
    monthlyStablecoinPayrollVolume: string;
    primaryUseCase: string;
    whyTokenva: string;
  },
) {
  const response = await fetch(
    "/api/backend/api/application",
    {
      method: "POST",
      credentials: "include",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(input),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error ??
        "Unable to submit application",
    );
  }

  return data as {
    application: PilotApplication;
  };
}