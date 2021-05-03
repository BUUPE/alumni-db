import express = require("express");
import crypto = require("crypto");
import admin = require("firebase-admin");

type ApiKey = {
  valid: boolean;
};

export const authenticateApiKey: express.RequestHandler = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const apiKey = req.header("X-API-KEY");
  if (!apiKey) res.sendStatus(401);
  const keyRef = admin.firestore().collection("apikeys").doc(apiKey!);
  const doc = await keyRef.get();
  if (doc.exists) {
    const { valid } = doc.data() as ApiKey;
    valid ? next() : res.sendStatus(401);
  } else {
    res.sendStatus(401);
  }
};

export const getScope = (req: express.Request): string =>
  crypto.createHash("sha256").update(req.header("X-API-KEY")!).digest("hex");
