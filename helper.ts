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

export const comparePlaylist = (
  a: YouTubePlaylistItem[],
  b: renderedPlaylistItem[],
): boolean => {
  if (!a || !b) return false;
  if (typeof a !== typeof b) return false;

  const idList = b.map((item) => {
    // console.log("=>(helper.ts:58) item.videoId", item.videoId);
    return item.videoId;
  });

  console.log("=>(helper.ts:58) idList", idList);

  return a.every((item, index) => {
    if (item === null || idList.includes(item.contentDetails.videoId))
      return true;

    console.log(
      "=>(helper.ts:66) item.contentDetails.videoId",
      item.contentDetails.videoId,
    );
    debugger;
    return checkVideoAvailability(item.contentDetails.videoId).then(
      (isAvailable) => {
        if (isAvailable) {
          return false;
        }
        return !isAvailable;
      },
    );
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
