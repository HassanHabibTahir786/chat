import { OpenAI } from "openai";

export function openaiService(apiKey: string): OpenAI {
  return new OpenAI({
    apiKey: apiKey,
  });
}

// Function to get or create the assistant and store its ID in Cloudflare KV
export async function getOrCreateAssistant(
  openai: OpenAI,
  kv: KVNamespace
): Promise<string> {
  let assistantId = await kv.get("assistantId");

  if (!assistantId) {
    // Create a new assistant if none exists
    const assistant = await openai.beta.assistants.create({
      name: "File Assistant",
      // description:
        // "Please provide answers strictly from the file content provided via the `file_search` tool. Limit your response to 50 words. If the information is not found in the file, respond only with 'This information was not found in the file.' Do not use general knowledge or include information outside of the file.",
      model: "gpt-4o-mini",
      tools: [{ type: "file_search" }, { type: "code_interpreter" }],
      tool_resources: { file_search: { vector_store_ids: [] } },
    });

    assistantId = assistant.id;
    await kv.put("assistantId", assistantId);
  }
  return assistantId;
}

export async function getOrCreateVectorStore(
  assistantId: any | null,
  openai: OpenAI
) {
  let vectorStoreId;
  let existingAssistant: any;

  if (assistantId) {
    existingAssistant = await openai.beta.assistants.retrieve(assistantId);
    if (
      existingAssistant.tool_resources.file_search.vector_store_ids.length > 0
    ) {
      vectorStoreId =
        existingAssistant.tool_resources.file_search.vector_store_ids[0];
    } else {
      const newVectorStore = await openai.beta.vectorStores.create({
        name: "assistantFilesForChat",
      });
      vectorStoreId = newVectorStore.id;
      await openai.beta.assistants.update(assistantId, {
        tool_resources: { file_search: { vector_store_ids: [vectorStoreId] } },
      });
    }
  } else {
    const newVectorStore = await openai.beta.vectorStores.create({
      name: "assistantFilesForChat",
    });
    vectorStoreId = newVectorStore.id;
  }

  return vectorStoreId;
}

// Function to update the assistant's description
export async function updateAssistantDescription(
  openai: OpenAI,
  kv: KVNamespace,
  newDescription: string,
  newInstructions: string
): Promise<any> {
  const assistantId = await kv.get("assistantId");
  if (!assistantId) {
    throw new Error("Assistant ID not found. Create the assistant first.");
  }

  // Update the assistant's description
  const result = await openai.beta.assistants.update(assistantId, {
    description: newDescription,
    instructions: newInstructions,
  });

  return result;
}

export async function getAssistantvectorStore(
  openai: OpenAI,
  kv: KVNamespace
): Promise<any> {
  const assistantId = await kv.get("assistantId");
  const vectorStores = await openai.beta.vectorStores.list();
  // const files = await openai.beta.vectorStores.retrieve("vs_UCUImzqHWkYtFb9WiySqSD8R");
  // console.log(files);
  return vectorStores;
}

// export async function getVectorStoreFiles(openai: OpenAI, kv: KVNamespace): Promise<any> {
//   const assistantId = await kv.get("assistantId");
//   const files = await openai.beta.vectorStores.retrieve("vs_UCUImzqHWkYtFb9WiySqSD8R");
//   console.log(files);
//   return vectorStores;
// }
