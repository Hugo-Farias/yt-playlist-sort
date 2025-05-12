import {
  CachedPlaylistData,
  countryIs,
  renderedPlaylistItem,
  YouTubePlaylistContentDetails,
  YouTubePlaylistItem,
} from "@/types.ts";

export async function fetchJson<T = unknown>(
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

export const getListId = (url: string) => {
  if (url.length <= 0) return null;
  return new URL(url).searchParams.get("list");
};

export const getVideoId = (url: string): string | null => {
  if (url.length <= 0) return null;
  return new URL(url).searchParams.get("v");
};

export const storeCache = (
  playlistId: string,
  data: YouTubePlaylistContentDetails,
) => {
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
  // if (a.length !== b.length) return false;

  return a.every((v, i) => {
    if (v.contentDetails.videoId === b[i].videoId) {
      checkVideoAvailability(v.contentDetails.videoId).then((value) => {
        console.log(value);
      });
    }
  });
};

const checkVideoAvailability = async (videoId: string): Promise<string> => {
  const response = await fetchJson<countryIs>("https://api.country.is/");
  // const response = await response.json();
  return response.country;
};
