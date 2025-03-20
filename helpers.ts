const testurl =
  "https://www.youtube.com/watch?v=gsaGb71CK6s&list=PL9QdAxhqglB_h9lGh7kcXDewZZA-B6AEL&index=2";

export const getIdFromUrl = (url: string) => {
  const urlParts = url.split("/");
  return urlParts[urlParts.length - 1];
};
