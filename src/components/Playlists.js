import supabase from '../services/supabase.js'

export async function PlaylistsView(currentUser) {
  if (!currentUser) {
    return `
      <div class="text-center p-8">
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
    return `<div role="alert" class="bg-red-100 text-red-700 p-4 rounded">Error loading playlists: ${error.message}</div>`
  }

  return `
    <section class="container mx-auto p-4">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-3xl font-bold">My Playlists</h2>
        <button onclick="handleCreatePlaylist()" class="button">Create New Playlist</button>
      </div>
      <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        ${playlists.map(playlist => `
          <article class="bg-white rounded-lg shadow-md p-6">
            <div class="flex justify-between items-start mb-4">
              <h3 class="text-xl font-semibold">${playlist.name}</h3>
              <div class="flex space-x-2">
                <button onclick="handleEditPlaylist('${playlist.id}')" class="text-blue-600 hover:text-blue-800">
                  <span class="sr-only">Edit ${playlist.name}</span>
                  ✏️
                </button>
                <button onclick="handleDeletePlaylist('${playlist.id}')" class="text-red-600 hover:text-red-800">
                  <span class="sr-only">Delete ${playlist.name}</span>
                  🗑️
                </button>
              </div>
            </div>
            ${playlist.description ? `<p class="text-gray-600 mb-4">${playlist.description}</p>` : ''}
            <div class="mt-4">
              <h4 class="font-semibold mb-2">Songs</h4>
              ${playlist.playlist_songs?.length ? `
                <ul class="space-y-2">
                  ${playlist.playlist_songs.map(ps => `
                    <li class="flex justify-between items-center">
                      <span>${ps.songs.title} - ${ps.songs.author || 'Unknown'}</span>
                      <button 
                        onclick="removeSongFromPlaylist('${playlist.id}', ${ps.songs.id})"
                        class="text-red-600 hover:text-red-800"
                      >
                        ✕
                      </button>
                    </li>
                  `).join('')}
                </ul>
              ` : '<p class="text-gray-500">No songs added yet</p>'}
            </div>
          </article>
        `).join('')}
      </div>
    </section>
  `
}

export async function handleCreatePlaylist(currentUser) {
  const name = prompt('Enter playlist name:')
  if (!name) return

  const description = prompt('Enter playlist description (optional):')

  const { error } = await supabase
    .from('playlists')
    .insert([
      {
        name,
        description,
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
  if (!name) return

  const description = prompt('Enter new playlist description:', playlist.description)

  const { error } = await supabase
    .from('playlists')
    .update({ name, description })
    .eq('id', playlistId)

  if (error) {
    alert('Error updating playlist: ' + error.message)
    return
  }

  window.dispatchEvent(new Event('content-update'))
}

export async function handleDeletePlaylist(playlistId) {
  if (!confirm('Are you sure you want to delete this playlist?')) return

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
    alert('Error adding song to playlist: ' + error.message)
    return
  }

  alert('Song added to playlist!')
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

// Initialize playlist handlers
window.handleCreatePlaylist = () => handleCreatePlaylist(window.currentUser)
window.handleEditPlaylist = (playlistId) => handleEditPlaylist(playlistId, window.currentUser)
window.handleDeletePlaylist = handleDeletePlaylist
window.addSongToPlaylist = addSongToPlaylist
window.removeSongFromPlaylist = removeSongFromPlaylist
window.togglePlaylistDropdown = (songId) => {
  const dropdown = document.getElementById(`playlist-dropdown-${songId}`)
  dropdown.classList.toggle('hidden')
}
