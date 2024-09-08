import { type NextRequest } from "next/server";

export const detectBot = (req: NextRequest): boolean => {
  const url = req.nextUrl;

  // Check if "bot" is present in the URL query parameters
  if (url.searchParams.get("bot")) return true;

  const ua = req.headers.get("User-Agent")?.toLowerCase(); // Lowercase for consistent matching
  if (ua) {
    // Predefined regex for matching common bots and crawlers
    const botRegex =
      /bot|robot|chatgpt|import|gpt|twitter|pinterest|mj12bot|webhose|zyte|dexi|facebookexternalhit|uptimerobot|whatsapp|sogou|google|parsehub|ia_archiver|spider|jetoctopus|deepcrawl|cognitiveseo|apple|baidu|sequentum|octoparse|bing|ccbot|yeti|ahrefsbot|exabot|linkedin|msn|reddit|semrushbot|oncrawl|outwit|blex|contentking|getleft|httrack|megaindex|cyotek|visual|helium|scraper|80legs|rogerbot|webharvy|duckduckbot|teoma|botify|slurp|yandex|swiftbot|metainspector|sitebulb|go-http-client|iframely/i;

    return botRegex.test(ua);
  }

  // Default to false if no bot or crawler is detected
  return false;
};
