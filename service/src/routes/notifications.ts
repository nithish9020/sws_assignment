import { Router } from "express";
import { eq, desc, sql } from "drizzle-orm";
import { db, schema } from "../db/index.js";

export const notificationsRouter: Router = Router();

// GET /api/notifications
// List all notifications, newest first
notificationsRouter.get("/", async (req, res, next) => {
  try {
    const allNotifications = await db.query.notifications.findMany({
      orderBy: [desc(schema.notifications.createdAt)],
    });

    res.status(200).json({
      notifications: allNotifications,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/notifications/unread-count
// Get the number of unread notifications
notificationsRouter.get("/unread-count", async (req, res, next) => {
  try {
    const result = await db
      .select({ count: sql<number>`cast(count(${schema.notifications.id}) as int)` })
      .from(schema.notifications)
      .where(eq(schema.notifications.read, false));

    const count = result[0]?.count || 0;

    res.status(200).json({ count });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/notifications/read-all
// Mark all notifications as read
notificationsRouter.patch("/read-all", async (req, res, next) => {
  try {
    await db
      .update(schema.notifications)
      .set({ read: true })
      .where(eq(schema.notifications.read, false));

    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/notifications/:id/read
// Mark a specific notification as read
notificationsRouter.patch("/:id/read", async (req, res, next) => {
  try {
    const { id } = req.params;

    await db
      .update(schema.notifications)
      .set({ read: true })
      .where(eq(schema.notifications.id, id));

    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
});
