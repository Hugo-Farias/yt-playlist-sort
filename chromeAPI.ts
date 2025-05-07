import { fetchURL } from "@/helper.ts";
import dummydata from "@/data/DUMMYDATA.json";
import { YouTubePlaylistItemListResponse } from "@/types.ts";

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
): YouTubePlaylistItemListResponse {
  const baseUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${apiKey}`;
  // let nextPageToken: string | undefined;
  // let allItems: PlaylistItem[] = [];

  // return fetchURL(baseUrl);
  return dummydata;
};
