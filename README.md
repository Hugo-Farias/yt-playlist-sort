# Playlist Sorter for YouTube

Adds powerful sorting options to your YouTube playlists, allowing you to easily reorder videos by various criteria and enhance your viewing experience.

## Features

- **Sort by Title:** Arrange videos alphabetically by their titles.
- **Sort by Date:** Order videos by their upload date, either oldest or newest first.
- **Reverse List Order:** Quickly flip the entire playlist's order.
- **Show Video Upload Dates:** Display the upload date for each video directly in the playlist, providing more context at a glance.

## Installation

This extension is designed for chromium based web browsers.

### From a Web Store (Recommended)

1. Navigate to the extension's page on [Chrome Web Store](https://chromewebstore.google.com/detail/playlist-sorter-for-youtu/pknlkjehmikkbfpmfoiboncjnlopopjf).
2. Click "Add to [Browser]" or "Install".
3. Follow the on-screen prompts to complete the installation.

### Manual Installation (Developer Mode)

1. Download the latest release from the [GitHub Releases page](https://github.com/Hugo-Farias/yt-playlist-sort/releases).
2. Unzip the downloaded file.
3. Open your browser's extension management page:
   - **Chrome:** `chrome://extensions`
   - **Chromium:** `chromium://extensions`
   - **Edge:** `edge://extensions`
   - **Brave:** `brave://extensions`
4. Enable "Developer mode".
5. Click "Load unpacked" and select the unzipped extension directory.

## How to Use

Once installed, the "Playlist Sorter for YouTube" extension will automatically integrate with YouTube playlist pages.

1. Go to any YouTube playlist and play a video.
2. Look for the new sorting options that will appear on the playlist panel on the right.
3. Click on your desired sorting method (e.g., "Sort by Title", "Sort by Date", "Reverse Order") to instantly reorder the playlist.
4. The "Show Video Upload Dates" setting will display the upload date next to each video when active.

## Report a Bug

If you encounter any bugs or issues, please report them on the [Chrome Web Store support page](https://chromewebstore.google.com/detail/playlist-sorter-for-youtu/pknlkjehmikkbfpmfoiboncjnlopopjf/support).

## Using a custom api:

#### 1. Create a project

- Go to [Google Cloud Console](https://console.cloud.google.com/)
- Click **“Select a project” → “New Project”**
- Give it a name → **Create**

#### 2. Enable the YouTube API

- In the 'Quick Access' section: **APIs & Services → Library**
- Or go directly to [Library](https://console.cloud.google.com/apis/library/youtube.googleapis.com)
- Search for **YouTube Data API v3**
- Click it → **Enable**

#### 3. Create credentials (API key)

- Go to **APIs & Services → Credentials**
- Or go directly to [Credentials](https://console.cloud.google.com/apis/credentials)
- Click **“Create Credentials” → “API key”**
- Select **"Youtube Data API v3"** on the **"Select API Restrictions"** dropdown
- Click **Create** and copy the generated API key
- Copy the key

#### 4. Add the API key to the extension

- Open the extension's settings page by clicking on the extension icon in your browser toolbar
- Select **"Use custom API key"**
- Paste your API key into the provided input field
- Click **"Test API key"** to verify that the key is working correctly, if the test is successful, you should see a confirmation message
