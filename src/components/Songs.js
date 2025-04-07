import { marked } from 'marked'
import supabase from '../services/supabase.js'

// Global state for songs list and search
const state = {
  songs: [],
  searchQuery: '',
  loading: false
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

export async function SongsList(currentUser) {
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

  const { data: playlists } = await supabase
    .from('playlists')
    .select('id, name')
    .eq('user_id', currentUser.id)

  // Search bar with loading state
  const searchBar = `
    <div>
      <div class="mb-6">
        <h1 class="text-2xl font-bold">Welcome, ${currentUser.email}</h1>
      </div>
      <div class="mb-6">
        <label for="song-search" class="sr-only">Search songs</label>
        <div class="relative">
          <input 
            type="text" 
            id="song-search" 
            placeholder="Search songs..." 
            class="input pl-10 ${state.loading ? 'opacity-50' : ''}"
            value="${state.searchQuery}"
            onkeydown="handleSearchKeyDown(event)"
            oninput="handleSearchInput(event)"
            ${state.loading ? 'disabled' : ''}
            aria-label="Search songs"
          />
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            ${state.loading ? '⌛' : '🔍'}
          </span>
          ${state.searchQuery ? `
            <button 
              onclick="clearSearch()"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
              ${state.loading ? 'disabled' : ''}
            >
              ✕
            </button>
          ` : ''}
        </div>
      </div>
    </div>
  `

  // Filter songs based on search query
  const filteredSongs = state.songs.filter(song => 
    song.title.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
    (song.author && song.author.toLowerCase().includes(state.searchQuery.toLowerCase()))
  )

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
                ${playlists?.length ? `
                  <div class="relative">
                    <button 
                      onclick="togglePlaylistDropdown(${song.id})" 
                      class="button-icon"
                      aria-label="Add ${song.title} to playlist"
                      aria-expanded="false"
                      aria-controls="playlist-dropdown-${song.id}"
                    >
                      ➕
                    </button>
                    <div 
                      id="playlist-dropdown-${song.id}" 
                      class="dropdown hidden"
                      role="menu"
                      aria-label="Add to playlist options"
                    >
                      ${playlists.map(playlist => `
                        <button
                          onclick="addSongToPlaylist(${song.id}, '${playlist.id}')"
                          class="dropdown-item"
                          role="menuitem"
                          aria-label="Add ${song.title} to ${playlist.name}"
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
              <a 
                href="${song.youtube_url}" 
                target="_blank" 
                rel="noopener noreferrer" 
                class="button inline-flex items-center space-x-2"
                aria-label="Watch ${song.title} on YouTube (opens in new tab)"
              >
                <span>Watch on YouTube</span>
                <span aria-hidden="true">↗️</span>
              </a>
            ` : ''}
          </article>
        `).join('')}
      </div>
    </section>
  `
}

// Load all songs from the database
async function loadSongs() {
  state.loading = true
  window.dispatchEvent(new Event('content-update'))

  const { data, error } = await supabase
    .from('songs')
    .select('*')
    .order('title')

  if (error) {
    console.error('Error loading songs:', error)
    state.songs = []
  } else {
    state.songs = data || []
  }

  state.loading = false
  window.dispatchEvent(new Event('content-update'))
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
  window.dispatchEvent(new Event('content-update'))
}

// Toggle playlist dropdown
export function togglePlaylistDropdown(songId) {
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
export async function addSongToPlaylist(songId, playlistId) {
  if (!window.currentUser) {
    alert('Please login to add songs to playlists')
    return
  }

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
}

// Initialize all handlers
window.handleAddSong = (event) => handleAddSong(event, window.currentUser)
window.handleSearchInput = handleSearchInput
window.handleSearchKeyDown = handleSearchKeyDown
window.clearSearch = clearSearch
window.togglePlaylistDropdown = togglePlaylistDropdown
window.addSongToPlaylist = addSongToPlaylist
