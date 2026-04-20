import { Router } from "express";
import type { IRouter } from "express";
import { db, siteVisitsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

const router: IRouter = Router();

router.post("/track-visit", async (req, res): Promise<void> => {
  let sessionKey = req.cookies?.["visitor_session"];

  if (!sessionKey) {
    sessionKey = randomUUID();
    res.cookie("visitor_session", sessionKey, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
      maxAge: 365 * 24 * 60 * 60 * 1000,
    });
  }

  try {
    const [existing] = await db
      .select({ id: siteVisitsTable.id })
      .from(siteVisitsTable)
      .where(eq(siteVisitsTable.sessionKey, sessionKey));

    if (existing) {
      await db
        .update(siteVisitsTable)
        .set({ lastSeenAt: new Date() })
        .where(eq(siteVisitsTable.sessionKey, sessionKey));
    } else {
      await db.insert(siteVisitsTable).values({ sessionKey });
    }
  } catch (_err) {
    // ignore duplicate key errors silently
  }

  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(siteVisitsTable);

  res.json({ visitors: Number(result.count) });
});

export default router;
