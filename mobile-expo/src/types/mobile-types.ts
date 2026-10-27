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
  distanceKm?: number;
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
  status: 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' | string;
  specialRequests?: string | null;
  depositAmount?: number;
  confirmationExpiresAt?: string | null;
  payment?: {
    id: string;
    amount: number;
    currency: string;
    status: string;
    receiptUrl?: string | null;
    orderItems?: { name: string; price: number; quantity: number }[] | null;
  } | null;
  review?: { id: string; rating: number; comment?: string | null } | null;
  createdAt?: string;
}

export interface WaitlistEntry {
  id: string;
  restaurantId: string;
  restaurant?: { id: string; name: string };
  date: string;
  time: string;
  partySize: number;
  status: 'WAITING' | 'NOTIFIED' | 'SEATED' | 'CANCELLED' | 'EXPIRED';
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

export interface DiningPreferences {
  cuisines: string[];
  dietaryRestrictions: string[];
  budgetPreference?: 'BUDGET' | 'MODERATE' | 'EXPENSIVE' | 'FINE_DINING';
  preferredDiningTimes: string[];
  seatingPreferences: string[];
  occasions: string[];
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  data?: Record<string, unknown> | null;
}

export interface Complaint {
  id: string;
  subject: string;
  description: string;
  status: string;
  adminNote?: string | null;
  createdAt: string;
  restaurant?: { name: string } | null;
}

export interface LoyaltyAccount {
  points: number;
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  totalEarned: number;
}

export interface LoyaltyTransaction {
  id: string;
  points: number;
  type: string;
  description: string;
  createdAt: string;
}
