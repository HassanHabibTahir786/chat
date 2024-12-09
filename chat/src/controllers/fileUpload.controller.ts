import { Hono } from "hono";
import {
  openaiService,
  getOrCreateVectorStore,
} from "../services/openAi.service";

type Env = {
  Bindings: {
    OPENAPI_API_KEY: string;
    CONFIG: KVNamespace;
  };
};

const uploadRouter = new Hono<Env>();
uploadRouter.post("/file-upload", async (c) => {
  try {
    const apiKey = c.env.OPENAPI_API_KEY;
    console.log(apiKey,"apikey");
    if (!apiKey) {
      return c.json({ message: "API key missing." }, 500);
    }
    const openai = openaiService(apiKey);
    let assistantId = await c.env.CONFIG.get("assistantId");
    if (!assistantId) {
      const assistant = await openai.beta.assistants.create({
        name: "File Assistant",
        description:
          "Assistant answers based on uploaded files only, and in friendly tone",
        model: "gpt-4o-mini",
        tools: [{ type: "file_search" }, { type: "code_interpreter" }],
        tool_resources: { file_search: { vector_store_ids: [] } },
      });
      assistantId = assistant.id;
      await c.env.CONFIG.put("assistantId", assistantId);
    }
    let vectorStoreId = await c.env.CONFIG.get("vectorStoreId");
    if (!vectorStoreId) {
      const vectorStore = await openai.beta.vectorStores.create({
        name: "assistantFilesForChat",
      });
      vectorStoreId = vectorStore.id;
      await c.env.CONFIG.put("vectorStoreId", vectorStoreId);
      await openai.beta.assistants.update(assistantId, {
        tool_resources: { file_search: { vector_store_ids: [vectorStoreId] } },
      });
    }
    const formData = await c.req.formData();
    const files = formData.getAll("files");
    if (!files || files.length === 0) {
      return c.json({ message: "No files were uploaded." }, 400);
    }
    const uploadedFiles = Array.isArray(files) ? files : [files];
    const fileLikeObjects: File[] = uploadedFiles.filter(
      (file) => file instanceof File
    );
    if (fileLikeObjects.length === 0) {
      return c.json({ message: "No valid files to upload." }, 400);
    }
    await openai.beta.vectorStores.fileBatches.uploadAndPoll(vectorStoreId, {
      files: fileLikeObjects,
    });
    return c.json({
      message: "Files uploaded successfully and assistant updated.",
      assistantId: assistantId,
      vectorStoreId: vectorStoreId,
    });
  } catch (error: any) {
    console.error("Error during file upload:", error);
    return c.json(
      { message: "Error during file upload: " + error.message },
      500
    );
  }
});

export default uploadRouter;
