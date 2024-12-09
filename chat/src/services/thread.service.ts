// Access D1 binding

export async function getOrCreateThread(
  userId: any,
  db: any,
  openai: { beta: { threads: { create: () => any } } }
) {

  const existingThread = await db
    .prepare("SELECT thread_id FROM threads WHERE user_id = ?")
    .bind(userId)
    .first();
    
  if (existingThread) {
    return existingThread.thread_id;
  }

  // Create a new thread using OpenAI API
  const newThread = await openai.beta.threads.create();
  await db
    .prepare("INSERT INTO threads (user_id, thread_id) VALUES (?, ?)")
    .bind(userId, newThread.id)
    .run();
  return newThread.id;
}
