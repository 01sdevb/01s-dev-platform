import { Router } from "express";
import type { IRouter } from "express";
import { db, scriptsTable, usersTable, scriptLikesTable } from "@workspace/db";
import { eq, desc, and, like, sql, asc } from "drizzle-orm";
import { requireAuth, optionalAuth } from "../middlewares/requireAuth";
import { CreateScriptBody, ListScriptsQueryParams, GetScriptParams, DeleteScriptParams, LikeScriptParams, ViewScriptParams } from "@workspace/api-zod";

const router: IRouter = Router();

async function enrichScript(script: typeof scriptsTable.$inferSelect, authorUsername: string, userId?: number) {
  let isLikedByMe = false;
  if (userId) {
    const [like] = await db
      .select({ id: scriptLikesTable.id })
      .from(scriptLikesTable)
      .where(and(eq(scriptLikesTable.scriptId, script.id), eq(scriptLikesTable.userId, userId)));
    isLikedByMe = !!like;
  }
  return {
    id: script.id,
    title: script.title,
    description: script.description,
    code: script.code,
    game: script.game,
    category: script.category,
    authorId: script.authorId,
    authorUsername,
    likes: script.likes,
    views: script.views,
    isVerified: script.isVerified,
    isPremium: script.isPremium,
    isLikedByMe,
    createdAt: script.createdAt.toISOString(),
    updatedAt: script.updatedAt.toISOString(),
  };
}

router.get("/scripts", optionalAuth, async (req, res): Promise<void> => {
  const parsed = ListScriptsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { page = 1, limit = 12, search, category, sort = "newest" } = parsed.data;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (search) {
    conditions.push(
      sql`(${scriptsTable.title} ILIKE ${`%${search}%`} OR ${scriptsTable.game} ILIKE ${`%${search}%`})`
    );
  }
  if (category && category !== "All") {
    conditions.push(eq(scriptsTable.category, category));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  let orderBy;
  if (sort === "popular") {
    orderBy = desc(scriptsTable.likes);
  } else if (sort === "trending") {
    orderBy = desc(sql`${scriptsTable.views} + ${scriptsTable.likes} * 2`);
  } else {
    orderBy = desc(scriptsTable.createdAt);
  }

  const [totalResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(scriptsTable)
    .where(whereClause);

  const total = Number(totalResult.count);
  const totalPages = Math.ceil(total / limit);

  const scripts = await db
    .select({
      script: scriptsTable,
      authorUsername: usersTable.username,
    })
    .from(scriptsTable)
    .innerJoin(usersTable, eq(scriptsTable.authorId, usersTable.id))
    .where(whereClause)
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset);

  const enriched = await Promise.all(
    scripts.map(({ script, authorUsername }) =>
      enrichScript(script, authorUsername, req.userId)
    )
  );

  res.json({ scripts: enriched, total, page, totalPages });
});

router.get("/scripts/trending", optionalAuth, async (req, res): Promise<void> => {
  const scripts = await db
    .select({
      script: scriptsTable,
      authorUsername: usersTable.username,
    })
    .from(scriptsTable)
    .innerJoin(usersTable, eq(scriptsTable.authorId, usersTable.id))
    .orderBy(desc(sql`${scriptsTable.views} + ${scriptsTable.likes} * 2`))
    .limit(5);

  const enriched = await Promise.all(
    scripts.map(({ script, authorUsername }) =>
      enrichScript(script, authorUsername, req.userId)
    )
  );

  res.json(enriched);
});

router.get("/scripts/stats", async (_req, res): Promise<void> => {
  const [scriptStats] = await db
    .select({
      totalScripts: sql<number>`count(*)`,
      totalLikes: sql<number>`coalesce(sum(${scriptsTable.likes}), 0)`,
      totalViews: sql<number>`coalesce(sum(${scriptsTable.views}), 0)`,
    })
    .from(scriptsTable);

  const [userStats] = await db
    .select({ totalUsers: sql<number>`count(*)` })
    .from(usersTable);

  res.json({
    totalScripts: Number(scriptStats.totalScripts),
    totalUsers: Number(userStats.totalUsers),
    totalLikes: Number(scriptStats.totalLikes),
    totalViews: Number(scriptStats.totalViews),
  });
});

router.get("/scripts/:id", optionalAuth, async (req, res): Promise<void> => {
  const params = GetScriptParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid script ID" });
    return;
  }

  const [row] = await db
    .select({ script: scriptsTable, authorUsername: usersTable.username })
    .from(scriptsTable)
    .innerJoin(usersTable, eq(scriptsTable.authorId, usersTable.id))
    .where(eq(scriptsTable.id, params.data.id));

  if (!row) {
    res.status(404).json({ error: "Script not found" });
    return;
  }

  const enriched = await enrichScript(row.script, row.authorUsername, req.userId);
  res.json(enriched);
});

router.post("/scripts", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateScriptBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [script] = await db
    .insert(scriptsTable)
    .values({ ...parsed.data, authorId: req.userId! })
    .returning();

  const enriched = await enrichScript(script, req.username!, req.userId);
  res.status(201).json(enriched);
});

router.delete("/scripts/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteScriptParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid script ID" });
    return;
  }

  const [script] = await db
    .select({ authorId: scriptsTable.authorId })
    .from(scriptsTable)
    .where(eq(scriptsTable.id, params.data.id));

  if (!script) {
    res.status(404).json({ error: "Script not found" });
    return;
  }

  if (script.authorId !== req.userId) {
    res.status(403).json({ error: "You can only delete your own scripts" });
    return;
  }

  await db.delete(scriptsTable).where(eq(scriptsTable.id, params.data.id));
  res.json({ message: "Script deleted successfully" });
});

router.post("/scripts/:id/like", requireAuth, async (req, res): Promise<void> => {
  const params = LikeScriptParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid script ID" });
    return;
  }

  const { id } = params.data;

  const [existing] = await db
    .select({ id: scriptLikesTable.id })
    .from(scriptLikesTable)
    .where(and(eq(scriptLikesTable.scriptId, id), eq(scriptLikesTable.userId, req.userId!)));

  let liked: boolean;
  if (existing) {
    await db
      .delete(scriptLikesTable)
      .where(and(eq(scriptLikesTable.scriptId, id), eq(scriptLikesTable.userId, req.userId!)));
    await db
      .update(scriptsTable)
      .set({ likes: sql`${scriptsTable.likes} - 1` })
      .where(eq(scriptsTable.id, id));
    liked = false;
  } else {
    await db.insert(scriptLikesTable).values({ scriptId: id, userId: req.userId! });
    await db
      .update(scriptsTable)
      .set({ likes: sql`${scriptsTable.likes} + 1` })
      .where(eq(scriptsTable.id, id));
    liked = true;
  }

  const [updated] = await db
    .select({ likes: scriptsTable.likes })
    .from(scriptsTable)
    .where(eq(scriptsTable.id, id));

  res.json({ liked, likes: updated?.likes ?? 0 });
});

router.post("/scripts/:id/view", async (req, res): Promise<void> => {
  const params = ViewScriptParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid script ID" });
    return;
  }

  await db
    .update(scriptsTable)
    .set({ views: sql`${scriptsTable.views} + 1` })
    .where(eq(scriptsTable.id, params.data.id));

  res.json({ message: "View registered" });
});

export default router;
