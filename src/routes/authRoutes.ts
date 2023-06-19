import express from "express";
import { register, login, logout } from "../controllers/auth_controllers";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: Authentication managing APIs
 */

/**
 * @swagger
 * /api/v1/register:
 *      post:
 *          summary: Returns token for newly registered user
 *          tags:
 *                 [Authentication]
 *          description: Sends new user's information to the server and gets token.
 *          requestBody:
 *              required: true
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              email:
 *                                type: string
 *                              password:
 *                                type: string
 *                              firstName:
 *                                type: string
 *                              lastName:
 *                                type: string
 *                              userName:
 *                                type: string
 *                              address:
 *                                type: string
 *                              phoneNumber:
 *                                type: string
 *                              role:
 *                                type: string
 *          responses:
 *              200:
 *                  description: Token
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

router.post("/register", register);
/**
 * @swagger
 * /api/v1/login:
 *      post:
 *          summary: Returns token for the user logged in
 *          tags:
 *                 [Authentication]
 *          description: Sends new user's credentials to the server and gets token.
 *          requestBody:
 *              required: true
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              userName:
 *                                type: string
 *                              password:
 *                                type: string
 *          responses:
 *              200:
 *                  description: Token
 *                  content:
 *                      application/json:
 *                          schema:
 *                              type: string
 *              404:
 *                  description: Not found
 *              500:
 *                  description: Internal server error
 */
router.post("/login", login);

/**
 * @swagger
 * /api/v1/logout:
 *      get:
 *          summary: Signs the user out
 *          tags:
 *                 [Authentication]
 *          description: Signs the user out
 *          requestBody:
 *              required: false
 *          responses:
 *              200:
 *                  description: Message about signing out
 *                  content:
 *                      application/json:
 *                          schema:
 *                              type: string
 *              404:
 *                  description: Not found
 *              500:
 *                  description: Internal server error
 */
router.get("/logout", logout);

export default router;
