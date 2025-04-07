import supabase from '../services/supabase.js'

// Initialize handlers for the component
function initializeHandlers() {
  // Remove any existing handlers first
  document.removeEventListener('click', handlePlaylistAction)

  // Add the handlers
  document.addEventListener('click', handlePlaylistAction)
}

export async function PlaylistsView(currentUser) {
  // Initialize handlers when component is mounted
  initializeHandlers()

  if (!currentUser) {
    return `
      <div class="container mx-auto p-8 text-center">
        <h2 class="text-2xl font-bold mb-4">Please login to view playlists</h2>
        <a href="#login" class="button">Login</a>
      </div>
    `
  }

  const { data: playlists, error } = await supabase
    .from('playlists')
    .select(`
      *,
      playlist_songs (
        songs (
          id,
          title,
          author
        )
      )
    `)
    .eq('user_id', currentUser.id)

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
    <section class="container mx-auto p-4" aria-labelledby="playlists-heading">
      <div class="flex justify-between items-center mb-6">
        <h2 id="playlists-heading" class="text-3xl font-bold">My Playlists</h2>
        <button 
          data-action="create-playlist"
          class="button"
          aria-label="Create a new playlist"
        >
          Create New Playlist
        </button>
      </div>
      <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        ${playlists.map(playlist => `
          <article 
            class="bg-white rounded-lg shadow-md p-6"
            aria-labelledby="playlist-title-${playlist.id}"
          >
            <div class="flex justify-between items-start mb-4">
              <h3 id="playlist-title-${playlist.id}" class="text-xl font-semibold">
                ${playlist.name}
              </h3>
              <div class="flex space-x-2">
                <button 
                  data-action="edit-playlist"
                  data-playlist-id="${playlist.id}"
                  class="button-icon"
                  aria-label="Edit ${playlist.name}"
                >
                  ✏️
                </button>
                <button 
                  data-action="delete-playlist"
                  data-playlist-id="${playlist.id}"
                  class="button-icon text-red-600"
                  aria-label="Delete ${playlist.name}"
                >
                  🗑️
                </button>
              </div>
            </div>
            ${playlist.description ? 
              `<p class="text-gray-600 mb-4">${playlist.description}</p>` 
              : ''
            }
            <div class="mt-4">
              <h4 id="songs-heading-${playlist.id}" class="font-semibold mb-2">
                Songs
              </h4>
              ${playlist.playlist_songs?.length ? `
                <ul 
                  class="space-y-2 divide-y divide-gray-100"
                  aria-labelledby="songs-heading-${playlist.id}"
                >
                  ${playlist.playlist_songs.map(ps => `
                    <li class="flex justify-between items-center pt-2">
                      <div>
                        <span class="font-medium">${ps.songs.title}</span>
                        ${ps.songs.author ? 
                          `<span class="text-gray-500"> - ${ps.songs.author}</span>` 
                          : ''
                        }
                      </div>
                      <button 
                        data-action="remove-song"
                        data-playlist-id="${playlist.id}"
                        data-song-id="${ps.songs.id}"
                        class="button-icon text-red-600"
                        aria-label="Remove ${ps.songs.title} from ${playlist.name}"
                      >
                        ✕
                      </button>
                    </li>
                  `).join('')}
                </ul>
              ` : `
                <p class="text-gray-500" role="status">
                  No songs added yet
                </p>
              `}
            </div>
          </article>
        `).join('')}
      </div>
    </section>
  `
}

export async function handleCreatePlaylist(currentUser) {
  const name = prompt('Enter playlist name:')
  if (!name?.trim()) return

  const description = prompt('Enter playlist description (optional):')

  const { error } = await supabase
    .from('playlists')
    .insert([
      {
        name: name.trim(),
        description: description?.trim(),
        user_id: currentUser.id
      }
    ])

  if (error) {
    alert('Error creating playlist: ' + error.message)
    return
  }

  window.dispatchEvent(new Event('content-update'))
}

export async function handleEditPlaylist(playlistId, currentUser) {
  const { data: playlist, error: fetchError } = await supabase
    .from('playlists')
    .select('*')
    .eq('id', playlistId)
    .single()

  if (fetchError) {
    alert('Error fetching playlist: ' + fetchError.message)
    return
  }

  const name = prompt('Enter new playlist name:', playlist.name)
  if (!name?.trim()) return

  const description = prompt('Enter new playlist description:', playlist.description)

  const { error } = await supabase
    .from('playlists')
    .update({ 
      name: name.trim(),
      description: description?.trim()
    })
    .eq('id', playlistId)

  if (error) {
    alert('Error updating playlist: ' + error.message)
    return
  }

  window.dispatchEvent(new Event('content-update'))
}

export async function handleDeletePlaylist(playlistId) {
  if (!confirm('Are you sure you want to delete this playlist? This cannot be undone.')) {
    return
  }

  const { error } = await supabase
    .from('playlists')
    .delete()
    .eq('id', playlistId)

  if (error) {
    alert('Error deleting playlist: ' + error.message)
    return
  }

  window.dispatchEvent(new Event('content-update'))
}

export async function addSongToPlaylist(songId, playlistId) {
  const { error } = await supabase
    .from('playlist_songs')
    .insert([
      {
        playlist_id: playlistId,
        song_id: songId
      }
    ])

  if (error) {
    if (error.code === '23505') {
      alert('This song is already in the playlist')
    } else {
      alert('Error adding song to playlist: ' + error.message)
    }
    return
  }

  alert('Song added to playlist successfully!')
  window.dispatchEvent(new Event('content-update'))
}

export async function removeSongFromPlaylist(playlistId, songId) {
  const { error } = await supabase
    .from('playlist_songs')
    .delete()
    .match({ playlist_id: playlistId, song_id: songId })

  if (error) {
    alert('Error removing song from playlist: ' + error.message)
    return
  }

  window.dispatchEvent(new Event('content-update'))
}

// Event delegation handler for playlist actions
export function handlePlaylistAction(event) {
  const target = event.target
  const action = target.dataset.action

  if (!action) return

  const playlistId = target.dataset.playlistId
  const songId = target.dataset.songId

  switch (action) {
    case 'create-playlist':
      handleCreatePlaylist(window.currentUser)
      break
    case 'edit-playlist':
      handleEditPlaylist(playlistId, window.currentUser)
      break
    case 'delete-playlist':
      handleDeletePlaylist(playlistId)
      break
    case 'remove-song':
      removeSongFromPlaylist(playlistId, songId)
      break
  }
}
