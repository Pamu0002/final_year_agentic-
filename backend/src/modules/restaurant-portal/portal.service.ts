import { prisma } from "../../../lib/db.js";
import { adminFirestore } from "../../config/firebase.js";
import { sendEmail } from "../../config/nodemailer.js";
import { createNotification } from "../../../lib/notifications.js";
import { refundReservationPayment } from "../payment/refund.service.js";
import { getSlotCapacity } from "../restaurant/restaurant.service.js";
import { awardLoyaltyPoints } from "../user/user.service.js";

const parseRestaurant = <T extends { cuisineTypes: string; imageUrls: string }>(r: T) => ({
  ...r,
  cuisineTypes: JSON.parse(r.cuisineTypes) as string[],
  imageUrls: JSON.parse(r.imageUrls) as string[],
});

export const registerRestaurant = async (
  adminId: string,
  input: {
    name: string;
    description?: string;
    address: string;
    area: string;
    phone?: string;
    email?: string;
    website?: string;
    cuisineTypes: string[];
    priceRange: "BUDGET" | "MODERATE" | "EXPENSIVE" | "FINE_DINING";
    openingHours: object;
    imageUrls?: string[];
    latitude?: number;
    longitude?: number;
    socialMedia?: object;
    totalSeats?: number;
    maxCapacity?: number;
  },
) => {
  const existing = await prisma.restaurant.findFirst({ where: { adminId } });
  if (existing) throw Object.assign(new Error("Restaurant already registered"), { status: 409 });
  return prisma.restaurant.create({
    data: {
      adminId,
      name: input.name,
      description: input.description ?? null,
      address: input.address,
      area: input.area,
      phone: input.phone ?? null,
      email: input.email ?? null,
      website: input.website ?? null,
      cuisineTypes: JSON.stringify(input.cuisineTypes),
      priceRange: input.priceRange,
      openingHours: input.openingHours,
      imageUrls: JSON.stringify(input.imageUrls ?? []),
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      socialMedia: input.socialMedia ?? undefined,
      totalSeats: input.totalSeats ?? null,
      ...(input.maxCapacity !== undefined && { maxCapacity: input.maxCapacity }),
    },
  });
};

export const getMyRestaurant = async (adminId: string) => {
  const r = await prisma.restaurant.findFirst({ where: { adminId } });
  return r ? parseRestaurant(r) : null;
};

export const getMyStats = async (adminId: string) => {
  const restaurant = await prisma.restaurant.findFirst({ where: { adminId } });
  if (!restaurant) return null;

  const [totalReservations, activeReservations, totalRevenueAgg, pendingReservations] =
    await Promise.all([
      prisma.reservation.count({ where: { restaurantId: restaurant.id } }),
      prisma.reservation.count({
        where: { restaurantId: restaurant.id, status: { in: ["PENDING", "CONFIRMED"] } },
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { reservation: { restaurantId: restaurant.id }, status: "SUCCEEDED" },
      }),
      prisma.reservation.count({
        where: { restaurantId: restaurant.id, status: "PENDING" },
      }),
    ]);

  return {
    restaurantName: restaurant.name,
    avgRating: restaurant.avgRating,
    totalReviews: restaurant.totalReviews,
    totalReservations,
    activeReservations,
    pendingReservations,
    totalRevenue: totalRevenueAgg._sum.amount ?? 0,
  };
};

export const updateMyRestaurant = async (
  adminId: string,
  data: {
    name?: string;
    description?: string;
    address?: string;
    area?: string;
    phone?: string;
    email?: string;
    website?: string;
    cuisineTypes?: string[];
    priceRange?: "BUDGET" | "MODERATE" | "EXPENSIVE" | "FINE_DINING";
    openingHours?: object;
    imageUrls?: string[];
    profileImageUrl?: string | null;
    coverImageUrl?: string | null;
    isActive?: boolean;
    latitude?: number;
    longitude?: number;
    socialMedia?: object;
    totalSeats?: number;
    maxCapacity?: number;
  },
) => {
  const restaurant = await prisma.restaurant.findFirst({ where: { adminId } });
  if (!restaurant) throw Object.assign(new Error("Restaurant not found"), { status: 404 });
  const updateData: Record<string, unknown> = { ...data };
  if (data.cuisineTypes) updateData.cuisineTypes = JSON.stringify(data.cuisineTypes);
  if (data.imageUrls !== undefined) updateData.imageUrls = JSON.stringify(data.imageUrls);
  return prisma.restaurant.update({ where: { id: restaurant.id }, data: updateData });
};

export const getMyReservations = async (
  adminId: string,
  opts: { page?: number; limit?: number; status?: string; from?: string; to?: string } = {},
) => {
  const page = opts.page ?? 1;
  const limit = opts.limit ?? 25;
  const skip = (page - 1) * limit;

  const restaurant = await prisma.restaurant.findFirst({ where: { adminId } });
  if (!restaurant) return { data: [], total: 0, page, limit };

  const where = {
    restaurantId: restaurant.id,
    ...(opts.status ? { status: opts.status as never } : {}),
    ...(opts.from || opts.to
      ? {
          date: {
            ...(opts.from ? { gte: new Date(opts.from) } : {}),
            ...(opts.to ? { lte: new Date(opts.to) } : {}),
          },
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.reservation.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        payment: { select: { orderItems: true, amount: true, status: true } },
        review: { select: { id: true, rating: true, comment: true, imageUrls: true, createdAt: true } },
      },
      orderBy: { date: "desc" },
      skip,
      take: limit,
    }),
    prisma.reservation.count({ where }),
  ]);

  return { data, total, page, limit };
};

export const getMyMenu = async (adminId: string) => {
  const restaurant = await prisma.restaurant.findFirst({ where: { adminId } });
  if (!restaurant) return [];
  return prisma.menuItem.findMany({
    where: { restaurantId: restaurant.id },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
};

// ── reservation mutations ─────────────────────────────────────────────────────

const VALID_STATUSES = ["PENDING", "CONFIRMED", "CHECKED_IN", "CANCELLED", "COMPLETED", "NO_SHOW"] as const;
type ReservationStatus = (typeof VALID_STATUSES)[number];

const ALLOWED_STATUS_TRANSITIONS: Record<ReservationStatus, ReservationStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["CHECKED_IN", "COMPLETED", "CANCELLED", "NO_SHOW"],
  CHECKED_IN: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
};

export const updateReservationStatus = async (
  adminId: string,
  reservationId: string,
  status: ReservationStatus,
) => {
  const restaurant = await prisma.restaurant.findFirst({ where: { adminId } });
  if (!restaurant) throw Object.assign(new Error("Restaurant not found"), { status: 404 });
  const reservation = await prisma.reservation.findFirst({
    where: { id: reservationId, restaurantId: restaurant.id },
    include: { payment: true, user: true },
  });
  if (!reservation) throw Object.assign(new Error("Reservation not found"), { status: 404 });
  const allowedTransitions = ALLOWED_STATUS_TRANSITIONS[reservation.status as ReservationStatus] ?? [];
  if (!allowedTransitions.includes(status)) {
    throw Object.assign(
      new Error(`Cannot change reservation from ${reservation.status} to ${status}`),
      { status: 409 },
    );
  }
  if (status === "CONFIRMED" && reservation.payment?.status !== "SUCCEEDED") {
    throw Object.assign(
      new Error("Payment must be completed before this reservation can be confirmed"),
      { status: 409 },
    );
  }

  const refund = status === "CANCELLED"
    ? await refundReservationPayment(reservationId, "RESTAURANT_CANCELLATION")
    : null;

  const transition = await prisma.reservation.updateMany({
    where: { id: reservationId, status: reservation.status },
    data: {
      status,
      ...(status === "CANCELLED" ? {
        cancelledAt: new Date(),
        cancelledBy: "RESTAURANT",
        cancellationReason: "RESTAURANT_CANCELLED",
        holdExpiresAt: null,
      } : {}),
      ...(["CONFIRMED", "CANCELLED"].includes(status) ? { confirmationExpiresAt: null } : {}),
    },
  });
  if (transition.count === 0) {
    throw Object.assign(
      new Error("This reservation changed while you were updating it. Refresh and try again."),
      { status: 409 },
    );
  }
  const updated = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: { payment: true },
  });
  if (!updated) throw Object.assign(new Error("Reservation not found"), { status: 404 });

  const customerMessage = status === "CANCELLED"
    ? refund?.status === "REFUNDED" || refund?.status === "ALREADY_REFUNDED"
      ? `${restaurant.name} cancelled your reservation. A full refund of LKR ${refund.amount.toLocaleString()} was submitted to Stripe.`
      : `${restaurant.name} cancelled your reservation.`
    : status === "CONFIRMED"
      ? `${restaurant.name} accepted your booking. Your table is confirmed.`
      : `Your reservation at ${restaurant.name} is now ${status.replaceAll("_", " ").toLowerCase()}.`;
  createNotification(
    reservation.userId,
    status === "CANCELLED" ? "RESERVATION_CANCELLED" : "RESERVATION_CONFIRMED",
    status === "CANCELLED"
      ? "Reservation cancelled"
      : status === "CONFIRMED"
        ? "Reservation confirmed"
        : "Reservation updated",
    customerMessage,
    { reservationId, restaurantId: restaurant.id, status },
  ).catch(() => {});

  if (status === "CONFIRMED") {
    const date = reservation.date.toISOString().split("T")[0];
    awardLoyaltyPoints(
      reservation.userId,
      100,
      "EARN_RESERVATION",
      `Reservation at ${restaurant.name}`,
      reservation.id,
    ).catch(() => {});

    adminFirestore.collection("reservations").doc(reservation.id).set({
      userId: reservation.userId,
      restaurantId: restaurant.id,
      date,
      time: reservation.time,
      partySize: reservation.partySize,
      status: "CONFIRMED",
      updatedAt: new Date().toISOString(),
    }, { merge: true }).catch((error) => console.error("Firestore confirmation sync failed:", error));

    sendEmail(
      reservation.user.email,
      `Reservation confirmed — ${restaurant.name}`,
      `<h2>Your table is confirmed</h2>
       <p><strong>Restaurant:</strong> ${restaurant.name}</p>
       <p><strong>Date:</strong> ${date}</p>
       <p><strong>Time:</strong> ${reservation.time}</p>
       <p><strong>Party size:</strong> ${reservation.partySize}</p>`,
    ).catch((error) => console.error("Restaurant confirmation email failed:", error));
  }

  return { ...updated, refundOutcome: refund };
};

export const checkInReservation = async (adminId: string, reservationId: string) => {
  const restaurant = await prisma.restaurant.findFirst({ where: { adminId } });
  if (!restaurant) throw Object.assign(new Error("Restaurant not found"), { status: 404 });
  const reservation = await prisma.reservation.findFirst({
    where: { id: reservationId, restaurantId: restaurant.id, status: "CONFIRMED" },
  });
  if (!reservation) {
    throw Object.assign(new Error("Reservation not found or not CONFIRMED"), { status: 404 });
  }
  return prisma.reservation.update({ where: { id: reservationId }, data: { status: "CHECKED_IN" } });
};

// ── reviews ───────────────────────────────────────────────────────────────────

export const getMyReviews = async (
  adminId: string,
  opts: { page?: number; limit?: number; rating?: number } = {},
) => {
  const page = opts.page ?? 1;
  const limit = opts.limit ?? 25;
  const skip = (page - 1) * limit;

  const restaurant = await prisma.restaurant.findFirst({ where: { adminId } });
  if (!restaurant) return { data: [], total: 0, page, limit, avgRating: null };

  const where = {
    restaurantId: restaurant.id,
    ...(opts.rating ? { rating: opts.rating } : {}),
  };

  const [data, total] = await Promise.all([
    prisma.review.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
        reservation: { select: { date: true, time: true } },
        reply: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.review.count({ where }),
  ]);

  return { data, total, page, limit, avgRating: restaurant.avgRating, totalReviews: restaurant.totalReviews };
};

export const replyToReview = async (adminId: string, reviewId: string, reply: string) => {
  const restaurant = await prisma.restaurant.findFirst({ where: { adminId } });
  if (!restaurant) throw Object.assign(new Error("Restaurant not found"), { status: 404 });
  const review = await prisma.review.findFirst({ where: { id: reviewId, restaurantId: restaurant.id } });
  if (!review) throw Object.assign(new Error("Review not found"), { status: 404 });
  const result = await prisma.reviewReply.upsert({
    where: { reviewId },
    create: { reviewId, restaurantId: restaurant.id, reply },
    update: { reply },
  });
  createNotification(
    review.userId,
    "REVIEW_RECEIVED",
    "Restaurant replied to your review",
    `${restaurant.name} has responded to your review.`,
    { restaurantId: restaurant.id, reviewId },
  ).catch(() => {});
  return result;
};

// ── payments ──────────────────────────────────────────────────────────────────

export const getMyPayments = async (
  adminId: string,
  opts: { page?: number; limit?: number; status?: string } = {},
) => {
  const page = opts.page ?? 1;
  const limit = opts.limit ?? 25;
  const skip = (page - 1) * limit;

  const restaurant = await prisma.restaurant.findFirst({ where: { adminId } });
  if (!restaurant) return { data: [], total: 0, page, limit };

  const where = {
    reservation: { restaurantId: restaurant.id },
    ...(opts.status ? { status: opts.status as never } : {}),
  };

  const [data, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        reservation: { select: { id: true, date: true, time: true, partySize: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.payment.count({ where }),
  ]);

  return { data, total, page, limit };
};

// ── availability ──────────────────────────────────────────────────────────────

export interface AvailabilitySlot {
  time: string;
  capacity: number;
  bookedSeats: number;
  remainingSeats?: number;
  available: boolean;
  isBlocked: boolean;
  note?: string | null;
}

export const getAvailabilityForDate = async (adminId: string, date: string): Promise<AvailabilitySlot[]> => {
  const restaurant = await prisma.restaurant.findFirst({ where: { adminId } });
  if (!restaurant) return [];
  const slots = await getSlotCapacity(restaurant.id, date);
  return (slots ?? []).map((slot) => ({
    time: slot.time,
    capacity: slot.maxCapacity,
    bookedSeats: slot.bookedSeats,
    remainingSeats: slot.remainingSeats,
    available: slot.available,
    isBlocked: slot.isBlocked,
    note: slot.reason,
  }));
};

export const setAvailabilityForDate = async (
  adminId: string,
  date: string,
  slots: AvailabilitySlot[],
) => {
  const restaurant = await prisma.restaurant.findFirst({ where: { adminId } });
  if (!restaurant) throw Object.assign(new Error("Restaurant not found"), { status: 404 });
  const uniqueTimes = new Set<string>();
  for (const slot of slots) {
    if (!/^\d{2}:\d{2}$/.test(slot.time)) {
      throw Object.assign(new Error(`Invalid time: ${slot.time}`), { status: 400 });
    }
    if (uniqueTimes.has(slot.time)) {
      throw Object.assign(new Error(`Duplicate time slot: ${slot.time}`), { status: 400 });
    }
    if (!Number.isInteger(slot.capacity) || slot.capacity < 1 || slot.capacity > 10_000) {
      throw Object.assign(new Error(`Invalid capacity for ${slot.time}`), { status: 400 });
    }
    uniqueTimes.add(slot.time);
  }

  const dateValue = new Date(date);
  await prisma.$transaction(async (tx) => {
    await tx.restaurantSlotOverride.deleteMany({
      where: { restaurantId: restaurant.id, date: dateValue },
    });
    if (slots.length) {
      await tx.restaurantSlotOverride.createMany({
        data: slots.map((slot) => ({
          restaurantId: restaurant.id,
          date: dateValue,
          time: slot.time,
          capacity: slot.capacity,
          isBlocked: slot.isBlocked || !slot.available,
          note: slot.note?.trim() || null,
        })),
      });
    }
  });

  // Keep Firestore as a compatibility mirror; PostgreSQL is authoritative.
  await adminFirestore
    .collection("restaurants")
    .doc(restaurant.id)
    .collection("availability")
    .doc(date)
    .set({ slots, updatedAt: new Date().toISOString(), source: "postgres" })
    .catch((error) => console.error("Availability Firestore mirror failed (non-fatal):", error));
  return { restaurantId: restaurant.id, date, slots };
};

// ── physical tables ─────────────────────────────────────────────────────────

export const getMyTables = async (adminId: string) => {
  const restaurant = await prisma.restaurant.findFirst({ where: { adminId } });
  if (!restaurant) return [];
  return prisma.restaurantTable.findMany({
    where: { restaurantId: restaurant.id },
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
  });
};

export const createTable = async (
  adminId: string,
  input: { name: string; capacity: number; isActive?: boolean },
) => {
  const restaurant = await prisma.restaurant.findFirst({ where: { adminId } });
  if (!restaurant) throw Object.assign(new Error("Restaurant not found"), { status: 404 });
  const name = input.name.trim();
  if (!name || !Number.isInteger(input.capacity) || input.capacity < 1 || input.capacity > 100) {
    throw Object.assign(new Error("A table name and capacity from 1 to 100 are required"), { status: 400 });
  }
  return prisma.restaurantTable.create({
    data: { restaurantId: restaurant.id, name, capacity: input.capacity, isActive: input.isActive ?? true },
  });
};

export const updateTable = async (
  adminId: string,
  tableId: string,
  input: { name?: string; capacity?: number; isActive?: boolean },
) => {
  const restaurant = await prisma.restaurant.findFirst({ where: { adminId } });
  if (!restaurant) throw Object.assign(new Error("Restaurant not found"), { status: 404 });
  const table = await prisma.restaurantTable.findFirst({ where: { id: tableId, restaurantId: restaurant.id } });
  if (!table) throw Object.assign(new Error("Table not found"), { status: 404 });
  if (input.capacity !== undefined && (!Number.isInteger(input.capacity) || input.capacity < 1 || input.capacity > 100)) {
    throw Object.assign(new Error("Capacity must be from 1 to 100"), { status: 400 });
  }
  return prisma.restaurantTable.update({
    where: { id: tableId },
    data: {
      ...(input.name !== undefined && { name: input.name.trim() }),
      ...(input.capacity !== undefined && { capacity: input.capacity }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
    },
  });
};

export const deleteTable = async (adminId: string, tableId: string) => {
  const restaurant = await prisma.restaurant.findFirst({ where: { adminId } });
  if (!restaurant) throw Object.assign(new Error("Restaurant not found"), { status: 404 });
  const result = await prisma.restaurantTable.deleteMany({ where: { id: tableId, restaurantId: restaurant.id } });
  if (!result.count) throw Object.assign(new Error("Table not found"), { status: 404 });
};

// ── promotions ────────────────────────────────────────────────────────────────

interface PromotionInput {
  title: string;
  description: string;
  type: "DISCOUNT" | "HAPPY_HOUR" | "SPECIAL_EVENT" | "SEASONAL" | "COUPON";
  discountValue?: number;
  startDate: string;
  endDate: string;
  isActive?: boolean;
  imageUrl?: string;
  menuItemIds?: string[];
}

const promotionMenuInclude = {
  menuItems: { include: { menuItem: true } },
} as const;

const serializePromotion = <T extends { menuItems: { menuItem: unknown }[] }>(promotion: T) => ({
  ...promotion,
  menuItems: promotion.menuItems.map((entry) => entry.menuItem),
});

const validatePromotionMenuItems = async (restaurantId: string, ids: string[] = []) => {
  const menuItemIds = [...new Set(ids.filter(Boolean))];
  if (menuItemIds.length === 0) return menuItemIds;
  const ownedCount = await prisma.menuItem.count({
    where: { restaurantId, id: { in: menuItemIds } },
  });
  if (ownedCount !== menuItemIds.length) {
    throw Object.assign(new Error("One or more menu items do not belong to this restaurant"), { status: 400 });
  }
  return menuItemIds;
};

const promotionDate = (value: string, endOfDay = false) => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`);
  }
  return new Date(value);
};

const validateMenuDiscount = (menuItemIds: string[], discountValue?: number | null) => {
  if (menuItemIds.length > 0 && (!discountValue || discountValue <= 0 || discountValue > 100)) {
    throw Object.assign(new Error("Select a discount between 1 and 100 percent for menu items"), { status: 400 });
  }
};

export const getMyPromotions = async (adminId: string) => {
  const restaurant = await prisma.restaurant.findFirst({ where: { adminId } });
  if (!restaurant) return [];
  const promotions = await prisma.promotion.findMany({
    where: { restaurantId: restaurant.id },
    orderBy: { createdAt: "desc" },
    include: promotionMenuInclude,
  });
  return promotions.map(serializePromotion);
};

export const createPromotion = async (adminId: string, input: PromotionInput) => {
  const restaurant = await prisma.restaurant.findFirst({ where: { adminId } });
  if (!restaurant) throw Object.assign(new Error("Restaurant not found"), { status: 404 });
  const menuItemIds = await validatePromotionMenuItems(restaurant.id, input.menuItemIds);
  validateMenuDiscount(menuItemIds, input.discountValue);
  const promotion = await prisma.promotion.create({
    data: {
      restaurantId: restaurant.id,
      title: input.title,
      description: input.description,
      type: input.type,
      discountValue: input.discountValue ?? null,
      startDate: promotionDate(input.startDate),
      endDate: promotionDate(input.endDate, true),
      isActive: input.isActive ?? true,
      imageUrl: input.imageUrl ?? null,
      menuItems: {
        create: menuItemIds.map((menuItemId) => ({ menuItem: { connect: { id: menuItemId } } })),
      },
    },
    include: promotionMenuInclude,
  });
  return serializePromotion(promotion);
};

export const updatePromotion = async (
  adminId: string,
  promotionId: string,
  input: Partial<PromotionInput>,
) => {
  const restaurant = await prisma.restaurant.findFirst({ where: { adminId } });
  if (!restaurant) throw Object.assign(new Error("Restaurant not found"), { status: 404 });
  const promo = await prisma.promotion.findFirst({
    where: { id: promotionId, restaurantId: restaurant.id },
  });
  if (!promo) throw Object.assign(new Error("Promotion not found"), { status: 404 });
  const menuItemIds = input.menuItemIds !== undefined
    ? await validatePromotionMenuItems(restaurant.id, input.menuItemIds)
    : undefined;
  if (menuItemIds !== undefined) validateMenuDiscount(menuItemIds, input.discountValue ?? promo.discountValue);
  const promotion = await prisma.promotion.update({
    where: { id: promotionId },
    data: {
      ...(input.title && { title: input.title }),
      ...(input.description && { description: input.description }),
      ...(input.type && { type: input.type }),
      ...(input.discountValue !== undefined && { discountValue: input.discountValue }),
      ...(input.startDate && { startDate: promotionDate(input.startDate) }),
      ...(input.endDate && { endDate: promotionDate(input.endDate, true) }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
      ...(input.imageUrl !== undefined && { imageUrl: input.imageUrl }),
      ...(menuItemIds !== undefined && {
        menuItems: {
          deleteMany: {},
          create: menuItemIds.map((menuItemId) => ({ menuItem: { connect: { id: menuItemId } } })),
        },
      }),
    },
    include: promotionMenuInclude,
  });
  return serializePromotion(promotion);
};

export const deletePromotion = async (adminId: string, promotionId: string) => {
  const restaurant = await prisma.restaurant.findFirst({ where: { adminId } });
  if (!restaurant) throw Object.assign(new Error("Restaurant not found"), { status: 404 });
  const promo = await prisma.promotion.findFirst({
    where: { id: promotionId, restaurantId: restaurant.id },
  });
  if (!promo) throw Object.assign(new Error("Promotion not found"), { status: 404 });
  return prisma.promotion.delete({ where: { id: promotionId } });
};

// ── analytics ─────────────────────────────────────────────────────────────────

export const getPortalAnalytics = async (adminId: string) => {
  const restaurant = await prisma.restaurant.findFirst({ where: { adminId } });
  if (!restaurant) return null;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [reservationsByTime, payments, menuRevenue, statusBreakdown] = await Promise.all([
    prisma.reservation.groupBy({
      by: ["time"],
      where: { restaurantId: restaurant.id },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    }),
    prisma.payment.findMany({
      where: {
        reservation: { restaurantId: restaurant.id },
        status: "SUCCEEDED",
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { amount: true, orderItems: true, createdAt: true },
    }),
    prisma.payment.findMany({
      where: { reservation: { restaurantId: restaurant.id }, status: "SUCCEEDED" },
      select: { orderItems: true },
    }),
    prisma.reservation.groupBy({
      by: ["status"],
      where: { restaurantId: restaurant.id },
      _count: { id: true },
    }),
  ]);

  const itemTally: Record<string, { name: string; count: number; revenue: number }> = {};
  for (const p of menuRevenue) {
    const items = p.orderItems as Array<{ name: string; price: number; quantity: number }> | null;
    if (!items) continue;
    for (const item of items) {
      if (!itemTally[item.name]) itemTally[item.name] = { name: item.name, count: 0, revenue: 0 };
      itemTally[item.name].count += item.quantity;
      itemTally[item.name].revenue += item.price * item.quantity;
    }
  }
  const topMenuItems = Object.values(itemTally)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);
  const totalRevenue = payments.reduce((s, p) => s + p.amount, 0);

  return {
    peakHours: reservationsByTime.slice(0, 10).map((r) => ({ time: r.time, count: r._count.id })),
    totalRevenue,
    topMenuItems,
    statusBreakdown: statusBreakdown.map((r) => ({ status: r.status, count: r._count.id })),
  };
};

// ── portal AI assistant ───────────────────────────────────────────────────────

export interface PortalAIMessage {
  role: "user" | "assistant";
  content: string;
}

export const askPortalAI = async (
  adminId: string,
  message: string,
  history: PortalAIMessage[] = [],
): Promise<string> => {
  const restaurant = await prisma.restaurant.findFirst({ where: { adminId } });
  if (!restaurant) throw Object.assign(new Error("Restaurant not found"), { status: 404 });

  // Gather context from existing analytics functions
  const [stats, analytics] = await Promise.all([
    getMyStats(adminId),
    getPortalAnalytics(adminId),
  ]);

  const context = {
    restaurantName: restaurant.name,
    avgRating: restaurant.avgRating,
    totalRevenue: analytics?.totalRevenue ?? 0,
    totalReservations: stats?.totalReservations ?? 0,
    activeReservations: stats?.activeReservations ?? 0,
    peakHours: analytics?.peakHours ?? [],
    topMenuItems: analytics?.topMenuItems ?? [],
    statusBreakdown: analytics?.statusBreakdown ?? [],
  };

  const AI_SERVICE_URL = process.env.AI_SERVICE_URL ?? "http://localhost:8000";
  const response = await fetch(`${AI_SERVICE_URL}/portal/message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history, context }),
  });

  if (!response.ok) {
    throw Object.assign(new Error("AI service unavailable"), { status: 503 });
  }

  const data = await response.json() as { message: string };
  return data.message;
};

// ── menu mutations ────────────────────────────────────────────────────────────

interface MenuItemInput {
  name: string;
  description?: string | null;
  price: number;
  category: string;
  dietaryInfo?: string[];
  isAvailable?: boolean;
  imageUrl?: string | null;
}

export const createMenuItem = async (adminId: string, input: MenuItemInput) => {
  const restaurant = await prisma.restaurant.findFirst({ where: { adminId } });
  if (!restaurant) throw Object.assign(new Error("Restaurant not found"), { status: 404 });
  return prisma.menuItem.create({
    data: {
      restaurantId: restaurant.id,
      name: input.name,
      description: input.description ?? null,
      price: input.price,
      category: input.category,
      dietaryInfo: JSON.stringify(input.dietaryInfo ?? []),
      isAvailable: input.isAvailable ?? true,
      imageUrl: input.imageUrl ?? null,
    },
  });
};

export const updateMenuItem = async (
  adminId: string,
  itemId: string,
  input: Partial<MenuItemInput>,
) => {
  const restaurant = await prisma.restaurant.findFirst({ where: { adminId } });
  if (!restaurant) throw Object.assign(new Error("Restaurant not found"), { status: 404 });
  const item = await prisma.menuItem.findFirst({ where: { id: itemId, restaurantId: restaurant.id } });
  if (!item) throw Object.assign(new Error("Menu item not found"), { status: 404 });
  const data: Record<string, unknown> = { ...input };
  if (input.dietaryInfo !== undefined) data.dietaryInfo = JSON.stringify(input.dietaryInfo);
  return prisma.menuItem.update({ where: { id: itemId }, data });
};

export const deleteMenuItem = async (adminId: string, itemId: string) => {
  const restaurant = await prisma.restaurant.findFirst({ where: { adminId } });
  if (!restaurant) throw Object.assign(new Error("Restaurant not found"), { status: 404 });
  const item = await prisma.menuItem.findFirst({ where: { id: itemId, restaurantId: restaurant.id } });
  if (!item) throw Object.assign(new Error("Menu item not found"), { status: 404 });
  return prisma.menuItem.delete({ where: { id: itemId } });
};

export const getMyHolidays = async (adminId: string) => {
  const restaurant = await prisma.restaurant.findFirst({ where: { adminId } });
  if (!restaurant) return [];
  return prisma.restaurantHoliday.findMany({
    where: { restaurantId: restaurant.id },
    orderBy: { date: "asc" },
  });
};

export interface ClosureInput {
  date: string;
  endDate?: string;
  allDay?: boolean;
  startTime?: string;
  endTime?: string;
  reason?: string;
}

export const addHoliday = async (adminId: string, input: ClosureInput) => {
  const restaurant = await prisma.restaurant.findFirst({ where: { adminId } });
  if (!restaurant) throw Object.assign(new Error("Restaurant not found"), { status: 404 });
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
  if (!datePattern.test(input.date) || (input.endDate && !datePattern.test(input.endDate))) {
    throw Object.assign(new Error("Valid start and end dates are required"), { status: 400 });
  }
  const startDate = new Date(`${input.date}T00:00:00.000Z`);
  const endDate = new Date(`${input.endDate ?? input.date}T00:00:00.000Z`);
  if (endDate < startDate) {
    throw Object.assign(new Error("End date cannot be before start date"), { status: 400 });
  }
  const allDay = input.allDay ?? true;
  if (!allDay) {
    if (!input.startTime || !input.endTime || !timePattern.test(input.startTime) || !timePattern.test(input.endTime)) {
      throw Object.assign(new Error("Valid start and end times are required for a partial-day closure"), { status: 400 });
    }
    if (input.endTime <= input.startTime) {
      throw Object.assign(new Error("End time must be later than start time"), { status: 400 });
    }
  }
  return prisma.restaurantHoliday.upsert({
    where: { restaurantId_date: { restaurantId: restaurant.id, date: startDate } },
    create: {
      restaurantId: restaurant.id,
      date: startDate,
      endDate,
      allDay,
      startTime: allDay ? null : input.startTime,
      endTime: allDay ? null : input.endTime,
      reason: input.reason?.trim() || null,
    },
    update: {
      endDate,
      allDay,
      startTime: allDay ? null : input.startTime,
      endTime: allDay ? null : input.endTime,
      reason: input.reason?.trim() || null,
    },
  });
};

export const removeHoliday = async (adminId: string, date: string) => {
  const restaurant = await prisma.restaurant.findFirst({ where: { adminId } });
  if (!restaurant) throw Object.assign(new Error("Restaurant not found"), { status: 404 });
  await prisma.restaurantHoliday.deleteMany({
    where: { restaurantId: restaurant.id, date: new Date(date) },
  });
};
