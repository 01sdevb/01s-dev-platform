import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import scriptsRouter from "./scripts";
import usersRouter from "./users";
import commentsRouter from "./comments";
import ratingsRouter from "./ratings";
import visitorsRouter from "./visitors";
import notificationsRouter from "./notifications";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(scriptsRouter);
router.use(commentsRouter);
router.use(ratingsRouter);
router.use(visitorsRouter);
router.use(notificationsRouter);
router.use(usersRouter);

export default router;
