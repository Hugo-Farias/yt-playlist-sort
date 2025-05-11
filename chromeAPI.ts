import get from "axios";
import { YouTubePlaylistItemListResponse } from "@/types.ts";
import dummydata from "@/data/DUMMYDATA.json";
import Promise from "lie";
import { API_URI } from "@/config.ts";
import { API_KEY } from "@/env.ts";

const chromeAPI = function (
  playlistId: string,
  apiKey: string = API_KEY,
  //parameter for testing purposes
  dummy: boolean = false,
): Promise<YouTubePlaylistItemListResponse | null> | null {
  if (!playlistId || !apiKey) return null;

  console.log("chromeAPI triggered");

  if (dummy) {
    // Simulate network delay and return dummy data
    return new Promise<YouTubePlaylistItemListResponse | null>((resolve) => {
      setTimeout(() => {
        resolve(dummydata as YouTubePlaylistItemListResponse);
      }, 1000); // Simulate network delay
    });
  }

  return get(API_URI + `&playlistId=${playlistId}&key=${apiKey}`)
    .then((res) => {
      return res.data;
    })
    .catch((err) => {
      console.error("axios fetch error", err);
      return null;
    });
};

export default chromeAPI;
