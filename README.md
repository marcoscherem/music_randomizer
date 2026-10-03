# Class Playlist Builder (web)

A static page that builds a random ~90-minute Spotify playlist for martial arts classes
from genres, mood keywords, artists, BPM and other filters. Hosted on GitHub Pages; there
is no server and no build step.

- Songs are found through the public iTunes and Deezer APIs, then matched to Spotify.
- **Send to Spotify** asks you to sign in to Spotify every time. The access token lives
  only in memory and is dropped as soon as the playlist is saved.
- The Spotify app Client ID is set in `config.js`.
- Preferences and playlist history are stored per browser (`localStorage`).

## Files

- `index.html`: the page.
- `app.js`: everything else.
- `config.js`: the Spotify Client ID and default preferences for a browser that has none saved yet.

## Spotify app settings

In the app at <https://developer.spotify.com/dashboard>, the page's address must be listed
under **Redirect URIs**, exactly as it appears in the browser (with the trailing slash).
The app owner needs Spotify Premium, and only accounts listed under the app's
**User Management** can sign in.
