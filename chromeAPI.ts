import { YouTubePlaylistContentDetails } from "@/types.ts";
import dummydata from "@/data/DUMMYDATA.json";
import Promise from "lie";
import { API_URI } from "@/config.ts";
import { API_KEY } from "@/env.ts";
import { fetchJson } from "@/helper.ts";

export const playlistAPI = async function (
  playlistId: string,
  apiKey: string = API_KEY,
  nextpageToken: string | null = null,
  dummy: boolean = false, //parameter for testing purposes
): Promise<YouTubePlaylistContentDetails | null | undefined> | null {
  if (!playlistId || !apiKey) return null;

  console.log("chromeAPI triggered");

  if (dummy) {
    // Simulate network delay and return dummy data
    return new Promise<YouTubePlaylistContentDetails | null>((resolve) => {
      setTimeout(() => {
        resolve(dummydata as YouTubePlaylistContentDetails);
      }, 1000); // Simulate network delay
    });
  }

  // TODO this is returning null
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
