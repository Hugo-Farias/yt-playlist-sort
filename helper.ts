import {
  CachedPlaylistData,
  renderedPlaylistItem,
  YouTubePlaylistContentDetails,
  YouTubePlaylistItem,
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
  data: YouTubePlaylistContentDetails,
) => {
  // const cachedData = getCache(playlistId) || {};

  // console.log("=>(helper.ts:22) cachedData", cachedData);

  localStorage.setItem(
    "playlistCache",
    JSON.stringify({
      ...getCache(null),
      [playlistId]: { ...data, listId: playlistId, storeTime: Date.now() },
    }),
  );
};

export const getCache = (
  playlistId: string | null,
): CachedPlaylistData | null => {
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
    return v.contentDetails.videoId === b[i].videoId;
  });
};
