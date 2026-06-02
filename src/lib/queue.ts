import { Queue, Worker, Job } from "bullmq";
import { scrapeUrl, scrapePortal, getAllPortals } from "./apify";
import { deduplicateProperties } from "./dedup";
import { processBatchProperties } from "./notification-service";
import type { NormalizedProperty } from "@/types/property";

const connection = {
  host: "localhost",
  port: 6379,
  maxRetriesPerRequest: null,
};

export const scrapingQueue = new Queue("scraping", {
  connection,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
  },
});

export interface ScrapeUrlJobData {
  type: "scrape-url";
  url: string;
  userId?: string;
}

export interface ScrapePortalJobData {
  type: "scrape-portal";
  portal: string;
  maxItems?: number;
  userId?: string;
}

export interface ScrapeAllJobData {
  type: "scrape-all";
  maxItemsPerPortal?: number;
  userId?: string;
}

type ScrapeJobData = ScrapeUrlJobData | ScrapePortalJobData | ScrapeAllJobData;

async function processScrapeJob(job: Job<ScrapeJobData>): Promise<{
  total: number;
  new: number;
  properties: NormalizedProperty[];
  notifications: {
    matched: number;
    sent: number;
  };
}> {
  const { type } = job.data;

  switch (type) {
    case "scrape-url": {
      await job.updateProgress({ step: "scraping", url: job.data.url });
      const properties = await scrapeUrl(job.data.url);
      const newProperties = deduplicateProperties(properties);

      await job.updateProgress({ step: "matching", count: newProperties.length });
      const notifResult = await processBatchProperties(newProperties);

      await job.updateProgress({
        step: "completed",
        total: properties.length,
        new: newProperties.length,
        matched: notifResult.matched,
        sent: notifResult.notificationsSent,
      });

      return {
        total: properties.length,
        new: newProperties.length,
        properties: newProperties,
        notifications: {
          matched: notifResult.matched,
          sent: notifResult.notificationsSent,
        },
      };
    }

    case "scrape-portal": {
      await job.updateProgress({ step: "scraping", portal: job.data.portal });
      const maxItems = job.data.maxItems || 50;
      const properties = await scrapePortal(job.data.portal, maxItems);
      const newProperties = deduplicateProperties(properties);

      await job.updateProgress({ step: "matching", count: newProperties.length });
      const notifResult = await processBatchProperties(newProperties);

      await job.updateProgress({
        step: "completed",
        total: properties.length,
        new: newProperties.length,
        matched: notifResult.matched,
        sent: notifResult.notificationsSent,
      });

      return {
        total: properties.length,
        new: newProperties.length,
        properties: newProperties,
        notifications: {
          matched: notifResult.matched,
          sent: notifResult.notificationsSent,
        },
      };
    }

    case "scrape-all": {
      const portals = getAllPortals();
      const maxItems = job.data.maxItemsPerPortal || 50;
      const allProperties: NormalizedProperty[] = [];

      for (let i = 0; i < portals.length; i++) {
        const portal = portals[i];
        await job.updateProgress({
          step: "scraping-portal",
          portal: portal.slug,
          current: i + 1,
          total: portals.length,
        });

        try {
          const properties = await scrapePortal(portal.slug, maxItems);
          allProperties.push(...properties);
        } catch (error) {
          console.error(`Error scraping ${portal.slug}:`, error);
        }
      }

      const newProperties = deduplicateProperties(allProperties);

      await job.updateProgress({ step: "matching", count: newProperties.length });
      const notifResult = await processBatchProperties(newProperties);

      await job.updateProgress({
        step: "completed",
        total: allProperties.length,
        new: newProperties.length,
        matched: notifResult.matched,
        sent: notifResult.notificationsSent,
      });

      return {
        total: allProperties.length,
        new: newProperties.length,
        properties: newProperties,
        notifications: {
          matched: notifResult.matched,
          sent: notifResult.notificationsSent,
        },
      };
    }

    default:
      throw new Error(`Unknown job type: ${type}`);
  }
}

export function createScrapingWorker() {
  const worker = new Worker<ScrapeJobData>("scraping", processScrapeJob, {
    connection,
    concurrency: 3,
    limiter: {
      max: 5,
      duration: 60000,
    },
  });

  worker.on("completed", (job) => {
    console.log(`Job ${job.id} completed:`, job.returnvalue);
  });

  worker.on("failed", (job, err) => {
    console.error(`Job ${job?.id} failed:`, err.message);
  });

  return worker;
}

export async function scheduleRecurringScrape(
  intervalMinutes: number = 15
): Promise<void> {
  const existingJobs = await scrapingQueue.getJobSchedulers();
  for (const job of existingJobs) {
    if (job.name === "recurring-scrape-all" && job.id) {
      await scrapingQueue.removeJobScheduler(job.id);
    }
  }

  await scrapingQueue.add(
    "recurring-scrape-all",
    { type: "scrape-all", maxItemsPerPortal: 50 } as ScrapeAllJobData,
    {
      repeat: {
        every: intervalMinutes * 60 * 1000,
      },
    }
  );

  console.log(`Scheduled recurring scrape every ${intervalMinutes} minutes`);
}

export async function addScrapeUrlJob(
  url: string,
  userId?: string
): Promise<Job<ScrapeUrlJobData>> {
  return scrapingQueue.add(
    "scrape-url",
    { type: "scrape-url", url, userId } as ScrapeUrlJobData,
    { priority: 1 }
  );
}

export async function addScrapePortalJob(
  portal: string,
  maxItems?: number,
  userId?: string
): Promise<Job<ScrapePortalJobData>> {
  return scrapingQueue.add(
    "scrape-portal",
    { type: "scrape-portal", portal, maxItems, userId } as ScrapePortalJobData,
    { priority: 2 }
  );
}
