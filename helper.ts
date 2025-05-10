import {
  localPlaylistItem,
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

export const storeCache = (data: YouTubePlaylistItemListResponse) => {
  localStorage.setItem("playlistCache", JSON.stringify(data));
};

export const getCache = (): YouTubePlaylistItemListResponse | null => {
  const data = localStorage.getItem("playlistCache");
  if (!data) return null;
  return JSON.parse(data);
};

export const checkPlaylist = (
  a: YouTubePlaylistItem[] | null,
  b: localPlaylistItem[] | null,
): boolean => {
  if (!a || !b) return false;
  if (typeof a !== typeof b) return false;
  if (a.length !== b.length) return false;

  return a.every((v, i) => {
    return v.snippet.resourceId.videoId === b[i].videoId;
  });
};
