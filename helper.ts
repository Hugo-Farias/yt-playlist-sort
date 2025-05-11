import {
  renderedPlaylistItem,
  YouTubePlaylistItem,
  YouTubePlaylistItemListResponse,
} from "@/types.ts";

export const getListId = (url: string) => {
  if (url.length <= 0) return null;
  return new URL(url).searchParams.get("list");
};

export const getVideoId = (url: string): string | null => {
  if (url.length <= 0) return null;
  return new URL(url).searchParams.get("v");
};

//TODO make new function that trims down the fat from the api data

export const storeCache = (
  playlistId: string,
  data: YouTubePlaylistItemListResponse,
) => {
  // const cachedData = getCache(playlistId) || {};

  // console.log("=>(helper.ts:22) cachedData", cachedData);

  localStorage.setItem(
    "playlistCache",
    JSON.stringify({
      ...getCache(null),
      [playlistId]: data,
    }),
  );

  const temp = getCache(null) || {};

  console.log(temp);

  console.log("cache size: ", Object.keys(temp).length);
};

export const getCache = (
  playlistId: string | null,
): YouTubePlaylistItemListResponse | null => {
  const data = localStorage.getItem("playlistCache");
  if (!data) return null;
  if (!playlistId) return JSON.parse(data);
  return JSON.parse(data)[playlistId];
};

export const checkPlaylist = (
  a: YouTubePlaylistItem[] | null,
  b: renderedPlaylistItem[] | null,
): boolean => {
  if (!a || !b) return false;
  if (typeof a !== typeof b) return false;
  if (a.length !== b.length) return false;

  return a.every((v, i) => {
    return v.snippet.resourceId.videoId === b[i].videoId;
  });
};
