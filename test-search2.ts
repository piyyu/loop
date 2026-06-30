import { JioSaavnProvider } from "./src/providers/jiosaavn-provider";
async function run() {
  const p = new JioSaavnProvider();
  const songs = await p.searchSong("believer");
  console.log(JSON.stringify(songs, null, 2));
}
run();
