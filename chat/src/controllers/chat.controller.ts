import { Hono } from "hono";
import {
  openaiService,
  getOrCreateAssistant,
  updateAssistantDescription,
  getAssistantvectorStore,
} from "../services/openAi.service";
import { getOrCreateThread } from "../services/thread.service";

type Env = {
  Bindings: {
    OPENAPI_API_KEY: string;
    CONFIG: KVNamespace;
    DB: D1Database;
  };
};

const chatRouter = new Hono<Env>();
// const threadByUser: any = {
//   "67512f3beeb3e4da17ab367d":"thread_5nRvV7O5c2GA2r3n7rRbBgWN"
// };

chatRouter.post("/ask", async (c) => {
  try {
    // console.log("assistant", await c.req.json());
    const {
      message,
      userId,
    }: // userId,
    // ,userId
    any = await c.req.json();
    const apiKey = c.env.OPENAPI_API_KEY;
    const db = c.env.DB;
    if (!apiKey) {
      return c.json({ message: "API key missing." }, 400);
    }
    // const userId = "67512f3beeb3e4da17ab367d";
    if (!userId) {
      return c.json({ message: "UserId is missing." }, 400);
    }

    const openai = openaiService(apiKey);
    const assistantId = await getOrCreateAssistant(openai, c.env.CONFIG);
    console.log(assistantId, "assistantId");
    const threadId = await getOrCreateThread(userId, db, openai);

    if (!message) {
      return c.json({ message: "Message is required" }, 400);
    }
    const modelToUse = "gpt-4o-mini";

    // if (!threadByUser[userId]) {
    //   try {
    //     const newThread = await openai.beta.threads.create();
    //     threadByUser[userId] = newThread.id;
    //   } catch (error) {
    //     console.error("Error creating thread:", error);
    //     return c.json({ error: "Internal server error" }, 500);
    //   }
    // }

    try {
      // console.log(threadByUser[userId],"threadByUser[userId]")
      await openai.beta.threads.messages.create(threadId, {
        role: "user",
        content: message,
      });

      const run = await openai.beta.threads.runs.create(threadId, {
        model: modelToUse,
        assistant_id: assistantId,
        // instructions:
        // "Limit your response to 50 words. If the information is not found in the file, respond only with 'This information was not found in the file.' Do not use general knowledge or include information outside of the file.",
        // instructions:instructions,
        tools: [{ type: "file_search" }],
      });

      const waitForRunCompletion = async () => {
        while (true) {
          const runStatus = await openai.beta.threads.runs.retrieve(
            threadId,
            run.id
          );
          console.log(`Run status: ${runStatus.status}`);
          if (runStatus.status === "completed") {
            break;
          }
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      };

      await waitForRunCompletion();
      const allMessages: any = await openai.beta.threads.messages.list(
        threadId
      );
      const responseContent =
        allMessages.data[0]?.content[0]?.text?.value || "No response";

      return c.json({ message: responseContent });
    } catch (error) {
      console.error("Error processing request:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  } catch (error) {
    console.error("Error parsing request:", error);
    return c.json({ error: "Invalid request payload" }, 500);
  }
});

chatRouter.get("/retrive/:userId", async (c) => {
  // retrive thread
  try {
    const openai = openaiService(c.env.OPENAPI_API_KEY);
    const userId = c.req.param("userId");
    const db = c.env.DB;
    if (!userId) {
      return c.json({ message: "UserId is missing." }, 400);
    }

    const threadId = await getOrCreateThread(userId, db, openai);
    const resp: any = await openai.beta.threads.messages.list(threadId);
    const data = resp.data;
    const filteredMessages = data
      .filter(
        (message: { role: string }) =>
          message.role === "user" || message.role === "assistant"
      )
      .map(
        (message: { id: any; role: any; created_at: any; content: any[] }) => ({
          id: message.id,
          role: message.role,
          created_at: message.created_at,
          content: message.content
            .map(
              (contentItem: { text: { value: string } }) =>
                contentItem.text.value
            )
            .join(" "),
        })
      );

    const result = {
      messages: filteredMessages,
    };

    return c.json({ result });
  } catch (error) {
    console.error("Error handling request:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

chatRouter.post("/description-update", async (c) => {
  try {
    const apiKey = c.env.OPENAPI_API_KEY;
    if (!apiKey) {
      return c.json({ message: "API key missing." }, 500);
    }
    const openai = openaiService(apiKey);
    const { description, instructions }: any = await c.req.json();
    if (!description) {
      return c.json({ message: "Description is required" }, 400);
    }

    if (!instructions) {
      return c.json({ message: "Instructions are required" }, 400);
    }
    const result = await updateAssistantDescription(
      openai,
      c.env.CONFIG,
      description,
      instructions
    );
    return c.json({ result }, 200);
  } catch (error) {
    console.error("Error parsing request:", error);
    return c.json({ error: "Invalid request payload" }, 400);
  }
});

chatRouter.get("/vector-stores", async (c) => {
  try {
    const apiKey = c.env.OPENAPI_API_KEY;
    if (!apiKey) {
      return c.json({ message: "API key missing." }, 500);
    }

    const openai = openaiService(apiKey);
    const result = await getAssistantvectorStore(openai, c.env.CONFIG);
    return c.json({ result }, 200);
  } catch (error) {
    console.error("Error parsing request:", error);
    return c.json({ error: "Invalid request payload" }, 400);
  }
});

export default chatRouter;
