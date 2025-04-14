import { marked } from 'marked'
import supabase from '../services/supabase.js'

// --- Configuration ---
const SUNDAY_AM_PLAYLIST_NAME = 'Sunday Morning Service';
const SUNDAY_PM_PLAYLIST_NAME = 'Sunday Evening Service';
// --- End Configuration ---

// Global state for the Songs page
const state = {
  allSongs: [], // All songs from DB
  sundayAmPlaylist: null, // { id, name, songs: [] } - Will hold actual data
  sundayPmPlaylist: null, // { id, name, songs: [] } - Will hold actual data
  sundayAmPlaylistId: null, // Store the fetched ID
  sundayPmPlaylistId: null, // Store the fetched ID
  searchQuery: '',
  filteredSongs: [], // Songs matching search query
  loading: false,
  activeVideoId: null,
  showAddSongForm: false, // Control visibility of add song form
  isInitialized: false,
  errorMessage: ''
}

// --- Utility Functions ---
function getYouTubeVideoId(url) {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

function normalizeText(text) {
  return text ? text.toLowerCase().trim() : '';
}

// --- Placeholder Rendering ---
function renderSongCardPlaceholder() {
  return `
    <div class="song-card bg-white rounded-lg shadow p-4 animate-pulse">
      <div class="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
      <div class="h-3 bg-gray-300 rounded w-1/2 mb-4"></div>
      <div class="h-3 bg-gray-300 rounded w-full mb-1"></div>
      <div class="h-3 bg-gray-300 rounded w-5/6 mb-4"></div>
      <div class="flex items-center justify-between mt-3">
        <div class="h-6 bg-gray-300 rounded w-16"></div>
        <div class="flex space-x-1">
           <div class="h-6 w-8 bg-gray-300 rounded"></div>
           <div class="h-6 w-8 bg-gray-300 rounded"></div>
        </div>
      </div>
    </div>
  `;
}

function renderLoadingPlaceholders(count = 6) {
    return `
        <h2 id="all-songs-heading" class="text-2xl font-bold mb-6">All Songs</h2>
        <div class="search-container-wrapper mb-6">${renderSearchBar()}</div>
        <div class="song-list grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            ${Array(count).fill('').map(renderSongCardPlaceholder).join('')}
        </div>
    `;
}

// --- Data Loading ---
async function loadPageData(currentUser) {
  if (state.loading) return;
  state.loading = true;
  state.errorMessage = '';
  if (!state.isInitialized) {
      window.dispatchEvent(new CustomEvent('songs-page-update'));
  }

  try {
    // 1. Fetch all songs
    const songsReq = supabase.from('songs').select('*').order('title');

    // 2. Fetch Sunday Playlist IDs by name
    console.log('Fetching AM Playlist ID for name:', SUNDAY_AM_PLAYLIST_NAME); // Log name
    const amPlaylistReq = supabase.from('sunday_playlists')
                                  .select('id, name') // Select name too for verification
                                  .eq('name', SUNDAY_AM_PLAYLIST_NAME)
                                  .maybeSingle();

    console.log('Fetching PM Playlist ID for name:', SUNDAY_PM_PLAYLIST_NAME); // Log name
    const pmPlaylistReq = supabase.from('sunday_playlists')
                                  .select('id, name') // Select name too for verification
                                  .eq('name', SUNDAY_PM_PLAYLIST_NAME)
                                  .maybeSingle();

    const [songsResult, amPlaylistResult, pmPlaylistResult] = await Promise.all([
        songsReq, amPlaylistReq, pmPlaylistReq
    ]);

    // ...
    if (songsResult.error) throw songsResult.error;
    state.allSongs = songsResult.data || [];
    console.log('Fetched allSongs:', JSON.stringify(state.allSongs)); // <-- ADD THIS LOG
    // ... rest of the code assigning playlist IDs etc. ...

    // --- DETAILED LOGGING ---
    console.log('Raw AM Playlist Result:', JSON.stringify(amPlaylistResult)); // Log raw result
    console.log('Raw PM Playlist Result:', JSON.stringify(pmPlaylistResult)); // Log raw result
    // --- END DETAILED LOGGING ---

    // Add specific checks for playlist results
    if (amPlaylistResult.error) {
        console.error("Error fetching AM Playlist ID:", amPlaylistResult.error);
        // Decide how to handle this - maybe set state.errorMessage
    }
    if (pmPlaylistResult.error) {
        console.error("Error fetching PM Playlist ID:", pmPlaylistResult.error);
         // Decide how to handle this - maybe set state.errorMessage
    }
    if (!amPlaylistResult.data) {
         console.warn("AM Playlist data is null/empty for name:", SUNDAY_AM_PLAYLIST_NAME);
    }
     if (!pmPlaylistResult.data) {
         console.warn("PM Playlist data is null/empty for name:", SUNDAY_PM_PLAYLIST_NAME);
    }

    // Assign to state
    state.sundayAmPlaylistId = amPlaylistResult.data?.id || null;
    state.sundayPmPlaylistId = pmPlaylistResult.data?.id || null;

    console.log('LOADED - State AM ID set to:', state.sundayAmPlaylistId); // Log assigned value
    console.log('LOADED - State PM ID set to:', state.sundayPmPlaylistId); // Log assigned value
    console.log('LOADED - State object after ID assignment:', JSON.stringify(state)); // Log state

    // 3. Fetch songs for each Sunday playlist IF the playlist ID was found
    const sundaySongsReqs = [];
    if (state.sundayAmPlaylistId) {
        sundaySongsReqs.push(
            supabase.from('sunday_playlist_songs')
                    .select('*, songs(*)') // Fetch song details via relationship
                    .eq('sunday_playlist_id', state.sundayAmPlaylistId)
                    .order('position', { ascending: true }) // Assuming you have a position column
        );
    } else {
        sundaySongsReqs.push(Promise.resolve({ data: [], error: null })); // Placeholder if no AM playlist
    }

    if (state.sundayPmPlaylistId) {
        sundaySongsReqs.push(
            supabase.from('sunday_playlist_songs')
                    .select('*, songs(*)') // Fetch song details via relationship
                    .eq('sunday_playlist_id', state.sundayPmPlaylistId)
                    .order('position', { ascending: true }) // Assuming you have a position column
        );
    } else {
        sundaySongsReqs.push(Promise.resolve({ data: [], error: null })); // Placeholder if no PM playlist
    }

    const [amSongsResult, pmSongsResult] = await Promise.all(sundaySongsReqs);

    if (amSongsResult.error) throw amSongsResult.error;
    if (pmSongsResult.error) throw pmSongsResult.error;

    // Update state with actual playlist data
    state.sundayAmPlaylist = {
        id: state.sundayAmPlaylistId,
        name: SUNDAY_AM_PLAYLIST_NAME,
        songs: amSongsResult.data || [] // songs here are the join records + nested song details
    };
    state.sundayPmPlaylist = {
        id: state.sundayPmPlaylistId,
        name: SUNDAY_PM_PLAYLIST_NAME,
        songs: pmSongsResult.data || [] // songs here are the join records + nested song details
    };

  } catch (error) {
    console.error('Error loading songs page data:', error);
    state.errorMessage = 'Failed to load song data. Please try again.';
    state.allSongs = [];
    state.filteredSongs = [];
    state.sundayAmPlaylist = null;
    state.sundayPmPlaylist = null;
    state.sundayAmPlaylistId = null;
    state.sundayPmPlaylistId = null;
  } finally {
    state.loading = false;
    state.isInitialized = true;
    window.dispatchEvent(new CustomEvent('songs-page-update'));
  }
}

// --- Playlist Management (Specific to Sunday Playlists) ---
async function addSongToSundayPlaylist(songId, playlistId) {
  if (!window.currentUser) {
    alert('Please login to manage Sunday playlists.');
    return;
  }
  if (!playlistId || !songId) {
      console.error('Missing songId or playlistId for addSongToSundayPlaylist');
      alert('Could not add song: Missing information.');
      return;
  }

  // Check if song is already in the target playlist
  const targetPlaylist = playlistId === state.sundayAmPlaylistId ? state.sundayAmPlaylist : state.sundayPmPlaylist;
  if (targetPlaylist?.songs?.some(ps => ps.song_id === songId)) {
      alert('This song is already in the selected Sunday playlist.');
      return;
  }

  try {
    // Assuming 'position' column exists for ordering, find the next position
    const nextPosition = (targetPlaylist?.songs?.length || 0) + 1;

    const { error } = await supabase
      .from('sunday_playlist_songs')
      .insert({
        playlist_id: playlistId,
        song_id: songId,
        position: nextPosition // Optional: Add position if you have it
      });

    if (error) throw error;

    // Reload data to reflect the change
    await loadPageData(window.currentUser);

  } catch (error) {
    console.error(`Error adding song ${songId} to playlist ${playlistId}:`, error);
    alert('Error adding song to Sunday playlist: ' + error.message);
  }
}

async function removeSongFromSundayPlaylist(songId, playlistId) {
  if (!window.currentUser) {
    alert('Please login to manage Sunday playlists.');
    return;
  }
   if (!playlistId || !songId) {
       console.error('Missing songId or playlistId for removeSongFromSundayPlaylist');
       alert('Could not remove song: Missing information.');
       return;
   }
   if (!confirm('Are you sure you want to remove this song from the Sunday playlist?')) {
       return;
   }

  try {
    const { error } = await supabase
      .from('sunday_playlist_songs')
      .delete()
      .match({ sunday_playlist_id: playlistId, song_id: songId }); // Match both IDs

    if (error) throw error;

    // Reload data to reflect the change
    await loadPageData(window.currentUser);

  } catch (error) {
    console.error(`Error removing song ${songId} from playlist ${playlistId}:`, error);
    alert('Error removing song from Sunday playlist: ' + error.message);
  }
}

// --- Add Song Form ---
function renderAddSongForm() {
    return `
    <section id="add-song-section" class="mt-12 pt-8 border-t">
      <h2 class="text-2xl font-bold mb-6">Add New Song</h2>
      <div class="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <form id="add-song-form" class="space-y-4">
          <div>
            <label for="add-title" class="block text-sm font-medium text-gray-700">Title</label>
            <input type="text" id="add-title" required class="input" aria-label="Song title"/>
          </div>
          <div>
            <label for="add-author" class="block text-sm font-medium text-gray-700">Author</label>
            <input type="text" id="add-author" required class="input" aria-label="Song author"/>
          </div>
          <div>
            <label for="add-youtube-url" class="block text-sm font-medium text-gray-700">YouTube URL (Optional)</label>
            <input type="url" id="add-youtube-url" class="input" aria-label="YouTube URL" pattern="https?://.*" title="Please enter a valid URL starting with http:// or https://"/>
          </div>
          <div class="flex justify-end space-x-3">
            <button type="button" id="cancel-add-song" class="button button-secondary" aria-label="Cancel adding song">Cancel</button>
            <button type="submit" class="button" aria-label="Save new song">Save Song</button>
          </div>
        </form>
      </div>
    </section>
  `;
}

async function handleAddSongSubmit(event) {
  event.preventDefault();
  if (!window.currentUser) {
    alert('Please login to add songs.');
    return;
  }

  const title = document.getElementById('add-title')?.value.trim();
  const author = document.getElementById('add-author')?.value.trim();
  const youtubeUrl = document.getElementById('add-youtube-url')?.value.trim();

  if (!title || !author) {
    alert('Please fill in Title and Author.');
    return;
  }

  try {
    const { error } = await supabase
      .from('songs')
      .insert([{
        title,
        author,
        youtube_url: youtubeUrl || null,
        created_by: window.currentUser.id
      }]);

    if (error) throw error;

    alert('Song added successfully!');
    document.getElementById('add-song-form')?.reset();
    state.showAddSongForm = false;
    await loadPageData(window.currentUser);
    window.dispatchEvent(new CustomEvent('songs-page-update'));

  } catch (error) {
    console.error('Error adding song:', error);
    alert('Error adding song: ' + error.message);
  }
}

// --- Search Functionality ---
function renderSearchBar() {
  return `
    <div class="search-container flex items-center space-x-2">
      <input
        type="text"
        id="song-search"
        class="search-input flex-grow"
        placeholder="Search by title, author, or lyrics..."
        aria-label="Search all songs"
        autocomplete="off"
        value="${state.searchQuery}"
      />
      <button
        id="clear-search"
        class="clear-search ${state.searchQuery ? '' : 'hidden'}"
        aria-label="Clear search"
      >
        ✕
      </button>
      <button id="submit-search" class="button" aria-label="Submit search">Search</button>
    </div>
  `;
}

function performSearch() {
    const query = document.getElementById('song-search')?.value || '';
    state.searchQuery = query;
    const normalizedQuery = normalizeText(query);

    if (!normalizedQuery) {
        state.filteredSongs = state.allSongs;
    } else {
        state.filteredSongs = state.allSongs.filter((song) => {
            return (
                normalizeText(song.title).includes(normalizedQuery) ||
                normalizeText(song.author).includes(normalizedQuery) ||
                normalizeText(song.lyrics || '').includes(normalizedQuery) // Added lyrics search
            );
        });
    }
    window.dispatchEvent(new CustomEvent('songs-page-update'));
}

function clearSearch() {
  const searchInput = document.getElementById('song-search');
  if (searchInput) {
    searchInput.value = '';
  }
  state.searchQuery = '';
  state.filteredSongs = state.allSongs;
  document.getElementById('clear-search')?.classList.add('hidden');
  window.dispatchEvent(new CustomEvent('songs-page-update'));
}

// --- Rendering ---
function renderSongCard(song, currentUser, isSundayPlaylist = false, playlistId = null) {
  const videoId = getYouTubeVideoId(song.youtube_url);
  return `
    <article class="song-card bg-white rounded-lg shadow p-4 flex flex-col justify-between">
      <div>
        <h3 class="text-lg font-semibold mb-1">${song.title}</h3>
        <p class="text-sm text-gray-600 mb-2">By ${song.author || 'Unknown'}</p>
        ${song.lyrics ? `<div class="text-xs text-gray-500 mb-2 lyrics-preview">${marked.parse(song.lyrics.substring(0, 100) + '...')}</div>` : ''}
      </div>
      <div class="flex items-center justify-between mt-3">
        <div>
          ${videoId ? `
            <button
              data-action="play-video"
              data-video-id="${videoId}"
              class="button-icon text-blue-600 hover:text-blue-800"
              aria-label="Play video for ${song.title}"
            >
              ▶️ Play
            </button>
          ` : ''}
        </div>
        ${currentUser ? `
        <div class="flex space-x-1">
          ${isSundayPlaylist ? `
            <button
              data-action="remove-from-sunday"
              data-song-id="${song.id}"
              data-playlist-id="${playlistId}"
              class="button-icon text-red-600 hover:text-red-800"
              aria-label="Remove ${song.title} from this Sunday playlist"
              title="Remove from Sunday Playlist"
            >
              🗑️
            </button>
          ` : `
            <button
              data-action="add-to-sunday-am"
              data-song-id="${song.id}"
              class="button-icon text-green-600 hover:text-green-800"
              aria-label="Add ${song.title} to Sunday AM playlist"
              title="Add to Sunday AM"
            >
              ☀️ Add AM
            </button>
            <button
              data-action="add-to-sunday-pm"
              data-song-id="${song.id}"
              class="button-icon text-purple-600 hover:text-purple-800"
              aria-label="Add ${song.title} to Sunday PM playlist"
              title="Add to Sunday PM"
            >
              🌙 Add PM
            </button>
          `}
        </div>
        ` : ''}
      </div>
    </article>
  `;
}

function renderSundayPlaylistSection(playlist, title, currentUser) {
    if (!playlist) {
        return `<div class="text-gray-500">Could not load ${title}.</div>`;
    }
    return `
        <h3 class="text-xl font-semibold mb-4">${title} (${playlist.songs?.length || 0} songs)</h3>
        ${playlist.songs?.length ? `
            <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                ${playlist.songs.map(ps => renderSongCard(ps.songs, currentUser, true, playlist.id)).join('')}
            </div>
        ` : `
            <p class="text-gray-500">No songs added yet.</p>
        `}
    `;
}

function renderAllSongsSection(currentUser) {
    return `
        <h2 id="all-songs-heading" class="text-2xl font-bold mb-6">All Songs</h2>
        <div class="search-container-wrapper mb-6">${renderSearchBar()}</div>
        ${state.filteredSongs.length === 0 ? `
            <div class="text-center py-8 text-gray-500">
                ${state.searchQuery ? 'No songs found matching your search.' : 'No songs available.'}
            </div>
        ` : `
            <div class="song-list grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                ${state.filteredSongs.map(song => renderSongCard(song, currentUser)).join('')}
            </div>
        `}
    `;
}

// --- Main Component Function ---
export function SongsPage(currentUser) {
  return new Promise(async (resolve) => {
    console.log('SongsPage: Starting'); // Log

    // Ensure initial load completes before resolving the first time
    if (!state.isInitialized && !state.loading) {
      console.log('SongsPage: Calling and awaiting initial loadPageData'); // Log
      await loadPageData(currentUser); // AWAIT the initial load
      console.log('SongsPage: Initial loadPageData finished'); // Log
    } else if (state.loading) {
      // Optional: If already loading, maybe wait or show loading state differently
      console.log('SongsPage: Already loading, waiting for update event');
    }

    const renderContent = () => {
      if (state.loading && !state.isInitialized) {
         return `
            <section class="container mx-auto p-4" aria-labelledby="songs-page-heading">
              <div class="flex justify-between items-center mb-8">
                <h1 id="songs-page-heading" class="text-3xl font-bold">Worship Songs</h1>
                ${currentUser && !state.showAddSongForm ? `
                  <button id="show-add-song-form-btn" class="button">Add New Song</button>
                ` : ''}
              </div>

              <section id="sunday-playlists" class="mb-12">
                <h2 class="text-2xl font-bold mb-6 border-b pb-2">Sunday Services</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div><h3 class="text-xl font-semibold mb-4">Sunday AM Service</h3><p class="text-gray-500">Loading...</p></div>
                  <div><h3 class="text-xl font-semibold mb-4">Sunday PM Service</h3><p class="text-gray-500">Loading...</p></div>
                </div>
              </section>

              <section id="all-songs" class="mt-12 pt-8 border-t">
                ${renderLoadingPlaceholders()}
              </section>
            </section>
          `;
      }

      if (state.errorMessage) {
         return `<div class="bg-red-100 text-red-700 p-4 rounded" role="alert">${state.errorMessage}</div>`;
      }

      // --- ADD VIDEO MODAL LOGIC ---
      const videoModalHtml = state.activeVideoId ? `
        <div id="video-modal" class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" data-action="close-modal">
          <div class="bg-white p-4 rounded-lg shadow-xl relative max-w-3xl w-full">
            <button class="absolute top-2 right-2 text-black text-2xl leading-none hover:text-gray-700" data-action="close-modal" aria-label="Close video player">&times;</button>
            <div class="aspect-w-16 aspect-h-9">
              <iframe
                src="https://www.youtube.com/embed/${state.activeVideoId}?autoplay=1"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen
                class="w-full h-full"
                title="YouTube video player">
              </iframe>
            </div>
          </div>
        </div>
      ` : '';
      // --- END VIDEO MODAL LOGIC ---

      return `
        ${videoModalHtml}
        <section class="container mx-auto p-4" aria-labelledby="songs-page-heading">
          <div class="flex justify-between items-center mb-8">
            <h1 id="songs-page-heading" class="text-3xl font-bold">Worship Songs</h1>
            ${currentUser && !state.showAddSongForm ? `
              <button id="show-add-song-form-btn" class="button">Add New Song</button>
            ` : ''}
          </div>

          <section id="sunday-playlists" class="mb-12">
            <h2 class="text-2xl font-bold mb-6 border-b pb-2">Sunday Services</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>${renderSundayPlaylistSection(state.sundayAmPlaylist, 'Sunday AM Service', currentUser)}</div>
              <div>${renderSundayPlaylistSection(state.sundayPmPlaylist, 'Sunday PM Service', currentUser)}</div>
            </div>
          </section>

          ${state.showAddSongForm && currentUser ? renderAddSongForm() : ''}

          <section id="all-songs" class="mt-12 pt-8 border-t">
            ${renderAllSongsSection(currentUser)}
          </section>
        </section>
      `;
    };

    console.log('SongsPage: Resolving renderContent'); // Log
    resolve(renderContent()); // Now resolve with potentially loaded data

    // --- Event Listener Setup ---
    // Remove previous listener first to prevent duplicates
    window.removeEventListener('songs-page-update', window._songsPageUpdateHandler);

    window._songsPageUpdateHandler = () => {
        console.log('songs-page-update: Handler triggered'); // Log
        const songsContainer = document.querySelector('main');
        if (songsContainer) {
            console.log('songs-page-update: Rendering content'); // Log
            songsContainer.innerHTML = renderContent();
            console.log('songs-page-update: Re-initializing handlers'); // Log
            initializeSongsPageHandlers(currentUser); // Re-attach handlers AFTER re-render
        }
    };
    window.addEventListener('songs-page-update', window._songsPageUpdateHandler);

    // Initial setup of handlers AFTER the first render completes
    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
        // Only initialize if the page is fully initialized
        if (state.isInitialized) {
             console.log('SongsPage: Initializing handlers via requestAnimationFrame'); // Log
             initializeSongsPageHandlers(currentUser);
        } else {
             console.log('SongsPage: Skipping initial handler init, waiting for load'); // Log
        }
    });
  });
}

// --- Event Handlers ---
function handlePageClick(event, currentUser) {
  // Log state IDs immediately upon click
  console.log('CLICK START - State AM ID:', state.sundayAmPlaylistId); // <-- ADD THIS
  console.log('CLICK START - State PM ID:', state.sundayPmPlaylistId); // <-- ADD THIS

  const target = event.target;
  const action = target.closest('[data-action]')?.dataset.action;
  const songId = target.closest('[data-song-id]')?.dataset.songId;
  const playlistId = target.closest('[data-playlist-id]')?.dataset.playlistId;
  const videoId = target.closest('[data-video-id]')?.dataset.videoId;

  if (action === 'play-video' && videoId) {
    state.activeVideoId = videoId;
    window.dispatchEvent(new CustomEvent('songs-page-update'));
  } else if (action === 'close-modal' || target.id === 'video-modal') {
    state.activeVideoId = null;
    window.dispatchEvent(new CustomEvent('songs-page-update'));
  }

  if (target.id === 'show-add-song-form-btn') {
      state.showAddSongForm = true;
      window.dispatchEvent(new CustomEvent('songs-page-update'));
  } else if (target.id === 'cancel-add-song') {
      state.showAddSongForm = false;
      window.dispatchEvent(new CustomEvent('songs-page-update'));
  }

  if (target.id === 'submit-search') {
      performSearch();
  } else if (target.id === 'clear-search') {
      clearSearch();
  }

  if (currentUser) {
      if (action === 'add-to-sunday-am' && songId) {
          console.log('CLICK AM - State AM ID:', state.sundayAmPlaylistId); // <-- ADD THIS
          if (!state.sundayAmPlaylistId) { /* ... error handling ... */ }
          else { addSongToSundayPlaylist(songId, state.sundayAmPlaylistId); }
      } else if (action === 'add-to-sunday-pm' && songId) {
          console.log('CLICK PM - State PM ID:', state.sundayPmPlaylistId); // <-- ADD THIS
          if (!state.sundayPmPlaylistId) { /* ... error handling ... */ }
          else { addSongToSundayPlaylist(songId, state.sundayPmPlaylistId); }
      }
  }
}

function handlePageKeyDown(event) {
    if (event.key === 'Escape' && state.activeVideoId) {
        state.activeVideoId = null;
        window.dispatchEvent(new CustomEvent('songs-page-update'));
    }
    if (event.key === 'Enter' && event.target.id === 'song-search') {
        event.preventDefault();
        performSearch();
    }
}

// --- Initialization ---
function initializeSongsPageHandlers(currentUser) {
    console.log('initializeSongsPageHandlers: Attaching listeners'); // Log

    // Log state IDs right before attaching the click handler
    console.log('INIT HANDLERS - State AM ID:', state.sundayAmPlaylistId); // <-- ADD THIS
    console.log('INIT HANDLERS - State PM ID:', state.sundayPmPlaylistId); // <-- ADD THIS

    // --- Initialization Logic Note ---
    // Event listeners are removed and re-added here because the entire
    // container's innerHTML is replaced on each update, destroying
    // the old elements and their attached listeners. This is necessary
    // with the current rendering strategy but highlights its inefficiency.
    // --- End Initialization Logic Note ---

    // Ensure state IDs are available before attaching handlers that depend on them
    // This check might be redundant now due to awaiting loadPageData, but adds safety
    if (!state.isInitialized) {
        console.warn('initializeSongsPageHandlers called before state was initialized!');
        return; // Don't attach if data isn't ready
    }

    // Remove existing listeners (important!)
    document.removeEventListener('click', window._songsPageClickHandler);
    document.removeEventListener('keydown', window._songsPageKeyDownHandler);
    const addForm = document.getElementById('add-song-form');
    if (addForm) {
        addForm.removeEventListener('submit', window._addSongSubmitHandler);
    }
    const searchInput = document.getElementById('song-search');
     if (searchInput) {
         searchInput.removeEventListener('input', window._searchInputHandler);
     }

    // Define handlers
    window._songsPageClickHandler = (event) => handlePageClick(event, currentUser);
    window._songsPageKeyDownHandler = handlePageKeyDown;
    window._addSongSubmitHandler = handleAddSongSubmit;
    window._searchInputHandler = () => {
        const searchInput = document.getElementById('song-search');
        const clearButton = document.getElementById('clear-search');
        if (searchInput && clearButton) {
            clearButton.classList.toggle('hidden', !searchInput.value);
        }
    };

    // Add new listeners
    document.addEventListener('click', window._songsPageClickHandler);
    document.addEventListener('keydown', window._songsPageKeyDownHandler);
    if (addForm) {
        addForm.addEventListener('submit', window._addSongSubmitHandler);
    }
     if (searchInput) {
         searchInput.addEventListener('input', window._searchInputHandler);
     }
    console.log('initializeSongsPageHandlers: Listeners attached'); // Log
}

window.SongsPage = SongsPage; // Ensure SongsPage is globally accessible if needed by router


