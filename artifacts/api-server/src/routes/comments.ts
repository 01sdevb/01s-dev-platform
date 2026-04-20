import { Router } from "express";
import type { IRouter } from "express";
import { db, scriptCommentsTable, usersTable, scriptsTable, notificationsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import { pushNotification } from "./notifications";

const router: IRouter = Router();

function parseId(val: unknown): number | null {
  const n = parseInt(String(val), 10);
  return isNaN(n) || n <= 0 ? null : n;
}

router.get("/scripts/:id/comments", async (req, res): Promise<void> => {
  const scriptId = parseId(req.params.id);
  if (!scriptId) { res.status(400).json({ error: "Invalid script ID" }); return; }
  const comments = await db
    .select({
      id: scriptCommentsTable.id,
      content: scriptCommentsTable.content,
      createdAt: scriptCommentsTable.createdAt,
      userId: scriptCommentsTable.userId,
      username: usersTable.username,
    })
    .from(scriptCommentsTable)
    .leftJoin(usersTable, eq(scriptCommentsTable.userId, usersTable.id))
    .where(eq(scriptCommentsTable.scriptId, scriptId))
    .orderBy(desc(scriptCommentsTable.createdAt));
  res.json(comments);
});

router.post("/scripts/:id/comments", requireAuth, async (req, res): Promise<void> => {
  const scriptId = parseId(req.params.id);
  if (!scriptId) { res.status(400).json({ error: "Invalid script ID" }); return; }

  const content = typeof req.body?.content === "string" ? req.body.content.trim() : "";
  if (!content || content.length > 1000) { res.status(400).json({ error: "Content is required (max 1000 chars)" }); return; }

  const [script] = await db
    .select({ id: scriptsTable.id, authorId: scriptsTable.authorId, title: scriptsTable.title })
    .from(scriptsTable).where(eq(scriptsTable.id, scriptId));
  if (!script) { res.status(404).json({ error: "Script not found" }); return; }

  const [comment] = await db.insert(scriptCommentsTable)
    .values({ scriptId, userId: req.userId!, content })
    .returning();

  const [user] = await db.select({ username: usersTable.username }).from(usersTable).where(eq(usersTable.id, req.userId!));

  if (script.authorId !== req.userId) {
    const [notification] = await db.insert(notificationsTable).values({
      userId: script.authorId,
      actorId: req.userId!,
      actorUsername: req.username!,
      scriptId: scriptId,
      scriptTitle: script.title,
      type: "comment",
      message: `${req.username} commented on your script "${script.title}"`,
    }).returning();
    pushNotification(script.authorId, { type: "notification", notification });
  }

  res.status(201).json({ ...comment, username: user?.username });
});

export default router;
