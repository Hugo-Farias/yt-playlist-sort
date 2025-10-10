import { clog, getCache, getListId } from "@/helper.ts";
import type { YoutubePlaylistResponse } from "@/types.ts";
import { API_URL } from "./config";

// let tries = 0;

const fetchJson = async <T = unknown>(
  input: RequestInfo,
  init?: RequestInit,
): Promise<T> => {
  const res = await fetch(input, init);
  console.log("res ==> ", res);

  if (!res.ok) {
    if (res.status === 403 || res.status === 400) {
      // throw new Error("API key has reached its quota limit.");
      return {} as T;
    }
    const errorText = await res.text();
    throw new Error(`Fetch error ${res.status}: ${errorText}`);
  }

  return (await res.json()) as Promise<T>;
};

type GistFile = { keys: string[] };

export const fetchGist = async (): Promise<GistFile> => {
  const data = await fetchJson<GistFile>(
    "https://gist.githubusercontent.com/Hugo-Farias/73ecbbbf06598d234bd795b9d8696a0f/raw/ytSort.json",
  );
  return data;
};

// let gist: GistFile;
// TODO: test with fake keys
const dummyGist: GistFile = {
  keys: [
    "AIzaSyC7bX4gk1fJH3jv5r8KX9ZL5mY2Qz8X9YQ", // fake key
    "AIzaSyAq1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6", // fake key
  ],
};

export const playlistAPI = async (
  playlistId: string,
  nextpageToken: string | null = null,
): Promise<YoutubePlaylistResponse | null> => {
  if (!playlistId) return null;

  clog("chromeAPI called");

  // if (!gist) gist = await fetchGist();

  const keyNum = new Date().getSeconds() % dummyGist.keys.length;
  const key = dummyGist.keys[keyNum] || "";
  console.log("key ==> ", key);

  const data = await fetchJson<YoutubePlaylistResponse>(
    `${API_URL}&playlistId=${playlistId}&key=${key}${nextpageToken ? `&pageToken=${nextpageToken}` : ""}`,
  );
  console.log("data ==> ", data);

  // if (!data?.etag) {
  //   clog("API key failed, rotating key");
  //   // TODO: recur with backup API key
  //   return null;
  // }

  if (!data.pageInfo || data.pageInfo.totalResults === 0) return null;

  const apiCache = getCache("ytSortMainCache", getListId(window.location.href));

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
