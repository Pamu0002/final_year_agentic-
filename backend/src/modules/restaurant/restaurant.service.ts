import { prisma } from "../../../lib/db.js";
import { adminFirestore } from "../../config/firebase.js";
import type { PriceRange, Restaurant, RestaurantHoliday } from "../../../generated/prisma/client.js";
import type { z } from "zod";
import type {
  RestaurantQuerySchema,
  CreateRestaurantBodySchema,
  UpdateRestaurantBodySchema,
  ReviewQuerySchema,
} from "./restaurant.schema.js";
import { ACTIVE_CAPACITY_STATUSES, getMatchingClosure, getOpeningTimeSlots } from "../reservation/availability.js";
import { RESERVATION_DEPOSIT_LKR } from "../../config/payments.js";

export type RestaurantFilters = Partial<z.infer<typeof RestaurantQuerySchema>>;
export type CreateRestaurantInput = z.infer<typeof CreateRestaurantBodySchema>;
export type UpdateRestaurantInput = z.infer<typeof UpdateRestaurantBodySchema>;
export type ReviewQueryInput = z.infer<typeof ReviewQuerySchema>;

const COLOMBO_TIME_ZONE = "Asia/Colombo";

const getColomboDateAndTime = () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: COLOMBO_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return {
    date: `${value("year")}-${value("month")}-${value("day")}`,
    time: `${value("hour")}:${value("minute")}`,
  };
};

const getTodayClosureQuery = (today: Date) => ({
  holidays: {
    where: {
      date: { lte: today },
      OR: [
        { date: today, endDate: null },
        { endDate: { gte: today } },
      ],
    },
    orderBy: { date: "asc" as const },
  },
});

const withClosureStatus = (record: Restaurant & { holidays: RestaurantHoliday[] }, currentTime: string) => {
  const { holidays, ...restaurant } = record;
  const activeClosure = getMatchingClosure(holidays, currentTime);
  const scheduledClosure = activeClosure ?? holidays[0];

  if (!scheduledClosure) {
    return { ...parseRestaurant(restaurant), closureStatus: null };
  }

  const isClosedNow = Boolean(activeClosure);
  const label = scheduledClosure.allDay
    ? "Closed today"
    : isClosedNow
      ? `Closed until ${scheduledClosure.endTime}`
      : `Closed ${scheduledClosure.startTime}-${scheduledClosure.endTime}`;

  return {
    ...parseRestaurant(restaurant),
    closureStatus: {
      isClosedNow,
      allDay: scheduledClosure.allDay,
      label,
      reason: scheduledClosure.reason,
      startTime: scheduledClosure.startTime,
      endTime: scheduledClosure.endTime,
      startDate: scheduledClosure.date.toISOString().slice(0, 10),
      endDate: (scheduledClosure.endDate ?? scheduledClosure.date).toISOString().slice(0, 10),
    },
  };
};

// Haversine distance in km between two lat/lng points.
const distanceKm = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const listRestaurants = async (filters: RestaurantFilters = {}) => {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;
  const skip = (page - 1) * limit;
  const colomboNow = getColomboDateAndTime();
  const today = new Date(`${colomboNow.date}T00:00:00.000Z`);
  const closureInclude = getTodayClosureQuery(today);

  const where: Record<string, unknown> = { isActive: true };
  if (filters.area) where["area"] = { contains: filters.area, mode: "insensitive" };
  if (filters.priceRange) where["priceRange"] = filters.priceRange as PriceRange;
  if (filters.cuisine) where["cuisineTypes"] = { contains: filters.cuisine, mode: "insensitive" };
  if (filters.minRating) where["avgRating"] = { gte: filters.minRating };
  if (filters.search) {
    where["OR"] = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { description: { contains: filters.search, mode: "insensitive" } },
      { area: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  // "Near me" mode: distance can't be computed in SQL without a spatial
  // extension, and the dataset is small (city-scale, single-digit
  // thousands at most), so sort by computed distance in JS instead.
  if (filters.lat != null && filters.lng != null) {
    const { lat, lng, radiusKm } = filters;
    const all = await prisma.restaurant.findMany({
      where: { ...where, latitude: { not: null }, longitude: { not: null } },
      include: closureInclude,
    });
    const withDistance = all
      .map((r) => ({ ...r, distanceKm: distanceKm(lat, lng, r.latitude!, r.longitude!) }))
      .filter((r) => radiusKm == null || r.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    const total = withDistance.length;
    const page_ = withDistance.slice(skip, skip + limit);
    return {
      data: page_.map((r) => ({
        ...withClosureStatus(r, colomboNow.time),
        distanceKm: Math.round(r.distanceKm * 10) / 10,
      })),
      total,
      page,
      limit,
    };
  }

  const [restaurants, total] = await Promise.all([
    prisma.restaurant.findMany({
      where,
      include: closureInclude,
      orderBy: { avgRating: "desc" },
      skip,
      take: limit,
    }),
    prisma.restaurant.count({ where }),
  ]);

  return {
    data: restaurants.map((restaurant) => withClosureStatus(restaurant, colomboNow.time)),
    total,
    page,
    limit,
  };
};

export const getRestaurantById = async (id: string) => {
  const r = await prisma.restaurant.findUnique({ where: { id } });
  return r ? parseRestaurant(r) : null;
};

export const createRestaurant = async (input: CreateRestaurantInput, adminId: string) => {
  const r = await prisma.restaurant.create({
    data: {
      ...input,
      adminId,
      cuisineTypes: JSON.stringify(input.cuisineTypes),
      imageUrls: JSON.stringify(input.imageUrls),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      openingHours: JSON.parse(JSON.stringify(input.openingHours)),
    },
  });
  return parseRestaurant(r);
};

export const updateRestaurant = async (id: string, input: UpdateRestaurantInput) => {
  const data: Record<string, unknown> = { ...input };
  if (input.cuisineTypes) data["cuisineTypes"] = JSON.stringify(input.cuisineTypes);
  if (input.imageUrls) data["imageUrls"] = JSON.stringify(input.imageUrls);
  const r = await prisma.restaurant.update({ where: { id }, data });
  return parseRestaurant(r);
};

export const getAvailability = async (restaurantId: string, date: string): Promise<unknown[]> => {
  const doc = await adminFirestore
    .collection("restaurants")
    .doc(restaurantId)
    .collection("availability")
    .doc(date)
    .get();
  return doc.exists ? (doc.data()?.slots ?? []) : [];
};

export const getSlotCapacity = async (restaurantId: string, date: string, partySize?: number) => {
  const dateValue = new Date(date);
  const now = new Date();
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    include: { tables: { where: { isActive: true }, select: { capacity: true } } },
  });
  if (!restaurant) return null;

  const [reservations, closures, overrides] = await Promise.all([
    prisma.reservation.findMany({
      where: {
        restaurantId,
        date: dateValue,
        OR: [
          { status: { in: [...ACTIVE_CAPACITY_STATUSES] } },
          {
            status: "PENDING",
            OR: [
              { holdExpiresAt: { gt: now } },
              { confirmationExpiresAt: { gt: now } },
            ],
          },
        ],
      },
      select: { time: true, partySize: true },
    }),
    prisma.restaurantHoliday.findMany({
      where: {
        restaurantId,
        date: { lte: dateValue },
        OR: [
          { endDate: null, date: dateValue },
          { endDate: { gte: dateValue } },
        ],
      },
    }),
    prisma.restaurantSlotOverride.findMany({ where: { restaurantId, date: dateValue } }),
  ]);

  const bookedByTime = new Map<string, number>();
  for (const r of reservations) {
    bookedByTime.set(r.time, (bookedByTime.get(r.time) ?? 0) + r.partySize);
  }

  const needed = partySize ?? 1;
  const tableCapacity = restaurant.tables.reduce((sum, table) => sum + table.capacity, 0);
  const baseCapacity = tableCapacity || restaurant.maxCapacity;
  const openingSlots = getOpeningTimeSlots(restaurant.openingHours, date);
  const overridesByTime = new Map(overrides.map((override) => [override.time, override]));
  const times = [...new Set([...openingSlots, ...overrides.map((override) => override.time)])].sort();

  return times.map((time) => {
    const bookedSeats = bookedByTime.get(time) ?? 0;
    const override = overridesByTime.get(time);
    const maxCapacity = override?.capacity ?? baseCapacity;
    const remainingSeats = Math.max(0, maxCapacity - bookedSeats);
    const closure = getMatchingClosure(closures, time);
    const isBlocked = Boolean(closure || override?.isBlocked);
    return {
      time,
      bookedSeats,
      remainingSeats,
      maxCapacity,
      available: !isBlocked && remainingSeats >= needed,
      isBlocked,
      reason: closure?.reason ?? override?.note ?? (isBlocked ? "Unavailable" : null),
    };
  });
};

export const getMenu = async (restaurantId: string) => {
  return prisma.menuItem.findMany({
    where: { restaurantId, isAvailable: true },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
};

export const getRestaurantReviews = async (restaurantId: string, opts: ReviewQueryInput) => {
  const page = opts.page ?? 1;
  const limit = opts.limit ?? 10;
  const skip = (page - 1) * limit;
  const where = {
    restaurantId,
    isVisible: true,
    ...(opts.rating ? { rating: opts.rating } : {}),
  };
  const [data, total, avgAgg] = await Promise.all([
    prisma.review.findMany({
      where,
      include: {
        user: { select: { name: true, avatarUrl: true } },
        reply: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.review.count({ where }),
    prisma.review.aggregate({ where: { restaurantId, isVisible: true }, _avg: { rating: true } }),
  ]);
  return { data, total, page, limit, avgRating: avgAgg._avg.rating };
};

export const getActivePromotions = async (restaurantId: string) => {
  const now = new Date();
  const promotions = await prisma.promotion.findMany({
    where: { restaurantId, isActive: true, startDate: { lte: now }, endDate: { gte: now } },
    orderBy: { createdAt: "desc" },
    include: { menuItems: { include: { menuItem: true } } },
  });
  return promotions.map((promotion) => ({
    ...promotion,
    menuItems: promotion.menuItems.map((entry) => entry.menuItem),
  }));
};

export const getAllActivePromotions = async () => {
  const now = new Date();
  const promotions = await prisma.promotion.findMany({
    where: { isActive: true, startDate: { lte: now }, endDate: { gte: now } },
    orderBy: { createdAt: "desc" },
    include: {
      restaurant: {
        select: { id: true, name: true, area: true, cuisineTypes: true, imageUrls: true, priceRange: true },
      },
      menuItems: { include: { menuItem: true } },
    },
  });
  return promotions.map((p) => ({
    ...p,
    menuItems: p.menuItems.map((entry) => entry.menuItem),
    restaurant: {
      ...p.restaurant,
      cuisineTypes: JSON.parse(p.restaurant.cuisineTypes) as string[],
      imageUrls: JSON.parse(p.restaurant.imageUrls) as string[],
    },
  }));
};

// ── helper ────────────────────────────────────────────────────────────────────

const parseRestaurant = (r: Restaurant) => ({
  ...r,
  cuisineTypes: JSON.parse(r.cuisineTypes) as string[],
  imageUrls: JSON.parse(r.imageUrls) as string[],
  reservationDeposit: RESERVATION_DEPOSIT_LKR,
});
