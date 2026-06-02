import { createScrapingWorker, scheduleRecurringScrape } from "./lib/queue";

async function main() {
  console.log("Starting Zuklo scraping worker...");

  const worker = createScrapingWorker();
  console.log("Worker created and listening for jobs");

  await scheduleRecurringScrape(15);
  console.log("Recurring scrape scheduled every 15 minutes");

  process.on("SIGINT", async () => {
    console.log("Shutting down worker...");
    await worker.close();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    console.log("Shutting down worker...");
    await worker.close();
    process.exit(0);
  });
}

main().catch(console.error);
