import express from "express";
import {
  generateZoomSignature,
  createZoomMeeting,
  addRegistrantsToZoomMeeting,
  zoomAuth,
  getZoomMeetings,
  getZoomMeeting,
  deleteZoomMeeting,
  zoomEvents,
  endZoomMeeting,
  getPastZoomMeeting,
  getEndedZoomMeeting,
  createZoomUser,
  getZoomUsers,
} from "../controllers/zoom_controllers";
// import { authenticatedUser } from "../middleware/authentication";

const router = express.Router();

router.post("/zoomAuth", zoomAuth);
router.post("/zoomEvents", zoomEvents);
router.post("/generateZoomSignature", generateZoomSignature);
router.post("/createZoomMeeting", createZoomMeeting);
router.post("/createZoomUser", createZoomUser);
router.post(
  "/addRegistrantsToZoomMeeting/:meetingId",
  addRegistrantsToZoomMeeting
);
router.get("/getZoomMeetings", getZoomMeetings);
router.get("/getZoomUsers", getZoomUsers);
router.get("/getZoomMeeting/:meetingId", getZoomMeeting);
router.get("/getPastZoomMeeting/:meetingId", getPastZoomMeeting);
router.get("/getEndedZoomMeeting/:meetingId", getEndedZoomMeeting);
router.delete("/deleteZoomMeeting/:meetingId", deleteZoomMeeting);
router.put("/endZoomMeeting/:meetingId", endZoomMeeting);

export default router;
