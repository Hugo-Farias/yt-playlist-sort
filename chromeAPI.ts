import { YoutubePlaylistResponse } from "@/types.ts";
import { API_URL } from "./config";
import { API_KEY } from "@/env.ts";

const fetchJson = async <T = unknown>(
  input: RequestInfo,
  init?: RequestInit,
): Promise<T> => {
  const res = await fetch(input, init);

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Fetch error ${res.status}: ${errorText}`);
  }

  return (await res.json()) as Promise<T>;
};

export const playlistAPI = async function (
  playlistId: string,
  nextpageToken: string | null = null,
): Promise<YoutubePlaylistResponse | null> {
  if (!playlistId) return null;

  console.log("chromeAPI.playlist triggered");

  const data = await fetchJson<YoutubePlaylistResponse>(
    `${API_URL}&playlistId=${playlistId}&key=${API_KEY}${nextpageToken ? `&pageToken=${nextpageToken}` : ""}`,
  );

  if (data.nextPageToken) {
    const recurData = await playlistAPI(playlistId, data.nextPageToken);
    if (!recurData) return null;
    return {
      ...data,
      items: [...data.items, ...recurData?.items],
    };
  }

  return data;
};
