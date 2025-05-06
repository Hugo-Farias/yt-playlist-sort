interface PlaylistItem {
  snippet?: {
    publishedAt?: string;
    title?: string;
    // Add other relevant snippet properties if needed
  };
}

interface PlaylistItemsResponse {
  items: PlaylistItem[];
  nextPageToken?: string;
}

export const getPlaylistVideoUploadDatesFetch = async function (
  playlistId: string,
  apiKey: string,
): Promise<null> {
  const baseUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${apiKey}`;
  let nextPageToken: string | undefined;
  let allItems: PlaylistItem[] = [];

  // const fet

  return null;
};
