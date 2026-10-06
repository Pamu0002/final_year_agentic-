import type { Request, Response } from "express";
import * as adminService from "./admin.service.js";

export const getDashboardStats = async (_req: Request, res: Response): Promise<void> => {
  res.json(await adminService.getDashboardStats());
};

export const getAllRestaurants = async (req: Request, res: Response): Promise<void> => {
  const { page, limit, search, verified, active } = req.query;
  res.json(
    await adminService.getAllRestaurants({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      search: search as string | undefined,
      verified: verified !== undefined ? verified === "true" : undefined,
      active: active !== undefined ? active === "true" : undefined,
    }),
  );
};

export const getRestaurantById = async (req: Request, res: Response): Promise<void> => {
  res.json(await adminService.getRestaurantById(String(req.params.id)));
};

// POST /admin/restaurants/:id/verify — sets isVerified: true
export const verifyRestaurant = async (req: Request, res: Response): Promise<void> => {
  res.json(await adminService.verifyRestaurant(String(req.params.id)));
};

// PATCH /admin/restaurants/:id — general field update (handles isActive toggle too)
export const updateRestaurant = async (req: Request, res: Response): Promise<void> => {
  res.json(await adminService.updateRestaurant(String(req.params.id), req.body as Record<string, unknown>));
};

// PATCH /admin/restaurants/:id/active — legacy route kept for compat
export const toggleRestaurantActive = async (req: Request, res: Response): Promise<void> => {
  res.json(await adminService.toggleRestaurantActive(String(req.params.id), req.body.isActive as boolean));
};

export const createRestaurant = async (req: Request, res: Response): Promise<void> => {
  const restaurant = await adminService.createRestaurant(
    req.body as adminService.CreateRestaurantInput,
    (req as any).user.dbId,
  );
  await adminService.logAdminAction(
    (req as any).user.dbId, (req as any).user.email, "CREATE_RESTAURANT", "Restaurant", restaurant.id, restaurant.name, req.ip,
  );
  res.status(201).json(restaurant);
};

export const deleteRestaurant = async (req: Request, res: Response): Promise<void> => {
  const restaurantId = String(req.params.id);
  await adminService.deleteRestaurant(restaurantId);
  await adminService.logAdminAction(
    (req as any).user.dbId, (req as any).user.email, "DELETE_RESTAURANT", "Restaurant", restaurantId, undefined, req.ip,
  );
  res.status(204).send();
};

export const getAllReservations = async (req: Request, res: Response): Promise<void> => {
  const { page, limit, status, from, to } = req.query;
  res.json(
    await adminService.getAllReservations({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status: status as string | undefined,
      from: from as string | undefined,
      to: to as string | undefined,
    }),
  );
};

export const getAllPayments = async (req: Request, res: Response): Promise<void> => {
  const { page, limit, status, from, to } = req.query;
  res.json(
    await adminService.getAllPayments({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status: status as string | undefined,
      from: from as string | undefined,
      to: to as string | undefined,
    }),
  );
};

export const getPaymentSummary = async (_req: Request, res: Response): Promise<void> => {
  res.json(await adminService.getPaymentSummary());
};

export const getLogs = async (req: Request, res: Response): Promise<void> => {
  const { page, limit, search } = req.query;
  res.json(
    await adminService.getLogs({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      search: search as string | undefined,
    }),
  );
};

export const getSettings = async (_req: Request, res: Response): Promise<void> => {
  res.json(adminService.getSettings());
};

export const updateSettings = async (req: Request, res: Response): Promise<void> => {
  res.json(adminService.updateSettings(req.body as Parameters<typeof adminService.updateSettings>[0]));
};

export const getAnalyticsReservations = async (_req: Request, res: Response): Promise<void> => {
  res.json(await adminService.getAnalyticsReservations());
};

export const getAnalyticsRevenue = async (_req: Request, res: Response): Promise<void> => {
  res.json(await adminService.getAnalyticsRevenue());
};

export const getAnalyticsCuisines = async (_req: Request, res: Response): Promise<void> => {
  res.json(await adminService.getAnalyticsCuisines());
};

export const getAnalyticsUsers = async (_req: Request, res: Response): Promise<void> => {
  res.json(await adminService.getAnalyticsUsers());
};

export const getAnalyticsReservationStatus = async (_req: Request, res: Response): Promise<void> => {
  res.json(await adminService.getAnalyticsReservationStatus());
};

export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  const { page, limit, role } = req.query;
  res.json(
    await adminService.getAllUsers({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      role: role as string | undefined,
    }),
  );
};

export const getUserById = async (req: Request, res: Response): Promise<void> => {
  res.json(await adminService.getUserById(String(req.params.id)));
};

export const updateUserRole = async (req: Request, res: Response): Promise<void> => {
  res.json(await adminService.updateUserRole(String(req.params.id), req.body as adminService.UpdateRoleInput));
};

export const suspendUser = async (req: Request, res: Response): Promise<void> => {
  const userId = String(req.params.id);
  const user = await adminService.suspendUser(userId);
  await adminService.logAdminAction(
    (req as any).user.dbId, (req as any).user.email, "SUSPEND_USER", "User", userId, undefined, req.ip,
  );
  res.json(user);
};

export const activateUser = async (req: Request, res: Response): Promise<void> => {
  const userId = String(req.params.id);
  const user = await adminService.activateUser(userId);
  await adminService.logAdminAction(
    (req as any).user.dbId, (req as any).user.email, "ACTIVATE_USER", "User", userId, undefined, req.ip,
  );
  res.json(user);
};

export const getAllReviews = async (req: Request, res: Response): Promise<void> => {
  const { page, limit, rating, isVisible } = req.query;
  res.json(await adminService.getAllReviews({
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
    rating: rating ? Number(rating) : undefined,
    isVisible: isVisible !== undefined ? isVisible === "true" : undefined,
  }));
};

export const hideReview = async (req: Request, res: Response): Promise<void> => {
  const reviewId = String(req.params.id);
  const review = await adminService.hideReview(reviewId);
  await adminService.logAdminAction(
    (req as any).user.dbId, (req as any).user.email, "HIDE_REVIEW", "Review", reviewId, undefined, req.ip,
  );
  res.json(review);
};

export const deleteReview = async (req: Request, res: Response): Promise<void> => {
  const reviewId = String(req.params.id);
  await adminService.deleteReview(reviewId);
  await adminService.logAdminAction(
    (req as any).user.dbId, (req as any).user.email, "DELETE_REVIEW", "Review", reviewId, undefined, req.ip,
  );
  res.status(204).send();
};

export const refundPayment = async (req: Request, res: Response): Promise<void> => {
  const paymentId = String(req.params.id);
  const payment = await adminService.refundPayment(paymentId);
  await adminService.logAdminAction(
    (req as any).user.dbId, (req as any).user.email, "REFUND_PAYMENT", "Payment", paymentId, undefined, req.ip,
  );
  res.json(payment);
};

export const broadcastAnnouncement = async (req: Request, res: Response): Promise<void> => {
  const { title, message, role } = req.body as { title: string; message: string; role?: string };
  if (!title || !message) { res.status(400).json({ error: "title and message required" }); return; }
  const result = await adminService.broadcastAnnouncement(title, message, role);
  await adminService.logAdminAction(
    (req as any).user.dbId, (req as any).user.email, "BROADCAST_ANNOUNCEMENT", "System",
    undefined, `${result.sent} recipients`, req.ip,
  );
  res.json(result);
};

export const getAllComplaints = async (req: Request, res: Response): Promise<void> => {
  const { page, limit, status } = req.query;
  res.json(await adminService.getAllComplaints({
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 25,
    status: status as string | undefined,
  }));
};

export const updateComplaint = async (req: Request, res: Response): Promise<void> => {
  const { status, adminNote } = req.body as { status?: string; adminNote?: string };
  const complaintId = String(req.params.id);
  const complaint = await adminService.updateComplaint(complaintId, { status, adminNote });
  await adminService.logAdminAction(
    (req as any).user.dbId, (req as any).user.email, "UPDATE_COMPLAINT", "Complaint", complaintId, status, req.ip,
  );
  res.json(complaint);
};
