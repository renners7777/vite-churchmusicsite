import { marked } from 'marked'
import supabase from '../services/supabase.js'

// Global state for songs list and search
const state = {
  songs: [],
  playlists: [], // Add playlists to state
  searchQuery: '',
  loading: false,
  addingToPlaylist: null,
  activeVideoId: null, // Track currently playing video
  isInitialized: false // Track if initial load is done
}

// Debounce helper
function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Extract YouTube video ID from URL
function getYouTubeVideoId(url) {
  if (!url) return null
  try {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    const videoId = (match && match[2].length === 11) ? match[2] : null
    if (!videoId) {
      console.warn('Invalid YouTube URL format:', url)
    }
    return videoId
  } catch (error) {
    console.error('Error parsing YouTube URL:', error)
    return null
  }
}

// Handle video modal interactions
function handleVideoModal(event) {
  const videoBtn = event.target.closest('[data-action="play-video"]')
  const closeBtn = event.target.closest('[data-action="close-modal"]')
  const modal = document.getElementById('video-modal')

  if (videoBtn) {
    const videoId = videoBtn.dataset.videoId
    if (!videoId) {
      alert('Sorry, this video URL appears to be invalid.')
      return
    }
    state.activeVideoId = videoId
    window.dispatchEvent(new Event('content-update'))
    // Focus trap for accessibility
    setTimeout(() => {
      const closeButton = document.querySelector('[data-action="close-modal"]')
      if (closeButton) closeButton.focus()
    }, 100)
  }

  if (closeBtn || (modal && event.target === modal)) {
    state.activeVideoId = null
    window.dispatchEvent(new Event('content-update'))
    // Return focus to the play button
    const playButton = document.querySelector(`[data-video-id="${state.activeVideoId}"]`)
    if (playButton) playButton.focus()
  }

  // Handle Escape key
  if (event.key === 'Escape' && state.activeVideoId) {
    state.activeVideoId = null
    window.dispatchEvent(new Event('content-update'))
  }
}

// Handle search input with debounce
function handleSearchInput(event) {
  if (event.target.id !== 'song-search') return;

  // Update the search query in the state
  state.searchQuery = event.target.value;

  // Debounce the search logic to avoid excessive updates
  debouncedUpdateSearch(state.searchQuery);
}

// Prevent navigation on backspace and handle special keys
function handleSearchKeyDown(event) {
  // Only handle events from the search input
  if (event.target.id !== 'song-search') return
  
  // Stop event propagation for all keyboard events in the search
  event.stopPropagation()
  
  // Handle escape to clear search
  if (event.key === 'Escape') {
    clearSearch()
    event.preventDefault()
  }
}

// Clear search input and state
function clearSearch(event) {
  if (event) event.preventDefault()
  const searchInput = document.getElementById('song-search')
  if (searchInput) {
    searchInput.value = ''
    searchInput.focus()
  }
  state.searchQuery = ''
  window.dispatchEvent(new Event('content-update'))
}

// Handle click events for the clear button
function handleClearClick(event) {
  if (event.target.closest('.clear-search')) {
    clearSearch()
  }
}

// Initialize handlers for the component
function initializeHandlers() {
  if (state.isInitialized) return; // Prevent multiple initializations

  // Attach keydown listener to the search input dynamically
  const searchInput = document.getElementById('song-search');
  if (searchInput) {
    searchInput.addEventListener('keydown', handleSearchKeyDown);
  }

  // Mark as initialized
  state.isInitialized = true;
}

// Debounced function to update search state
const debouncedUpdateSearch = debounce((query) => {
  const trimmedQuery = query.trim();
  if (state.searchQuery !== trimmedQuery) {
    state.searchQuery = trimmedQuery;
    window.dispatchEvent(new Event('content-update'));
  }
}, 100); // Reduced debounce delay

// Helper function to normalize text for searching
function normalizeText(text) {
  return text ? text.toLowerCase().trim() : ''
}

// Load all songs from the database
async function loadSongs() {
  state.loading = true
  window.dispatchEvent(new Event('content-update'))

  try {
    const [songsResult, playlistsResult] = await Promise.all([
      supabase.from('songs').select('*').order('title'),
      supabase.from('playlists').select('*').eq('user_id', window.currentUser?.id)
    ])

    if (songsResult.error) throw songsResult.error
    if (playlistsResult.error) throw playlistsResult.error

    state.songs = songsResult.data || []
    state.playlists = playlistsResult.data || []
  } catch (error) {
    console.error('Error loading data:', error)
    state.songs = []
    state.playlists = []
  } finally {
    state.loading = false
    window.dispatchEvent(new Event('content-update'))
  }
}

// Event delegation handler for playlist actions
function handlePlaylistAction(event) {
  const target = event.target
  const action = target.dataset.action

  if (!action) return

  if (action === 'toggle-playlist') {
    const songId = target.dataset.songId
    togglePlaylistDropdown(songId)
  } else if (action === 'add-to-playlist') {
    const songId = target.dataset.songId
    const playlistId = target.dataset.playlistId
    addSongToPlaylist(songId, playlistId)
  }
}

// Toggle playlist dropdown
function togglePlaylistDropdown(songId) {
  // Close any open dropdowns first
  document.querySelectorAll('.dropdown').forEach(dropdown => {
    if (dropdown.id !== `playlist-dropdown-${songId}`) {
      dropdown.classList.add('hidden')
    }
  })

  const dropdown = document.getElementById(`playlist-dropdown-${songId}`)
  const button = dropdown.previousElementSibling
  const isExpanded = dropdown.classList.contains('hidden')
  
  dropdown.classList.toggle('hidden')
  button.setAttribute('aria-expanded', isExpanded)
}

// Add song to playlist
async function addSongToPlaylist(songId, playlistId) {
  if (!window.currentUser) {
    alert('Please login to add songs to playlists')
    return
  }

  // Set loading state
  state.addingToPlaylist = songId
  window.dispatchEvent(new Event('content-update'))

  try {
    // Check if song is already in playlist
    const { data: existing } = await supabase
      .from('playlist_songs')
      .select('id')
      .eq('playlist_id', playlistId)
      .eq('song_id', songId)
      .single()

    if (existing) {
      alert('This song is already in the playlist')
      return
    }

    // Get the current highest position in the playlist
    const { data: positions } = await supabase
      .from('playlist_songs')
      .select('position')
      .eq('playlist_id', playlistId)
      .order('position', { ascending: false })
      .limit(1)

    const nextPosition = positions?.[0]?.position ? positions[0].position + 1 : 0

    // Add the song to the playlist
    const { error } = await supabase
      .from('playlist_songs')
      .insert([
        {
          playlist_id: playlistId,
          song_id: songId,
          position: nextPosition
        }
      ])

    if (error) {
      alert('Error adding song to playlist: ' + error.message)
      return
    }

    // Hide the dropdown
    const dropdown = document.getElementById(`playlist-dropdown-${songId}`)
    const button = dropdown.previousElementSibling
    dropdown.classList.add('hidden')
    button.setAttribute('aria-expanded', 'false')

    // Show success message
    alert('Song added to playlist successfully!')
  } finally {
    // Clear loading state and refresh playlists
    state.addingToPlaylist = null
    await loadSongs() // Refresh playlists data
    window.dispatchEvent(new Event('content-update'))
  }
}

// Render search bar
function renderSearchBar() {
  return `
    <div class="search-container">
      <input
        type="text"
        id="song-search"
        class="search-input"
        placeholder="Search by title, author, or lyrics..."
        value=""
        oninput="handleSearchInput(event)"
        onkeydown="handleSearchKeyDown(event)"
        aria-label="Search songs"
        autocomplete="off"
      />
      ${state.searchQuery ? `
        <button
          class="clear-search"
          aria-label="Clear search"
          onclick="clearSearch(event)"
        >
          ✕
        </button>
      ` : ''}
    </div>
  `;
}

// Expose functions to window for inline event handlers
window.SongsList = async function(currentUser) {
  // Initialize handlers when component is mounted
  initializeHandlers()

  // Load initial data if not already loaded
  if (!state.isInitialized || state.songs.length === 0) {
    await loadSongs()
  }

  if (!currentUser) {
    return `
      <div class="container mx-auto p-8 text-center">
        <h2 class="text-2xl font-bold mb-4">Please login to view songs</h2>
        <a href="#login" class="button">Login</a>
      </div>
    `
  }

  const normalizedQuery = normalizeText(state.searchQuery)
  
  const filteredSongs = normalizedQuery
    ? state.songs.filter(song => {
        const normalizedTitle = normalizeText(song.title)
        const normalizedAuthor = normalizeText(song.author)
        const normalizedLyrics = normalizeText(song.lyrics)
        
        return normalizedTitle.includes(normalizedQuery) ||
               normalizedAuthor.includes(normalizedQuery) ||
               normalizedLyrics?.includes(normalizedQuery)
      })
    : state.songs

  const searchBar = renderSearchBar();

  // Show appropriate message if no songs found
  if (filteredSongs.length === 0) {
    return `
      <section class="container mx-auto p-4">
        <h2 class="text-3xl font-bold mb-6">Worship Songs</h2>
        ${searchBar}
        <div class="text-center py-8">
          ${state.loading ? 
            'Loading songs...' : 
            state.searchQuery ? 
              'No songs found matching your search.' :
              'No songs available.'
          }
        </div>
      </section>
    `
  }

  // Render songs list
  return `
    <section class="container mx-auto p-4" aria-labelledby="songs-heading">
      <h2 id="songs-heading" class="text-3xl font-bold mb-6">Worship Songs</h2>
      ${searchBar}
      <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        ${filteredSongs.map(song => `
          <article class="song-card" aria-labelledby="song-title-${song.id}">
            <div class="flex justify-between items-start mb-4">
              <h3 id="song-title-${song.id}" class="text-xl font-semibold">${song.title}</h3>
              <div class="flex space-x-2">
                ${currentUser && state.playlists.length ? `
                  <div class="relative">
                    <button 
                      data-action="toggle-playlist"
                      data-song-id="${song.id}"
                      class="button-icon"
                      aria-label="Add ${song.title} to playlist"
                      aria-expanded="false"
                      aria-controls="playlist-dropdown-${song.id}"
                      ${state.addingToPlaylist === song.id ? 'disabled' : ''}
                    >
                      ${state.addingToPlaylist === song.id ? '⏳' : '➕'}
                    </button>
                    <div 
                      id="playlist-dropdown-${song.id}" 
                      class="dropdown hidden"
                      role="menu"
                      aria-label="Add to playlist options"
                    >
                      ${state.playlists.map(playlist => `
                        <button
                          data-action="add-to-playlist"
                          data-song-id="${song.id}"
                          data-playlist-id="${playlist.id}"
                          class="dropdown-item"
                          role="menuitem"
                          aria-label="Add ${song.title} to ${playlist.name}"
                          ${state.addingToPlaylist === song.id ? 'disabled' : ''}
                        >
                          ${playlist.name}
                        </button>
                      `).join('')}
                    </div>
                  </div>
                ` : ''}
              </div>
            </div>
            <p class="text-gray-600 mb-4">By ${song.author || 'Unknown'}</p>
            ${song.youtube_url ? `
              <button 
                data-action="play-video"
                data-video-id="${getYouTubeVideoId(song.youtube_url)}"
                class="button inline-flex items-center space-x-2"
                aria-label="Play ${song.title}"
              >
                <span>Play Video</span>
                <span aria-hidden="true">▶️</span>
              </button>
            ` : ''}
          </article>
        `).join('')}
      </div>

      ${state.activeVideoId ? `
        <div 
          id="video-modal" 
          class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 md:p-8"
          role="dialog"
          aria-modal="true"
          aria-labelledby="video-modal-title"
          onclick="handleVideoModal(event)"
          onkeydown="if(event.key==='Escape')handleVideoModal(event)"
        >
          <div class="bg-white rounded-lg shadow-lg max-w-4xl w-full mx-auto overflow-hidden">
            <div class="flex justify-between items-center p-4 border-b">
              <h3 id="video-modal-title" class="text-xl font-semibold">Now Playing</h3>
              <button 
                data-action="close-modal"
                class="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Close video"
              >
                <span aria-hidden="true" class="text-xl">✕</span>
              </button>
            </div>
            <div class="relative bg-black" style="padding-bottom: 56.25%">
              <div class="absolute inset-0 flex items-center justify-center">
                <div class="loading-spinner"></div>
              </div>
              <iframe
                class="absolute inset-0 w-full h-full"
                src="https://www.youtube.com/embed/${state.activeVideoId}?autoplay=1&rel=0"
                title="YouTube video player"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen
                onload="this.previousElementSibling.style.display='none'"
              ></iframe>
            </div>
          </div>
        </div>
      ` : ''}
    </section>
  `
}

// Expose function to window for inline event handlers
window.AddSongForm = function(currentUser) {
  if (!currentUser) {
    return `
      <div class="container mx-auto p-8 text-center">
        <h2 class="text-2xl font-bold mb-4">Please login to add songs</h2>
        <a href="#login" class="button">Login</a>
      </div>
    `
  }

  return `
    <section class="container mx-auto p-4" aria-labelledby="add-song-heading">
      <h2 id="add-song-heading" class="text-3xl font-bold mb-6">Add New Song</h2>
      <form 
        id="add-song-form" 
        class="max-w-lg mx-auto space-y-6" 
        onsubmit="handleAddSong(event)"
        aria-labelledby="add-song-heading"
      >
        <div class="form-group">
          <label for="song-title" class="form-label">Song Title</label>
          <input 
            type="text" 
            id="song-title" 
            required 
            class="input"
            aria-required="true"
          />
        </div>
        <div class="form-group">
          <label for="song-author" class="form-label">Author</label>
          <input 
            type="text" 
            id="song-author" 
            class="input"
            aria-required="false"
          />
        </div>
        <div class="form-group">
          <label for="youtube-url" class="form-label">YouTube URL</label>
          <input 
            type="url" 
            id="youtube-url" 
            class="input"
            aria-required="false"
            pattern="https?://.*"
            title="Please enter a valid URL starting with http:// or https://"
          />
          <small id="youtube-help" class="text-gray-500">
            Optional: Add a link to the song on YouTube
          </small>
        </div>
        <button type="submit" class="button w-full">Add Song</button>
      </form>
    </section>
  `
}

// Expose functions to window for inline event handlers
window.handleAddSong = async function(event, currentUser) {
  event.preventDefault()
  if (!currentUser) {
    alert('Please login to add songs')
    return
  }

  const title = document.getElementById('song-title').value
  const author = document.getElementById('song-author').value
  const youtubeUrl = document.getElementById('youtube-url').value

  const { error } = await supabase
    .from('songs')
    .insert([
      { 
        title, 
        author, 
        youtube_url: youtubeUrl,
        created_by: currentUser.id
      }
    ])

  if (error) {
    alert('Error adding song: ' + error.message)
    return
  }

  event.target.reset()
  window.location.hash = '#songs'
  await loadSongs() // Refresh playlists data
  window.dispatchEvent(new Event('content-update'))
}

let isUpdating = false;

window.handleSearchInput = (event) => {
  if (isUpdating) return;
  isUpdating = true;

  window.searchQuery = event.target.value;

  SongsList(window.currentUser, window.searchQuery).then(content => {
    const mainContent = document.querySelector('main');
    if (mainContent) {
      mainContent.innerHTML = content;
    }
    isUpdating = false;
  });
};

// Expose functions to window for inline event handlers
window.handleSearchKeyDown = handleSearchKeyDown;
window.clearSearch = clearSearch;

document.addEventListener('DOMContentLoaded', () => {
  console.log('handleSearchKeyDown before attaching:', handleSearchKeyDown);
  window.handleSearchKeyDown = handleSearchKeyDown;
  console.log('handleSearchKeyDown is attached to window:', window.handleSearchKeyDown);

  window.handleSearchInput = handleSearchInput;
  window.handleSearchKeyDown = handleSearchKeyDown;
  window.clearSearch = clearSearch;

  console.log('Functions are now attached to window.');
});


