import get from "axios";
import { YouTubePlaylistContentDetails } from "@/types.ts";
import dummydata from "@/data/DUMMYDATA.json";
import Promise from "lie";
import { API_URI } from "@/config.ts";
import { API_KEY } from "@/env.ts";

const chromeAPI = function (
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

  return get<YouTubePlaylistContentDetails>(
    API_URI +
      `&playlistId=${playlistId}&key=${apiKey}` +
      (nextpageToken ? `&pageToken=${nextpageToken}` : ""),
  )
    .then((res) => {
      console.log("data response =>", res.data);
      if (res.data.nextPageToken) {
        chromeAPI(playlistId, apiKey, res.data.nextPageToken);
      }
      if (res.data) return { ...res.data, items: [...res.data.items] };
    })
    .catch((err) => {
      console.error("axios fetch error", err);
      return null;
    });
};

export default chromeAPI;
