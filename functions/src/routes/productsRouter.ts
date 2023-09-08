import express from "express";
import { getClient } from "../db";
import { ObjectId, WithId } from "mongodb";
import Product from "../models/Product";

const productsRouter = express.Router();

const errorResponse = (error: any, res: any) => {
  console.error("FAIL", error);
  res.status(500).json({ message: "Internal Server Error" });
};
productsRouter.get("/products", async (req, res) => {
  try {
    const maxPrice: number = parseInt(req.query["max-price"] as string) || 0;
    const includes: string = (req.query["includes"] as string) || "";
    const limit: number = parseInt(req.query["limit"] as string);
    const query = {
      ...(maxPrice ? { price: { $lte: maxPrice } } : {}),
      ...(includes ? { name: new RegExp(includes, "i") } : {}),
    };
    const client = await getClient();
    const cursor = client.db().collection<Product[]>("products").find(query);
    if (limit) cursor.limit(limit);
    const results = await cursor.toArray();
    results
      ? res.status(200).json(results)
      : res.status(404).json({ message: "Not found" });
  } catch (err) {
    errorResponse(err, res);
  }
});

productsRouter.get("/products/:id", async (req, res) => {
  try {
    let id: string = req.params.id as string;
    const client = await getClient();
    const results: WithId<Product> | null = await client
      .db()
      .collection<Product>("products")
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

productsRouter.post("/products", async (req, res) => {
  try {
    const client = await getClient();
    const newItem = req.body;
    await client.db().collection<Product>("products").insertOne(newItem);
    res.status(200);
    res.json(newItem);
  } catch (error) {
    errorResponse(error, res);
  }
});

productsRouter.put("/products/:id", async (req, res) => {
  try {
    let id: string = req.params.id as string;
    const replacement = req.body;
    replacement._id = new ObjectId(id);
    const client = await getClient();
    const result = await client
      .db()
      .collection<Product>("products")
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

productsRouter.delete("/products/:id", async (req, res) => {
  try {
    let id: string = req.params.id as string;
    const client = await getClient();
    const result = await client
      .db()
      .collection<Product>("products")
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

export default productsRouter;
