import { Hono } from "hono";
import { cors } from "hono/cors";
import uploadRouter from "./controllers/fileUpload.controller";
import chatRouter from "./controllers/chat.controller";
type Bindings = {
  // SQLite
  DB: D1Database;
  // Low latency Key/Value Stores
  CONFIG: KVNamespace;
  CACHE: KVNamespace;
  // Worker Environment Variables
  OPENAPI_API_KEY: string;
};
const app = new Hono<{ Bindings: Bindings }>();
app.use("*", cors());
app.use("*", async (c, next) => {
  console.log("Content-Type:", c.req.header("Content-Type"));
  await next();
});
app.route("/upload", uploadRouter);
app.route("/assistant", chatRouter);
// delete vector id and assistant Id

// add variables

// app.get("/add-variables", async (c) => {
//   await c.env.CONFIG.put("vectorStoreId", "your_vector_store_id");
//   await c.env.CONFIG.put("assistantId", "your_assistant_id");
//   c.json({ message: "Added Vector and Assistant IDs" });
// });

app.get("/remove-variables", async (c) => {
  await c.env.CONFIG.delete("vectorStoreId");
  await c.env.CONFIG.delete("assistantId");
 return c.json({ message: "Cleared Vector and Assistant IDs" });
});


// Basic hello world route
app.get("/", (c) => c.text("Hello :)!"));

export default app;
