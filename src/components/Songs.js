import { marked } from 'marked'
import supabase from '../services/supabase.js'

// Global state for songs list and search
const state = {
  songs: [],
  playlists: [], // Add playlists to state
  searchQuery: '',
  loading: false,
  addingToPlaylist: null,
  activeVideoId: null // Track currently playing video
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

// Initialize handlers for the component
function initializeHandlers() {
  // Remove any existing handlers first
  document.removeEventListener('click', handlePlaylistAction)
  document.removeEventListener('content-update', loadSongs)
  document.removeEventListener('click', handleVideoModal)

  // Add handlers
  document.addEventListener('click', handlePlaylistAction)
  document.addEventListener('content-update', loadSongs)
  document.addEventListener('click', handleVideoModal)
}

// Extract YouTube video ID from URL
function getYouTubeVideoId(url) {
  if (!url) return null
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  const match = url.match(regExp)
  return (match && match[2].length === 11) ? match[2] : null
}

// Handle video modal interactions
function handleVideoModal(event) {
  const videoBtn = event.target.closest('[data-action="play-video"]')
  const closeBtn = event.target.closest('[data-action="close-modal"]')
  const modal = document.getElementById('video-modal')

  if (videoBtn) {
    const videoId = videoBtn.dataset.videoId
    state.activeVideoId = videoId
    window.dispatchEvent(new Event('content-update'))
  }

  if (closeBtn || (modal && event.target === modal)) {
    state.activeVideoId = null
    window.dispatchEvent(new Event('content-update'))
  }
}

// Load all songs from the database
export async function loadSongs() {
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

// Handle search input with debounce
export function handleSearchInput(event) {
  // Prevent the event from bubbling up
  event.stopPropagation()
  event.preventDefault()
  
  // Update the input value immediately
  const query = event.target.value
  const input = event.target
  input.value = query

  // Debounce the state update and re-render
  debouncedUpdateSearch(query)
}

// Prevent navigation on backspace
export function handleSearchKeyDown(event) {
  if (event.key === 'Backspace') {
    event.stopPropagation()
  }
}

// Debounced function to update search state
const debouncedUpdateSearch = debounce((query) => {
  state.searchQuery = query
  window.dispatchEvent(new Event('content-update'))
}, 300)

export function clearSearch() {
  state.searchQuery = ''
  document.getElementById('song-search').value = ''
  window.dispatchEvent(new Event('content-update'))
}

export async function SongsList(currentUser) {
  // Initialize handlers when component is mounted
  initializeHandlers()

  // Load initial data
  await loadSongs()

  if (!currentUser) {
    return `
      <div class="container mx-auto p-8 text-center">
        <h2 class="text-2xl font-bold mb-4">Please login to view songs</h2>
        <a href="#login" class="button">Login</a>
      </div>
    `
  }

  // Load songs if not already loaded
  if (state.songs.length === 0 && !state.loading) {
    await loadSongs()
  }

  const filteredSongs = state.searchQuery
    ? state.songs.filter(song => 
        song.title.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
        (song.author && song.author.toLowerCase().includes(state.searchQuery.toLowerCase()))
      )
    : state.songs

  const searchBar = `
    <div class="mb-6">
      <div class="flex gap-4 items-center">
        <div class="flex-1">
          <input
            type="search"
            id="song-search"
            class="input"
            placeholder="Search songs..."
            value="${state.searchQuery}"
            onkeydown="handleSearchKeyDown(event)"
            oninput="handleSearchInput(event)"
            aria-label="Search songs"
          />
        </div>
        ${state.searchQuery ? `
          <button
            onclick="clearSearch()"
            class="button-icon"
            aria-label="Clear search"
          >
            ❌
          </button>
        ` : ''}
      </div>
    </div>
  `

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
        <div id="video-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div class="bg-white p-4 rounded-lg shadow-lg max-w-3xl w-full mx-4">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-xl font-semibold">Now Playing</h3>
              <button 
                data-action="close-modal"
                class="text-gray-500 hover:text-gray-700"
                aria-label="Close video"
              >
                ✕
              </button>
            </div>
            <div class="relative" style="padding-bottom: 56.25%">
              <iframe
                class="absolute inset-0 w-full h-full"
                src="https://www.youtube.com/embed/${state.activeVideoId}?autoplay=1"
                title="YouTube video player"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen
              ></iframe>
            </div>
          </div>
        </div>
      ` : ''}
    </section>
  `
}

export function AddSongForm(currentUser) {
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

export async function handleAddSong(event, currentUser) {
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

// Event delegation handler for playlist actions
export function handlePlaylistAction(event) {
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
