import { marked } from 'marked'
import supabase from '../services/supabase.js'

export async function SongsList(currentUser, searchQuery = '') {
  if (!currentUser) {
    return `
      <div class="text-center p-8">
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
    <div class="mb-6">
      <input 
        type="text" 
        id="song-search" 
        placeholder="Search songs..." 
        class="input w-full max-w-md"
        value="${searchQuery}"
        oninput="handleSearchInput(event)"
      />
    </div>
  `

  let query = supabase
    .from('songs')
    .select('*')
    .order('title')

  if (searchQuery) {
    query = query.ilike('title', `%${searchQuery}%`)
  }

  const { data: songs, error } = await query

  if (error) {
    return `<div role="alert" class="bg-red-100 text-red-700 p-4 rounded">Error loading songs: ${error.message}</div>`
  }

  return `
    <section aria-labelledby="songs-heading" class="container mx-auto p-4">
      <h2 id="songs-heading" class="text-3xl font-bold mb-6">Worship Songs</h2>
      ${searchBar}
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        ${songs.map(song => `
          <article class="song-card">
            <div class="flex justify-between items-start mb-2">
              <h3 class="text-xl font-semibold">${song.title}</h3>
              <div class="flex space-x-2">
                ${playlists?.length ? `
                  <div class="relative">
                    <button 
                      onclick="togglePlaylistDropdown(${song.id})" 
                      class="text-blue-600 hover:text-blue-800"
                      aria-label="Add to playlist"
                    >
                      ➕
                    </button>
                    <div id="playlist-dropdown-${song.id}" class="hidden absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
                      ${playlists.map(playlist => `
                        <button
                          onclick="addSongToPlaylist(${song.id}, '${playlist.id}')"
                          class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          ${playlist.name}
                        </button>
                      `).join('')}
                    </div>
                  </div>
                ` : ''}
                <button onclick="handleEditSong(${song.id})" class="text-blue-600 hover:text-blue-800">
                  <span class="sr-only">Edit ${song.title}</span>
                  ✏️
                </button>
                <button onclick="handleDeleteSong(${song.id})" class="text-red-600 hover:text-red-800">
                  <span class="sr-only">Delete ${song.title}</span>
                  🗑️
                </button>
              </div>
            </div>
            <p class="text-gray-600 mb-4">${song.author || 'Unknown'}</p>
            ${song.youtube_url ? `
              <a href="${song.youtube_url}" 
                 target="_blank" 
                 rel="noopener noreferrer" 
                 class="button"
                 aria-label="Watch ${song.title} on YouTube">
                Watch on YouTube
              </a>
            ` : ''}
            <div class="mt-4">
              <h4 class="font-semibold mb-2">Comments</h4>
              <div id="comments-${song.id}" class="space-y-2">
                ${song.comments ? marked.parse(song.comments) : 'No comments yet'}
              </div>
              <form onsubmit="handleCommentSubmit(event, ${song.id})" class="mt-4">
                <label for="comment-${song.id}" class="block text-sm font-medium text-gray-700">Add a comment:</label>
                <textarea
                  id="comment-${song.id}"
                  class="input mt-1"
                  rows="3"
                  required
                  aria-label="Add your comment"
                ></textarea>
                <button type="submit" class="button mt-2">Submit Comment</button>
              </form>
            </div>
          </article>
        `).join('')}
      </div>
    </section>
  `
}

export function AddSongForm(currentUser) {
  if (!currentUser) {
    return `
      <div class="text-center p-8">
        <h2 class="text-2xl font-bold mb-4">Please login to add songs</h2>
        <a href="#login" class="button">Login</a>
      </div>
    `
  }

  return `
    <section aria-labelledby="add-song-heading" class="container mx-auto p-4">
      <h2 id="add-song-heading" class="text-3xl font-bold mb-6">Add New Song</h2>
      <form id="add-song-form" class="max-w-lg mx-auto" onsubmit="handleAddSong(event)">
        <div class="space-y-4">
          <div>
            <label for="song-title" class="block text-sm font-medium text-gray-700">Song Title</label>
            <input type="text" id="song-title" required class="input" />
          </div>
          <div>
            <label for="song-author" class="block text-sm font-medium text-gray-700">Author</label>
            <input type="text" id="song-author" class="input" />
          </div>
          <div>
            <label for="youtube-url" class="block text-sm font-medium text-gray-700">YouTube URL</label>
            <input type="url" id="youtube-url" class="input" />
          </div>
          <button type="submit" class="button w-full">Add Song</button>
        </div>
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

// Initialize song handlers
window.handleAddSong = (event) => handleAddSong(event, window.currentUser)
window.handleEditSong = (songId) => handleEditSong(songId, window.currentUser)
window.handleDeleteSong = (songId) => handleDeleteSong(songId, window.currentUser)
