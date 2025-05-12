import {
  YouTubePlaylistContentDetails,
  YouTubeVideoResponse,
} from "@/types.ts";
import dummydata from "@/data/DUMMYDATA.json";
import { API_URI } from "@/config.ts";
import { API_KEY } from "@/env.ts";
import { fetchJson } from "@/helper.ts";

export const playlistAPI = async function (
  playlistId: string,
  apiKey: string | null = API_KEY,
  nextpageToken: string | null = null,
  dummy: boolean = false, //parameter for testing purposes
): Promise<YouTubePlaylistContentDetails | null> {
  if (!playlistId) return null;

  console.log("chromeAPI.playlist triggered");

  if (dummy) {
    // Simulate network delay and return dummy data
    //@ts-ignore
    return new Promise<YouTubePlaylistContentDetails | null>((resolve) => {
      setTimeout(() => {
        resolve(dummydata as YouTubePlaylistContentDetails);
      }, 1000); // Simulate network delay
    });
  }

  const data = await fetchJson<YouTubePlaylistContentDetails>(
    API_URI +
      `&playlistId=${playlistId}&key=${apiKey}` +
      (nextpageToken ? `&pageToken=${nextpageToken}` : ""),
  );

  if (data.nextPageToken) {
    const recurData = await playlistAPI(playlistId, apiKey, data.nextPageToken);
    // console.log("=>(chromeAPI.ts:40) recurData", recurData);
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
  apiKey: string = API_KEY,
): Promise<YouTubeVideoResponse | null> {
  if (!videoId || !apiKey) return null;
  console.log("chromeAPI.video triggered");
  return await fetchJson<YouTubeVideoResponse>(
    `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoId}&key=${apiKey}`,
  );
};
