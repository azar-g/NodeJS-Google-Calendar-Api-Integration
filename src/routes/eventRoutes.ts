import express from "express";
import {
  getEventsList,
  createEvent,
  createAppointmentSlots,
  // updateEvent,
  deleteEvent,
} from "../controllers/event_controllers";
import { authenticateUser } from "../middleware/authentication";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Events
 *   description: Events managing APIs
 */

/**
 * @swagger
 * /api/v1/getEventsList:
 *      post:
 *          summary: Returns the list of all events
 *          tags:
 *              [Events]
 *          description: Sends user's email to the server and retrieves events list.
 *          requestBody:
 *              required: true
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              email:
 *                                type: string
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

router.post("/getEventsList", getEventsList);
// router.post("/createEvent", createEvent);

/**
 * @swagger
 * /api/v1/createAppointmentSlots:
 *      post:
 *          summary: Returns the list of created free slots for appointments
 *          tags:
 *              [Events]
 *          description: Sends user's pre-defined free time intervals to the server and retrieves the list created free slots.
 *          requestBody:
 *              required: true
 *              content:
 *                  application/json:
 *                      schema:
 *                        properties:
 *                           intervals:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                startDateTime:
 *                                  type: string
 *                                  format: date-time
 *                                endDateTime:
 *                                  type: string
 *                                  format: date-time
 *
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
router.post(
  "/createAppointmentSlots",
  authenticateUser,
  createAppointmentSlots
);

/**
 * @swagger
 * /api/v1/createEvent:
 *      patch:
 *          summary: Creates an event on free appointment slots
 *          tags:
 *              [Events]
 *          description: Sends customer's details and create an event by updating a free slot selected by Id.
 *          requestBody:
 *              required: true
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              userEmail:
 *                                type: string
 *                              eventId:
 *                                type: string
 *                              description:
 *                                type: string
 *                              customerName:
 *                                type: string
 *                              customerPhoneNumber:
 *                                type: string
 *
 *          responses:
 *              200:
 *                  description: A JSON of the created event
 *                  content:
 *                      application/json:
 *                          schema:
 *                              type: json
 *              404:
 *                  description: Not found
 *              500:
 *                  description: Internal server error
 */
router.patch("/createEvent", createEvent),
  router.delete("/deleteEvent/:id", deleteEvent);

export default router;
