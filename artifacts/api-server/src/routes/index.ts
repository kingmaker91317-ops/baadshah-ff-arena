import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import tournamentsRouter from "./tournaments";
import registrationsRouter from "./registrations";
import walletRouter from "./wallet";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/users", usersRouter);
router.use("/tournaments", tournamentsRouter);
router.use("/tournaments", registrationsRouter);
router.use("/registrations", registrationsRouter);
router.use("/wallet", walletRouter);
router.use("/admin", adminRouter);

export default router;
