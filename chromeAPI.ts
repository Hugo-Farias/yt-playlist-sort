import { GistFile, YoutubePlaylistResponse } from "@/types.ts";
import { API_URL } from "./config";
import { clog, getCache, getListId } from "@/helper.ts";

const fetchJson = async <T = unknown>(
  input: RequestInfo,
  init?: RequestInit,
): Promise<T> => {
  const res = await fetch(input, init);

  if (!res.ok) {
    if (res.status === 403) {
      // throw new Error("API key has reached its quota limit.");
      return {} as T;
    }
    const errorText = await res.text();
    throw new Error(`Fetch error ${res.status}: ${errorText}`);
  }

  return (await res.json()) as Promise<T>;
};

export const fetchGist = async (): Promise<GistFile> => {
  const data = await fetchJson<GistFile>(
    "https://gist.githubusercontent.com/Hugo-Farias/73ecbbbf06598d234bd795b9d8696a0f/raw/ytSort.json",
  );
  return data;
};

let gist: { keys: string[] };

export const playlistAPI = async function (
  playlistId: string,
  nextpageToken: string | null = null,
): Promise<YoutubePlaylistResponse | null> {
  if (!playlistId) return null;

  clog("chromeAPI called");

  if (!gist) gist = await fetchGist();

  const keyNum = new Date().getSeconds() % gist.keys.length;
  const key = gist.keys[keyNum] || "";

  const data = await fetchJson<YoutubePlaylistResponse>(
    `${API_URL}&playlistId=${playlistId}&key=${key}${nextpageToken ? `&pageToken=${nextpageToken}` : ""}`,
  );

  // if (!data?.etag) {
  //   clog("API key failed, rotating key");
  //   // TODO: recur with backup API key
  //   return null;
  // }

  if (data.pageInfo.totalResults === 0) return null;

  const apiCache = getCache("apiCache", getListId(window.location.href));

  if (data.etag === apiCache?.etag) {
    clog("etag match, interrupting fetch...");
    return null;
  }

  if (data.nextPageToken) {
    const recurData = await playlistAPI(playlistId, data.nextPageToken);
    if (!recurData) return null;
    return {
      ...data,
      items: [...data.items, ...recurData.items],
    };
  }

  return data;
};
