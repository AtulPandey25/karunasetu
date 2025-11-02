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

export interface Celebration {
  _id?: string;
  title: string;
  description?: string;
  imageUrl?: string;
  isEvent?: boolean;
  position?: number;
  createdAt?: string | Date;
}

export interface GetCelebrationsResponse {
  celebrations: Celebration[];
}

export interface Product {
  _id?: string;
  celebrationId: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  position?: number;
  createdAt?: string | Date;
}

export interface GetProductsResponse {
  products: Product[];
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  _id?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: OrderItem[];
  totalAmount: number;
  status: "pending" | "confirmed" | "shipped" | "delivered";
  createdAt?: string | Date;
}

export interface CreateOrderResponse {
  order: Order;
}
