import express from "express";
import { getClient } from "../db";
import { ObjectId } from "mongodb";
import User from "../models/User";

const usersRouter = express.Router();

const errorResponse = (error: any, res: any) => {
  console.error("FAIL", error);
  res.status(500).json({ message: "Internal Server Error" });
};
usersRouter.get("/users", async (req, res) => {
  try {
    const client = await getClient();
    const cursor = client.db().collection<User[]>("users").find();
    const results = await cursor.toArray();
    results
      ? res.status(200).json(results)
      : res.status(404).json({ message: "Not found" });
  } catch (err) {
    errorResponse(err, res);
  }
});

usersRouter.get("/users/:id", async (req, res) => {
  try {
    let id: string = req.params.id as string;
    const client = await getClient();
    const results = await client
      .db()
      .collection<User>("users")
      .findOne({ _id: new ObjectId(id) });
    if (results) {
      res.status(200).json(results);
    } else {
      res.status(404).json({ message: "ID not Found" });
    }
  } catch (err) {
    errorResponse(err, res);
  }
});

usersRouter.post("/users", async (req, res) => {
  try {
    const client = await getClient();
    const newItem = req.body;
    await client.db().collection<User>("users").insertOne(newItem);
    res.status(200);
    res.json(newItem);
  } catch (error) {
    errorResponse(error, res);
  }
});

usersRouter.put("/users/:id", async (req, res) => {
  try {
    let id: string = req.params.id as string;
    const replacement = req.body;
    replacement._id = new ObjectId(id);
    const client = await getClient();
    const result = await client
      .db()
      .collection<User>("users")
      .replaceOne({ _id: new ObjectId(id) }, replacement);
    if (result.modifiedCount) {
      res.status(200);
      res.json(replacement);
    } else {
      res.status(404);
      res.send("ID not found");
    }
  } catch (error) {
    errorResponse(error, res);
  }
});

usersRouter.delete("/users/:id", async (req, res) => {
  try {
    let id: string = req.params.id as string;
    const client = await getClient();
    const result = await client
      .db()
      .collection<User>("users")
      .deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount) {
      res.sendStatus(204);
    } else {
      res.status(404);
      res.send("No ID found");
    }
  } catch (error) {
    errorResponse(error, res);
  }
});

export default usersRouter;
