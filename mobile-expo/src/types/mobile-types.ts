export interface OpeningHoursDay {
  open?: string;
  close?: string;
  isOpen?: boolean;
  closed?: boolean;
}

export type OpeningHours = Record<string, OpeningHoursDay | string | null>;

export interface Restaurant {
  id: string;
  name: string;
  description: string | null;
  address: string;
  area: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  cuisineTypes: string[];
  imageUrls: string[];
  profileImageUrl: string | null;
  coverImageUrl: string | null;
  priceRange: 'BUDGET' | 'MODERATE' | 'EXPENSIVE' | 'FINE_DINING' | string;
  isActive: boolean;
  isVerified: boolean;
  avgRating: number | null;
  totalReviews: number;
  totalSeats: number | null;
  reservationDeposit: number;
  latitude: number | null;
  longitude: number | null;
  openingHours: OpeningHours | null;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  imageUrl: string | null;
  isAvailable: boolean;
}

export interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: {
    name: string | null;
    avatarUrl: string | null;
  };
  reply: {
    content: string;
    createdAt?: string;
  } | null;
}

export interface Promotion {
  id: string;
  title: string;
  description: string | null;
  type: 'DISCOUNT' | 'HAPPY_HOUR' | 'SPECIAL_EVENT' | 'SEASONAL' | 'COUPON' | string;
  discountValue: number | null;
  startDate: string;
  endDate: string;
  menuItems: MenuItem[];
}

export interface Reservation {
  id: string;
  restaurantId: string;
  restaurant: {
    name: string;
    area: string;
    coverImageUrl?: string | null;
  };
  date: string;
  time: string;
  partySize: number;
  status: 'PENDING_DEPOSIT' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | string;
  specialRequests?: string | null;
  depositAmount?: number;
  createdAt?: string;
}

export interface WaitlistEntry {
  id: string;
  restaurantId: string;
  partySize: number;
  status: 'WAITING' | 'SEATED' | 'CANCELLED';
  position?: number;
  estimatedWaitMinutes?: number;
}

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  dietaryPreferences?: string[];
  loyaltyPoints?: number;
  tier?: 'SILVER' | 'GOLD' | 'PLATINUM';
}
