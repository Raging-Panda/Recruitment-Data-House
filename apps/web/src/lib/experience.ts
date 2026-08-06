import type { WorkExperience } from "@ipskill/shared";

interface WorkExperienceRow {
  id: string;
  github_id: string;
  company: string;
  role: string;
  location: string | null;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export function rowToWorkExperience(row: WorkExperienceRow): WorkExperience {
  return {
    id: row.id,
    githubId: row.github_id,
    company: row.company,
    role: row.role,
    location: row.location,
    startDate: row.start_date,
    endDate: row.end_date,
    isCurrent: row.is_current,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
