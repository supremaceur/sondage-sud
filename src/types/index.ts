export type UserRole = "user" | "admin" | "super_admin";

export type QuestionType = "mcq_single" | "mcq_multiple" | "counter" | "free_text";

export interface Site {
  id: string;
  name: string;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  site_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Survey {
  id: string;
  created_by: string;
  title: string;
  description: string | null;
  is_active: boolean;
  site_id: string | null;
  created_at: string;
}

export interface Question {
  id: string;
  survey_id: string;
  type: QuestionType;
  title: string;
  options: string[] | null;
  position: number;
  created_at: string;
}

export interface Response {
  id: string;
  survey_id: string;
  user_id: string;
  submitted_at: string;
}

export interface Answer {
  id: string;
  response_id: string;
  question_id: string;
  value: string | string[] | number;
  created_at: string;
}
