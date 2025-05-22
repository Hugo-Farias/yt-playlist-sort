import {
  CachedPlaylistData,
  countryIs,
  renderedPlaylistItem,
  YoutubePlaylistResponse,
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
  data: YoutubePlaylistResponse,
) => {
  localStorage.setItem(
    "playlistCache",
    JSON.stringify({
      ...getCache(null),
      [playlistId]: { ...data, listId: playlistId, storeTime: Date.now() },
    }),
  );
};

//TODO this has to compare the rendered playlist to a chached version of the rendered playlist instead of the data from the API
export const comparePlaylist = (
  a: CachedPlaylistData,
  b: renderedPlaylistItem[],
): boolean => {
  if (!a || !b) return false;
  if (typeof a !== typeof b) return false;

  const renderedIdList = b.map((item) => item.videoId);

  // console.log("=>(helper.ts:58) renderedIdList", renderedIdList);

  return a.items.every((item, index) => {
    if (
      !item.available ||
      renderedIdList.includes(item.contentDetails.videoId)
    ) {
      return true;
    }

    return checkVideoAvailability(item.contentDetails.videoId).then(
      (isAvailable) => {
        storeCache(a.listId, {
          ...a,
          items: a.items.map((value, i) =>
            i === index ? { ...value, available: isAvailable } : value,
          ),
        });

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
