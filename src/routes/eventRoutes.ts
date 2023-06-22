import express from "express";
import {
  getEventsList,
  createEvent,
  createAppointmentSlots,
  // updateEvent,
  deleteEvent,
} from "../controllers/event_controllers";
import { authenticatedUser } from "../middleware/authentication";

const router = express.Router();

router.get("/getEventsList", authenticatedUser, getEventsList);
// router.post("/createEvent", createEvent);

router.post(
  "/createAppointmentSlots",
  authenticatedUser,
  createAppointmentSlots
);

router.patch("/createEvent", createEvent),
  router.delete("/deleteEvent/:id", deleteEvent);

export default router;
