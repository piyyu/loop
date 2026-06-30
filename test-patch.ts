import { SearchService } from "jiosaavn-sdk";

const originalFetch = global.fetch;
global.fetch = async (input, init) => {
  const url = input?.toString() || "";
  if (url.includes("jiosaavn.com")) {
    const newHeaders = new Headers(init?.headers);
    newHeaders.set("Cookie", "geo=103.155.223.1%2CIN%2CMaharashtra%2CMumbai%2C400001; L=english,hindi;");
    return originalFetch(input, { ...init, headers: newHeaders });
  }
  return originalFetch(input, init);
};

async function run() {
  const s = new SearchService();
  try {
    const data = await s.searchSongs({ query: "believer", page: 1, limit: 3 });
    console.log("Success:", JSON.stringify(data.results?.map(r => r.name), null, 2));
  } catch (err) {
    console.error("Error:", err);
  }
}
run();
