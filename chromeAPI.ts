const apiKey = "[YOUR_API_KEY]";
const accessToken = "[YOUR_ACCESS_TOKEN]";
const playlistId = "PL9QdAxhqglB_h9lGh7kcXDewZZA-B6AEL";

export async function fetchPlaylistItems() {
  const url = `https://youtube.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.error("Error fetching playlist items:", error);
  }
}
