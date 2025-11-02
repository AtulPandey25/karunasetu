export interface DemoResponse {
  message: string;
}

export interface ApiImage {
  id?: string;
  title: string;
  url: string;
  featured?: boolean;
  createdAt: string | Date;
}

export interface GetGalleryResponse {
  images: ApiImage[];
}

export interface UploadImageResponse {
  image: ApiImage;
}

export interface Member {
  _id?: string;
  name: string;
  role: "Founder" | "Co-Founder" | "Partner" | "Co-Partner" | "Core" | "Technology" | "Developer" | "Volunteer" | "Advisor";
  bio?: string;
  photoUrl?: string;
  instaId?: string;
  email?: string;
  contact?: string;
  createdAt?: string | Date;
}

export interface GetMembersResponse {
  members: Member[];
}

export type DonorTier = "Platinum" | "Gold" | "Silver" | "Bronze";

export interface Donor {
  _id?: string;
  name: string;
  tier: DonorTier;
  logoUrl?: string;
  website?: string;
  donatedAmount?: number;
  donatedCommodity?: string;
  createdAt?: string | Date;
}

export interface GetDonorsResponse {
  donors: Donor[];
}

export interface CreateDonorResponse {
  donor: Donor;
}
