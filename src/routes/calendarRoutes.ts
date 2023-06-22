import express from "express";
import {
  getCalendarList,
  createCalendar,
  deleteCalendar,
  getAclList,
  deleteAccess,
} from "../controllers/calendar_controllers";
import { authenticatedUser } from "../middleware/authentication";

const router = express.Router();

router.get("/getCalendarList", authenticatedUser, getCalendarList);

router.get("/getAclList", authenticatedUser, getAclList);

router.post("/createCalendar", createCalendar);

router.delete("/deleteAccess", deleteAccess);

router.delete("/deleteCalendar/:id", deleteCalendar);

export default router;
