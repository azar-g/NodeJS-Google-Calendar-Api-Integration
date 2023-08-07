import express from "express";
import {
  sendMail,
  listMails,
  readMail,
} from "../controllers/email_controllers";
// import { authenticatedUser } from "../middleware/authentication";

const router = express.Router();

router.post("/sendMail", sendMail);
router.get("/listMails", listMails);
router.get("/readMail/:id", readMail);

export default router;
