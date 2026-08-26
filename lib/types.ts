export type Category = {
  id: string;
  name: string;
  description: string | null;
  card_image_url: string | null;
  column_color: string | null;
  category_groups: CategoryGroup[];
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type CategoryGroup = "subject" | "month";

export type AgeGroup = "유치부" | "저학년" | "고학년" | "중등부" | "고등부" | "시니어";

export type LibrarySection = "kindergarten" | "elementary" | "senior";

export type LibraryView = CategoryGroup | LibrarySection;

export type PptMaterial = {
  id: string;
  category_id: string | null;
  secondary_category_id: string | null;
  title: string;
  description: string | null;
  tags: string[];
  age_groups: AgeGroup[];
  library_sections: LibrarySection[];
  thumbnail_url: string | null;
  file_url: string | null;
  file_name: string | null;
  worksheet_url: string | null;
  worksheet_file_name: string | null;
  is_downloadable: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type MaterialEventType = "click" | "duration" | "download";

export type PptMaterialEvent = {
  id: string;
  material_id: string | null;
  event_type: MaterialEventType;
  duration_seconds: number | null;
  user_agent: string | null;
  created_at: string;
};

export type SiteSettings = {
  id: string;
  site_name: string;
  header_title: string;
  header_description: string | null;
  logo_url: string | null;
  favicon_url: string | null;
  background_color: string;
  header_background_color: string;
  banner_background_color: string;
  banner_text_color: string;
  month_banner_image_url: string | null;
  subject_banner_image_url: string | null;
  kindergarten_banner_title: string | null;
  kindergarten_banner_description: string | null;
  kindergarten_banner_image_url: string | null;
  elementary_banner_title: string | null;
  elementary_banner_description: string | null;
  elementary_banner_image_url: string | null;
  senior_banner_title: string | null;
  senior_banner_description: string | null;
  senior_banner_image_url: string | null;
  default_column_color: string;
  card_background_color: string;
  card_border_color: string;
  button_color: string;
  text_color: string;
  font_family: string;
  card_radius: number;
  use_card_shadow: boolean;
  created_at: string;
  updated_at: string;
};

export type PptMaterialWithCategory = PptMaterial & {
  categories?: Pick<Category, "id" | "name"> | null;
};

export type MaterialWithCategory = PptMaterialWithCategory;

export type MaterialFormState = {
  id?: string;
  category_id: string;
  secondary_category_id: string;
  title: string;
  description: string;
  tags: string;
  age_groups: AgeGroup[];
  library_sections: LibrarySection[];
  thumbnail_url: string;
  file_url: string;
  file_name: string;
  worksheet_url: string;
  worksheet_file_name: string;
  is_downloadable: boolean;
  sort_order: number;
};

export type CategoryFormState = {
  id?: string;
  name: string;
  description: string;
  card_image_url: string;
  column_color: string;
  category_groups: CategoryGroup[];
  sort_order: number;
};

export type BulkUploadStatus = "pending" | "uploading" | "success" | "failed";

export type BulkUploadFileItem = {
  id: string;
  file: File;
  originalName: string;
  expectedTitle: string;
  size: number;
  status: BulkUploadStatus;
  errorMessage?: string;
};
