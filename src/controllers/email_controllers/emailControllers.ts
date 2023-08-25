import { NextFunction, Request, Response } from "express";
import { google } from "googleapis";
import * as path from "path";

const getGmailService = async () => {
  const JWT = google.auth.JWT;
  const authClient = new JWT({
    keyFile: path.resolve(__dirname, "../../../service_credentials.json"),
    scopes: ["https://mail.google.com"],
    subject: "azar.gurbanov@isgonnado.it",
  });
  await authClient.authorize();

  const gmail = google.gmail({
    auth: authClient,
    version: "v1",
  });
  return gmail;
};

const encodeMessage = ({
  subject,
  body,
  to,
}: {
  subject: string;
  body: string;
  to: string;
}) => {
  const options = [
    "Content-Type: text/html; charset=utf-8",
    "To: " + to,
    "Subject: " + subject,
    "",
    body,
  ].join("\n");

  return Buffer.from(options)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
};

export const sendMail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subject, body, to } = req.body;

    const gmail = await getGmailService();

    const encodedMessage = encodeMessage({ subject, body, to });

    const response = await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodedMessage,
      },
    });
    res.send(response);
  } catch (error) {
    next(error);
  }
};

export const listMails = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const gmail = await getGmailService();

    const response = await gmail.users.messages.list({
      userId: "me",
    });
    res.send(response);
  } catch (error) {
    next(error);
  }
};

export const readMail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const gmail = await getGmailService();

    const response = await gmail.users.messages.get({
      userId: "me",
      id,
    });
    res.send(response);
  } catch (error) {
    next(error);
  }
};
