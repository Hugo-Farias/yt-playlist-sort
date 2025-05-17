import {
  CachedPlaylistData,
  countryIs,
  renderedPlaylistItem,
  YouTubePlaylistContentDetails,
  YouTubePlaylistItem,
} from "@/types.ts";
import { videoAPI } from "@/chromeAPI.ts";

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

export const checkPlaylist = (
  a: YouTubePlaylistItem[] | null,
  b: renderedPlaylistItem[] | null,
): boolean => {
  if (!a || !b) return false;
  if (typeof a !== typeof b) return false;
  // if (a.length !== b.length) return false;

  // TODO change this to standard "for" loop
  return a.every(async (_, i) => {
    if (i === 53) debugger;

    const { videoId } = a[i].contentDetails;
    // console.log(i, videoId);
    if (b[i] === null || videoId === b[i].videoId) {
      return true;
    } else if (videoId !== b[i].videoId) {
      // TODO this is checking every video after first not available
      return await checkVideoAvailability(videoId).then((isAvailable) => {
        console.log("=>(helper.ts:62) isAvailable", isAvailable);
        if (!isAvailable) {
          console.log("=>(helper.ts:65) b[i]", b[i]);
          b.splice(i, 0, null);
          console.log("=>(helper.ts:65) b", b);
          return true;
          // console.log(videoId, "sliced");
        }
        return false;
      });
    }
  });
};

export const getCache = (
  playlistId: string | null,
): CachedPlaylistData | null => {
  const data = localStorage.getItem("playlistCache");
  if (!data) return null;
  if (!playlistId) return JSON.parse(data);
  return JSON.parse(data)[playlistId];
};

const checkVideoAvailability = async (
  videoId: string,
): Promise<boolean | undefined> => {
  const videoInfo = await videoAPI(videoId);
  if (!videoInfo) return false;
  if (!videoInfo.items[0].contentDetails.regionRestriction) return true;

  const { country } = await fetchJson<countryIs>("https://api.country.is/");

  return !videoInfo.items[0].contentDetails.regionRestriction?.blocked?.includes(
    country,
  );
};
