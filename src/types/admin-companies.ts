// Types pour l'administration des entreprises

export interface CompanyTranslation {
  language_code: string;
  description: string;
}

export interface AdminCompany {
  id: string;
  name: string;
  slug: string;
  website_url: string | null;
  logo_url: string | null;
  founded_year: number | null;
  headquarters: string | null;
  company_type: "developer" | "publisher" | "both";
  is_active: boolean;
  gameCount: number;
  translations: CompanyTranslation[];
}

export interface FetchCompaniesParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
