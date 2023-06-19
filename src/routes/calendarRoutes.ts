import express from "express";
import {
  getCalendarList,
  createCalendar,
  deleteCalendar,
  getAclList,
  deleteAccess,
} from "../controllers/calendar_controllers";
import { authenticateUser } from "../middleware/authentication";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Calendars
 *   description: Events managing APIs
 */

/**
 * @swagger
 * /api/v1/getCalendarList:
 *      get:
 *          summary: Returns the list of calendars
 *          tags:
 *              [Calendars]
 *          description: Retrieves the list of all calendars integrated with service account.
 *          requestBody:
 *              required: false
 *          responses:
 *              200:
 *                  description: A JSON array of events
 *                  content:
 *                      application/json:
 *                          schema:
 *                              type: array
 *                              items:
 *                                type: json
 *              404:
 *                  description: Not found
 *              500:
 *                  description: Internal server error
 */

router.get("/getCalendarList", authenticateUser, getCalendarList);

/**
 * @swagger
 * /api/v1/getAclList:
 *      get:
 *          summary: Returns the list of calendars that has access to the user's calendar
 *          tags:
 *              [Calendars]
 *          description: Sends the user's calendarId to the server and retrieves the list of calendars that have access to the user's calendar, which we created on their behalf.
 *          requestBody:
 *              required: false
 *          responses:
 *              200:
 *                  description: A JSON array of calendars
 *                  content:
 *                      application/json:
 *                          schema:
 *                              type: array
 *                              items:
 *                                type: json
 *              404:
 *                  description: Not found
 *              500:
 *                  description: Internal server error
 */

router.get("/getAclList", authenticateUser, getAclList);

/**
 * @swagger
 * /api/v1/createCalendar:
 *      post:
 *          summary: Create a calendar for a registered user
 *          tags:
 *              [Calendars]
 *          description: Sends user's email and id to the server, creates a calendar and shares that calendar with user then sets the newly created calendar's id to the user's data.
 *          requestBody:
 *              required: true
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              email:
 *                                type: string
 *                              id:
 *                                type: integer
 *                                format: int32
 *          responses:
 *              200:
 *                  description: A JSON array of events
 *                  content:
 *                      application/json:
 *                          schema:
 *                              type: object
 *
 *              404:
 *                  description: Not found
 *              500:
 *                  description: Internal server error
 */

router.post("/createCalendar", createCalendar);

/**
 * @swagger
 * /api/v1/deleteAccess:
 *      delete:
 *          summary: Deletes the rule that has access to the user's calendar
 *          tags:
 *              [Calendars]
 *          description: Sends the user's calendarId and ruleId to the server and deletes the rule that has access to the user's calendar.
 *          requestBody:
 *              required: false
 *          responses:
 *              200:
 *                  description: A JSON array of calendars
 *                  content:
 *                      application/json:
 *                          schema:
 *                              type: string
 *
 *              404:
 *                  description: Not found
 *              500:
 *                  description: Internal server error
 */

router.delete("/deleteAccess", deleteAccess);

router.delete("/deleteCalendar/:id", deleteCalendar);

export default router;
