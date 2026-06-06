import * as cheerio from "cheerio";

interface ScrapedProperty {
  portal: string;
  portalId: string;
  url: string;
  title: string;
  description: string;
  price: string;
  currency: string;
  address: string;
  city: string;
  state: string;
  bedrooms: number;
  bathrooms: number;
  area: string;
  expenses: string;
  images: string[];
}

function extractId(url: string, portal: string): string {
  const patterns: Record<string, RegExp> = {
    zonaprop: /-(\d+)\.html/,
    argenprop: /--(\d+)/,
  };
  const match = url.match(patterns[portal] || /(\d+)/);
  return match ? match[1] : `${portal}-${Date.now()}`;
}

export async function scrapeZonaprop(searchUrl: string): Promise<ScrapedProperty[]> {
  const listPageUrl = searchUrl.includes("zona")
    ? searchUrl
    : searchUrl.replace(/\.html.*$/, ".html");

  const res = await fetch(listPageUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "es-AR,es;q=0.9,en;q=0.8",
    },
  });

  if (!res.ok) return [];

  const html = await res.text();
  const $ = cheerio.load(html);
  const properties: ScrapedProperty[] = [];

  const cards = $("[data-qa='posting'],.posting-card,.aviso-card,.posting-card-body,.card-aviso").toArray();

  if (cards.length === 0) {
    $("a[href*='posting'],a[href*='propiedad']").each((_, el) => {
      const href = $(el).attr("href");
      if (!href) return;
      const fullUrl = href.startsWith("http") ? href : `https://www.zonaprop.com.ar${href}`;
      const title = $(el).find("h2,h3,.posting-title,.aviso-title").first().text().trim();
      const priceText = $(el).find("[data-qa='posting-price'],.price,.posting-price").first().text().trim();
      const img = $(el).find("img").first().attr("src") || "";

      if (title) {
        properties.push({
          portal: "zonaprop",
          portalId: extractId(fullUrl, "zonaprop"),
          url: fullUrl,
          title,
          description: "",
          price: priceText.replace(/[^0-9.]/g, "") || "0",
          currency: priceText.includes("USD") ? "USD" : "ARS",
          address: "",
          city: "",
          state: "Capital Federal",
          bedrooms: 0,
          bathrooms: 0,
          area: "",
          expenses: "",
          images: img ? [img] : [],
        });
      }
    });
  }

  return properties.slice(0, 30);
}

export async function scrapeArgenprop(searchUrl: string): Promise<ScrapedProperty[]> {
  const res = await fetch(searchUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "es-AR,es;q=0.9,en;q=0.8",
    },
  });

  if (!res.ok) return [];

  const html = await res.text();
  const $ = cheerio.load(html);
  const properties: ScrapedProperty[] = [];

  $(".listing-card,.card_listing,.property-card,[data-id]").each((_, el) => {
    const card = $(el);
    const link = card.find("a[href]").first().attr("href") || "";
    const fullUrl = link.startsWith("http") ? link : `https://www.argenprop.com${link}`;
    const title = card.find("h2,h3,.card__title,.posting-title").first().text().trim();
    const priceText = card.find(".card__price,.price,.posting-price").first().text().trim();
    const img = card.find("img").first().attr("src") || "";

    if (title) {
      properties.push({
        portal: "argenprop",
        portalId: extractId(fullUrl, "argenprop"),
        url: fullUrl,
        title,
        description: "",
        price: priceText.replace(/[^0-9.]/g, "") || "0",
        currency: priceText.includes("USD") ? "USD" : "ARS",
        address: "",
        city: "",
        state: "",
        bedrooms: 0,
        bathrooms: 0,
        area: "",
        expenses: "",
        images: img ? [img] : [],
      });
    }
  });

  return properties.slice(0, 30);
}

export async function scrapeWithCheerio(url: string): Promise<ScrapedProperty[]> {
  if (url.includes("zonaprop")) {
    return scrapeZonaprop(url);
  }
  if (url.includes("argenprop")) {
    return scrapeArgenprop(url);
  }
  return [];
}
