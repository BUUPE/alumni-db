import functions = require("firebase-functions");
import express = require("express");
import cors = require("cors");
import admin = require("firebase-admin");
import crypto = require("crypto");

import { authenticateApiKey } from "./util";

type User = {
  name: string;
  uid: number;
  scope: string;
};

const stripPrivateInfo = (user: User): Partial<User> => {
  const { name } = user;
  return {
    name,
  };
};

const app = express();
app.use(cors({ origin: true }));
app.use(authenticateApiKey);

// TODO: make sure user matches type
app.post("/", async (req, res) => {
  functions.logger.log("Creating user", req.body);
  const userRef = admin.firestore().collection("users").doc(`${req.body.uid}`);
  const doc = await userRef.get();
  if (doc.exists) {
    res.sendStatus(409);
  } else {
    const scope = crypto
      .createHash("sha256")
      .update(req.header("X-API-KEY")!)
      .digest("hex");
    delete req.body.uid;
    const result = await userRef.set({ ...req.body, scope });
    res.send(result);
  }
});

// get all users
app.get("/", async (req, res) => {
  const snapshot = await admin.firestore().collection("users").get();
  res.send(
    snapshot.docs.map((doc) => doc.data() as User).map(stripPrivateInfo)
  );
});

// get individual user
app.get("/:id", async (req, res) => {
  const userRef = admin.firestore().collection("users").doc(req.params.id);
  const doc = await userRef.get();
  if (doc.exists) {
    const user = doc.data() as User;
    res.send(stripPrivateInfo(user));
  } else {
    res.sendStatus(404);
  }
});

app.patch("/:id", async (req, res) => {
  const userRef = admin.firestore().collection("users").doc(req.params.id);
  const doc = await userRef.get();
  if (doc.exists) {
    const { scope: userScope } = doc.data() as User;
    const requestScope = crypto
      .createHash("sha256")
      .update(req.header("X-API-KEY")!)
      .digest("hex");
    if (requestScope !== userScope) res.sendStatus(401);
    const result = await userRef.update(req.body);
    res.send(result);
  } else {
    res.sendStatus(404);
  }
});

app.delete("/:id", async (req, res) => {
  const userRef = admin.firestore().collection("users").doc(req.params.id);
  const doc = await userRef.get();
  if (doc.exists) {
    const { scope: userScope } = doc.data() as User;
    const requestScope = crypto
      .createHash("sha256")
      .update(req.header("X-API-KEY")!)
      .digest("hex");
    if (requestScope !== userScope) res.sendStatus(401);
    const result = await userRef.delete();
    res.send(result);
  } else {
    res.sendStatus(404);
  }
});

exports.user = functions.https.onRequest(app);
