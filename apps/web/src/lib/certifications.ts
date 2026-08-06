import type { Certification } from "@ipskill/shared";

interface CertificationRow {
  id: string;
  github_id: string;
  name: string;
  issuer: string;
  issue_date: string;
  expiry_date: string | null;
  credential_id: string | null;
  credential_url: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export function rowToCertification(row: CertificationRow): Certification {
  return {
    id: row.id,
    githubId: row.github_id,
    name: row.name,
    issuer: row.issuer,
    issueDate: row.issue_date,
    expiryDate: row.expiry_date,
    credentialId: row.credential_id,
    credentialUrl: row.credential_url,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
