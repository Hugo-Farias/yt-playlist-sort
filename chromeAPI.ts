// import get from "axios";
import { YouTubePlaylistItemListResponse } from "@/types.ts";
import dummydata from "@/data/DUMMYDATA.json";
import Promise from "lie";

// interface PlaylistItem {
//   snippet?: {
//     publishedAt?: string;
//     title?: string;
//   };
// }

// interface PlaylistItemsResponse {
//   items: PlaylistItem[];
//   nextPageToken?: string;
// }

export const getPlaylistInfo = function (
  playlistId: string,
  apiKey: string,
): Promise<YouTubePlaylistItemListResponse | null> | null {
  if (!playlistId || !apiKey) return null;

  // return get(
  //   `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${apiKey}`,
  // )
  //   .then((res) => {
  //     return res.data;
  //   })
  //   .catch((err) => {
  //     console.error("axios fetch error", err);
  //     return null;
  //   });

  // Simulate network delay and return dummy data
  return new Promise<YouTubePlaylistItemListResponse | null>((resolve) => {
    setTimeout(() => {
      resolve(dummydata as YouTubePlaylistItemListResponse);
    }, 1000); // Simulate network delay
  });
};
