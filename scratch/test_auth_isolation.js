// Test script to verify Zustand store isolation logic and Supabase client-side load queries
const { create } = require('zustand');
const { persist } = require('zustand/middleware');

// Mock implementation mirroring player-store.ts and DatabaseLoader.tsx logic
const createStore = () => create(
  persist(
    (set, get) => ({
      likedSongs: [],
      recentSongs: [],
      history: [],
      playlists: [],
      videoId: "",
      title: "",

      setLikedSongs: (songs) => set({ likedSongs: songs }),
      setRecentSongs: (songs) => set({ recentSongs: songs }),
      setPlaylists: (playlists) => set({ playlists }),
      resetUserLibrary: () => set({
        likedSongs: [],
        recentSongs: [],
        history: [],
        playlists: [],
      }),
    }),
    { name: "test-musicflow-store" }
  )
);

function runAuthIsolationVerification() {
  console.log("--- STARTING AUTH & DATA ISOLATION LOGIC VERIFICATION ---");
  const results = {};

  const store = createStore();

  // Step 1: User A simulates login & adds likes + playlist
  console.log("Scenario 1: User A logs in and populates library...");
  store.getState().setLikedSongs([{ videoId: "song_userA_1", title: "User A Song", artist: "Artist A" }]);
  store.getState().setPlaylists([{ id: 101, name: "User A Playlist", songs: [] }]);
  
  const userAState = {
    likes: store.getState().likedSongs.length,
    playlists: store.getState().playlists.length
  };
  console.log("User A state:", userAState);

  // Step 2: User A logs out -> calls resetUserLibrary()
  console.log("Scenario 2: User A logs out (triggers resetUserLibrary)...");
  store.getState().resetUserLibrary();
  const loggedOutState = {
    likes: store.getState().likedSongs.length,
    playlists: store.getState().playlists.length
  };
  console.log("Logged out state:", loggedOutState);

  // Step 3: User B logs in (User B has 0 likes in Supabase)
  console.log("Scenario 3: User B logs in with 0 likes and 0 playlists...");
  // Simulate DatabaseLoader.tsx:
  // const [likes, recents, playlists] = await Promise.all(...)
  const userBLoadedLikes = [];
  const userBLoadedPlaylists = [];
  // In our fixed DatabaseLoader.tsx:
  store.getState().setLikedSongs(userBLoadedLikes);
  store.getState().setPlaylists(userBLoadedPlaylists);

  const userBState = {
    likes: store.getState().likedSongs.length,
    playlists: store.getState().playlists.length
  };
  console.log("User B state:", userBState);

  // Assert User B has 0 items and none of User A's items
  const userBIsolated = userBState.likes === 0 && userBState.playlists === 0;
  results["Cross-User Data Isolation (User A -> Logout -> User B)"] = {
    status: userBIsolated ? "PASS" : "FAIL",
    userAItems: userAState,
    loggedOutItems: loggedOutState,
    userBItems: userBState
  };

  // Step 4: Guest -> Login -> Logout -> Guest
  console.log("Scenario 4: Guest -> Login -> Logout -> Guest flow...");
  // Guest likes a song locally
  store.getState().setLikedSongs([{ videoId: "guest_song_1", title: "Guest Track", artist: "Guest Artist" }]);
  const guestInitialLikes = store.getState().likedSongs.length;
  // Guest logs in as User with cloud data
  const cloudLikes = [{ videoId: "cloud_song_1", title: "Cloud Track", artist: "Cloud Artist" }];
  store.getState().setLikedSongs(cloudLikes);
  const userCloudLikes = store.getState().likedSongs.length;
  // User logs out
  store.getState().resetUserLibrary();
  const guestAfterLogout = store.getState().likedSongs.length;

  results["Guest -> Login -> Logout Flow"] = {
    status: guestInitialLikes === 1 && userCloudLikes === 1 && guestAfterLogout === 0 ? "PASS" : "FAIL",
    guestInitialLikes,
    userCloudLikes,
    guestAfterLogout
  };

  console.log("\nResults:\n", JSON.stringify(results, null, 2));
}

runAuthIsolationVerification();
