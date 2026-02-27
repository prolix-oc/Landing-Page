export interface ImageRecord {
  id: number;
  filename: string;
  original_name: string | null;
  url: string;
  width: number | null;
  height: number | null;
  size_bytes: number | null;
  mime_type: string | null;
  uploaded_at: string;
}

export interface ImagesListResponse {
  success: boolean;
  images: ImageRecord[];
  total: number;
}
