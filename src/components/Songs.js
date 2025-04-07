import { marked } from 'marked'
import supabase from '../services/supabase.js'

// Store search state
let searchTimeout = null
let currentSearchQuery = ''

export async function SongsList(currentUser, searchQuery = '') {
  if (!currentUser) {
    return `
      <div class="container mx-auto p-8 text-center">
        <h2 class="text-2xl font-bold mb-4">Please login to view songs</h2>
        <a href="#login" class="button">Login</a>
      </div>
    `
  }

  const { data: playlists } = await supabase
    .from('playlists')
    .select('id, name')
    .eq('user_id', currentUser.id)

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
            class="input pl-10"
            value="${currentSearchQuery}"
            oninput="handleSearchInput(event)"
            aria-label="Search songs"
          />
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            🔍
          </span>
          ${currentSearchQuery ? `
            <button 
              onclick="clearSearch()"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              ✕
            </button>
          ` : ''}
        </div>
      </div>
    </div>
  `

  let query = supabase
    .from('songs')
    .select('*')
    .order('title')

  if (currentSearchQuery) {
    query = query.ilike('title', `%${currentSearchQuery}%`)
  }

  const { data: songs, error } = await query

  if (error) {
    return `
      <div role="alert" class="container mx-auto p-4">
        <div class="bg-red-100 text-red-700 p-4 rounded">
          <h2 class="font-bold">Error</h2>
          <p>${error.message}</p>
        </div>
      </div>
    `
  }

  return `
    <section class="container mx-auto p-4" aria-labelledby="songs-heading">
      <h2 id="songs-heading" class="text-3xl font-bold mb-6">Worship Songs</h2>
      ${searchBar}
      <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        ${songs.map(song => `
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
                      aria-expanded="${false}"
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
                <button 
                  onclick="handleEditSong(${song.id})" 
                  class="button-icon"
                  aria-label="Edit ${song.title}"
                >
                  ✏️
                </button>
                <button 
                  onclick="handleDeleteSong(${song.id})" 
                  class="button-icon text-red-600"
                  aria-label="Delete ${song.title}"
                >
                  🗑️
                </button>
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

export async function handleEditSong(songId, currentUser) {
  if (!currentUser) {
    alert('Please login to edit songs')
    return
  }

  const { data: song, error } = await supabase
    .from('songs')
    .select('*')
    .eq('id', songId)
    .single()

  if (error) {
    alert('Error fetching song: ' + error.message)
    return
  }

  const newTitle = prompt('Enter new title:', song.title)
  if (!newTitle) return

  const newAuthor = prompt('Enter new author:', song.author)
  if (!newAuthor) return

  const newYoutubeUrl = prompt('Enter new YouTube URL:', song.youtube_url)

  const { error: updateError } = await supabase
    .from('songs')
    .update({ 
      title: newTitle, 
      author: newAuthor, 
      youtube_url: newYoutubeUrl,
      updated_by: currentUser.id
    })
    .eq('id', songId)

  if (updateError) {
    alert('Error updating song: ' + updateError.message)
    return
  }

  window.dispatchEvent(new Event('content-update'))
}

export async function handleDeleteSong(songId, currentUser) {
  if (!currentUser) {
    alert('Please login to delete songs')
    return
  }

  if (!confirm('Are you sure you want to delete this song?')) {
    return
  }

  const { error } = await supabase
    .from('songs')
    .delete()
    .eq('id', songId)

  if (error) {
    alert('Error deleting song: ' + error.message)
    return
  }

  window.dispatchEvent(new Event('content-update'))
}

export function handleSearchInput(event) {
  const query = event.target.value
  
  // Clear any existing timeout
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  
  // Set a new timeout to update content after user stops typing
  searchTimeout = setTimeout(() => {
    currentSearchQuery = query.trim()
    window.dispatchEvent(new Event('content-update'))
  }, 500)
}

export function clearSearch() {
  currentSearchQuery = ''
  document.getElementById('song-search').value = ''
  window.dispatchEvent(new Event('content-update'))
}

// Initialize all handlers
window.handleAddSong = (event) => handleAddSong(event, window.currentUser)
window.handleEditSong = (songId) => handleEditSong(songId, window.currentUser)
window.handleDeleteSong = (songId) => handleDeleteSong(songId, window.currentUser)
window.handleSearchInput = handleSearchInput
window.clearSearch = clearSearch
