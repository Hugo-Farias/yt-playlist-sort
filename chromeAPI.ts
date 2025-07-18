import { YoutubePlaylistResponse, YouTubeVideoResponse } from "@/types.ts";
import dummydata from "@/data/DUMMYDATA.json";
// import { API_URL } from "@/config.ts";
import { API_KEY } from "@/env.ts";
import { getPlaylistItemsUrl } from "@/helper.ts";

// TODO change this to a variable function
async function fetchJson<T = unknown>(
  input: RequestInfo,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(input, init);

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Fetch error ${res.status}: ${errorText}`);
  }

  return (await res.json()) as Promise<T>;
}
export const playlistAPI = async function (
  playlistId: string,
  nextpageToken: string | null = null,
  dummy: boolean = false, //parameter for testing purposes
): Promise<YoutubePlaylistResponse | null> {
  if (!playlistId) return null;

  console.log("chromeAPI.playlist triggered");

  if (dummy) {
    // Simulate network delay and return dummy data
    //@ts-ignore
    return new Promise<YoutubePlaylistResponse | null>((resolve) => {
      setTimeout(() => {
        resolve(dummydata as YoutubePlaylistResponse);
      }, 1000); // Simulate network delay
    });
  }

  const data = await fetchJson<YoutubePlaylistResponse>(
    getPlaylistItemsUrl(playlistId, API_KEY, nextpageToken),
  );

  if (data.nextPageToken) {
    const recurData = await playlistAPI(playlistId, data.nextPageToken);
    if (!recurData) return null;
    return {
      ...data,
      items: [...data.items, ...recurData?.items],
    };
  }

  return data;
};

export const videoAPI = async function (
  videoId: string,
): Promise<YouTubeVideoResponse | null> {
  if (!videoId) return null;
  console.log("chromeAPI.video triggered");
  return await fetchJson<YouTubeVideoResponse>(
    `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoId}&key=${API_KEY}`,
  );
};
