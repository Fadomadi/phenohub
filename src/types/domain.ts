export type Cultivar = {
  id: number;
  slug: string;
  name: string;
  aka: string[];
  cloneOnly: boolean;
  cutInfo?: string | null;
  reportCount: number;
  avgRating: number;
  imageCount: number;
  trending: boolean;
  thumbnails: string[];
  recentImages?: string[];
  previewImages?: string[];
  breeder?: string | null;
  offerings?: Array<{
    providerName: string;
    providerSlug: string;
    priceEur?: number | null;
    category?: string | null;
  }>;
};

export type Provider = {
  id: number;
  slug: string;
  name: string;
  country: string;
  countryFlag: string;
  avgScore: number;
  reportCount: number;
  shippingScore: number;
  vitalityScore: number;
};

export type Report = {
  id: number;
  title: string;
  cultivar: string;
  cultivarSlug: string;
  provider: string;
  providerSlug: string;
  author: string;
  shipping: number;
  vitality: number;
  stability: number;
  overall: number;
  status?: "PENDING" | "PUBLISHED" | "REJECTED";
  thumbnail: string;
  images: string[];
  date: string;
  likes: number;
  liked?: boolean;
  comments: number;
  views: number;
  excerpt: string;
};

export type Seed = {
  id: number;
  slug: string;
  name: string;
  breeder: string;
  genetics: string;
  type: "Feminisiert" | "Regular" | "Autoflower";
  floweringTime: string;
  yield: string;
  popularity: number;
  thumbnails: string[];
};

export type ReportComment = {
  id: number;
  reportId: number;
  userId?: number | null;
  authorName: string;
  body: string;
  createdAt: string;
};
