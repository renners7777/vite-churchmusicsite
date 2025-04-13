import { marked } from 'marked'
import supabase from '../services/supabase.js'

// --- Configuration ---
// TODO: Replace with actual IDs or names of your Sunday playlists
const SUNDAY_AM_PLAYLIST_ID = 'your-sunday-am-playlist-id-or-name';
const SUNDAY_PM_PLAYLIST_ID = 'your-sunday-pm-playlist-id-or-name';
// --- End Configuration ---

// Global state for the Songs page
const state = {
  allSongs: [], // All songs from DB
  sundayAmPlaylist: null, // { id, name, songs: [] }
  sundayPmPlaylist: null, // { id, name, songs: [] }
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
    const requests = [
      supabase.from('songs').select('*').order('title')
    ];

    const [songsResult] = await Promise.all([requests[0]]);

    if (songsResult.error) throw songsResult.error;

    state.allSongs = songsResult.data || [];
    state.filteredSongs = state.allSongs;
    state.sundayAmPlaylist = { id: 'am-placeholder', name: 'Sunday AM Service', songs: [] };
    state.sundayPmPlaylist = { id: 'pm-placeholder', name: 'Sunday PM Service', songs: [] };

  } catch (error) {
    console.error('Error loading songs page data:', error);
    state.errorMessage = 'Failed to load song data. Please try again.';
    state.allSongs = [];
    state.filteredSongs = [];
    state.sundayAmPlaylist = null;
    state.sundayPmPlaylist = null;
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
  if (!playlistId || !songId) return;

  console.log(`TODO: Add song ${songId} to playlist ${playlistId}`);
  alert(`Adding song to ${playlistId === SUNDAY_AM_PLAYLIST_ID ? 'Sunday AM' : 'Sunday PM'}... (Implementation needed)`);
}

async function removeSongFromSundayPlaylist(songId, playlistId) {
  if (!window.currentUser) {
    alert('Please login to manage Sunday playlists.');
    return;
  }
   if (!playlistId || !songId) return;
   if (!confirm('Are you sure you want to remove this song from the Sunday playlist?')) {
       return;
   }

  console.log(`TODO: Remove song ${songId} from playlist ${playlistId}`);
  alert(`Removing song from ${playlistId === SUNDAY_AM_PLAYLIST_ID ? 'Sunday AM' : 'Sunday PM'}... (Implementation needed)`);
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
                normalizeText(song.author).includes(normalizedQuery)
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
    if (!state.isInitialized && !state.loading) {
      loadPageData(currentUser);
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

    resolve(renderContent());

    window.removeEventListener('songs-page-update', window._songsPageUpdateHandler);
    window._songsPageUpdateHandler = () => {
        const songsContainer = document.querySelector('main');
        if (songsContainer) {
            songsContainer.innerHTML = renderContent();
            initializeSongsPageHandlers(currentUser);
        }
    };
    window.addEventListener('songs-page-update', window._songsPageUpdateHandler);

    requestAnimationFrame(() => {
        initializeSongsPageHandlers(currentUser);
    });
  });
}

// --- Event Handlers ---
function handlePageClick(event, currentUser) {
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
          addSongToSundayPlaylist(songId, SUNDAY_AM_PLAYLIST_ID);
      } else if (action === 'add-to-sunday-pm' && songId) {
          addSongToSundayPlaylist(songId, SUNDAY_PM_PLAYLIST_ID);
      } else if (action === 'remove-from-sunday' && songId && playlistId) {
          removeSongFromSundayPlaylist(songId, playlistId);
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

    document.addEventListener('click', window._songsPageClickHandler);
    document.addEventListener('keydown', window._songsPageKeyDownHandler);
    if (addForm) {
        addForm.addEventListener('submit', window._addSongSubmitHandler);
    }
     if (searchInput) {
         searchInput.addEventListener('input', window._searchInputHandler);
     }
}

window.SongsPage = SongsPage;


