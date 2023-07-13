import express from "express";
import {
  getEventsList,
  getAppointmentSlots,
  createEvent,
  createAppointmentSlots,
  deleteEvent,
  generateZoomSignature,
} from "../controllers/event_controllers";
import { authenticatedUser } from "../middleware/authentication";

const router = express.Router();

router.get("/getEventsList", authenticatedUser, getEventsList);
router.get("/getAppointmentSlots", getAppointmentSlots);

router.post(
  "/createAppointmentSlots",
  authenticatedUser,
  createAppointmentSlots
);
router.post("/generateZoomSignature", generateZoomSignature);

router.patch("/createEvent", createEvent);
router.delete("/deleteEvent/:id", authenticatedUser, deleteEvent);

export default router;
