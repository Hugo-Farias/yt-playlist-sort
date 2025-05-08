export const getListId = (url: string) => {
  if (url.length <= 0) return null;
  return new URL(url).searchParams.get("list");
};

export const getVideoId = (url: string) => {
  if (url.length <= 0) return null;
  return new URL(url).searchParams.get("v");
};
