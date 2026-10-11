export type AnswerType = "text" | "textarea" | "email" | "date" | "number" | "select" | "boolean";
export type FieldGroup = "common" | "specific" | "conditional";
export type Answers = Record<string, string | number | boolean | undefined>;

export interface VisibilityCondition {
  field: string;
  equals: string | boolean;
}

export interface FieldDefinition {
  id: string;
  label: string;
  help?: string;
  type: AnswerType;
  required: boolean;
  group: FieldGroup;
  options?: string[];
  showIf?: VisibilityCondition;
  validation?: { min?: number; max?: number; minLength?: number };
  /** Common fields are remembered across documents in this browser. */
  reusable?: boolean;
}

export type CrossCheck =
  | { kind: "dateAfter"; field: string; after: string; message: string }
  | { kind: "notEqual"; field: string; other: string; message: string };

export type RiskLevel = "low" | "medium" | "high";
export type ReviewStatus = "demo_unreviewed" | "approved";

export interface DocumentType {
  slug: string;
  name: string;
  description: string;
  categories: string[];
  keywords: string[];
  riskLevel: RiskLevel;
  riskNote?: string;
  jurisdictions: string[];
  template: {
    version: number;
    reviewStatus: ReviewStatus;
    title: string;
    body: string;
  };
  fields: FieldDefinition[];
  crossChecks?: CrossCheck[];
}

export interface Category {
  slug: string;
  name: string;
  description: string;
  children: string[];
}

export type SupportStatus = "supported" | "limited" | "unsupported";

export interface Jurisdiction {
  code: string;
  name: string;
  support: SupportStatus;
  note: string;
}
