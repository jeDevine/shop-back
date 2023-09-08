// require the express module
import express from "express";
import CartItem from "../models/CartItem";
import { getClient } from "../db";
import { ObjectId } from "mongodb";

const cartItemsRouter = express.Router();

const errorResponse = (error: any, res: any) => {
  console.error("FAIL", error);
  res.status(500).json({ message: "Internal Server Error" });
};
// 1

cartItemsRouter.get("/users/:userId/cart", async (req, res) => {
  try {
    const userId: ObjectId = new ObjectId(req.params.userId);
    const client = await getClient();
    const results = await client
      .db()
      .collection<CartItem>("cartItems")
      .find({ userId })
      .toArray();
    res.status(200).json(results);
  } catch (err) {
    errorResponse(err, res);
  }
});

cartItemsRouter.post("/users/:userId/cart", async (req, res) => {
  try {
    const cartItem: CartItem = req.body;
    const userId: ObjectId = new ObjectId(req.params.userId);
    const client = await getClient();
    const existingCartItem = await client
      .db()
      .collection<CartItem>("cartItems")
      .findOne({ userId, "product._id": new ObjectId(cartItem.product._id) });
    if (existingCartItem) {
      const result = await client
        .db()
        .collection<CartItem>("cartItems")
        .updateOne(
          { userId, "product._id": new ObjectId(cartItem.product._id) },
          { $inc: { quantity: cartItem.quantity } }
        );
      res.status(200).json(result);
    } else {
      cartItem.product._id = new ObjectId(cartItem.product._id);
      cartItem.userId = userId;
      await client.db().collection<CartItem>("cartItems").insertOne(cartItem);
      res.status(201).json(cartItem);
    }
  } catch (err) {
    errorResponse(err, res);
  }
});

cartItemsRouter.patch("/users/:userId/cart/:productId", async (req, res) => {
  try {
    const userId: ObjectId = new ObjectId(req.params.userId);
    const productId: ObjectId = new ObjectId(req.params.productId);
    const update: any = req.body;
    const client = await getClient();
    const result = await client
      .db()
      .collection<CartItem>("cartItems")
      .updateOne({ userId, "product._id": productId }, { $set: update });
    if (result.matchedCount) {
      res.status(200).json(update);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (err) {
    errorResponse(err, res);
  }
});

cartItemsRouter.delete("/users/:userId/cart/:productId", async (req, res) => {
  try {
    const userId: ObjectId = new ObjectId(req.params.userId);
    const productId: ObjectId = new ObjectId(req.params.productId);
    const client = await getClient();
    const result = await client
      .db()
      .collection<CartItem>("cartItems")
      .deleteOne({ userId, "product._id": productId });
    if (result.deletedCount) {
      res.sendStatus(204);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    errorResponse(error, res);
  }
});

cartItemsRouter.delete("/users/:userId/cart", async (req, res) => {
  try {
    const userId: ObjectId = new ObjectId(req.params.userId);
    const client = await getClient();
    const result = await client
      .db()
      .collection<CartItem>("cartItems")
      .deleteMany({ userId });
    if (result.deletedCount) {
      res.sendStatus(204);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    errorResponse(error, res);
  }
});

export default cartItemsRouter;
