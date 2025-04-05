import supabase from '../services/supabase.js'

export function AddSongForm() {
  return `
    <div class="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 class="text-2xl font-bold mb-6">Add New Song</h2>
      <form onsubmit="handleAddSong(event)" class="space-y-4">
        <div>
          <label for="title" class="block text-sm font-medium text-gray-700">Title</label>
          <input 
            type="text" 
            id="title" 
            required 
            class="input"
            aria-label="Song title"
          />
        </div>
        <div>
          <label for="author" class="block text-sm font-medium text-gray-700">Author</label>
          <input 
            type="text" 
            id="author" 
            required 
            class="input"
            aria-label="Song author"
          />
        </div>
        <div>
          <label for="youtube-url" class="block text-sm font-medium text-gray-700">YouTube URL</label>
          <input 
            type="url" 
            id="youtube-url" 
            required
            class="input"
            aria-label="YouTube URL"
            pattern="https?://.*"
            title="Please enter a valid URL starting with http:// or https://"
          />
        </div>
        <div class="flex justify-end space-x-3">
          <a 
            href="#songs" 
            class="button button-secondary"
            aria-label="Cancel adding song"
          >
            Cancel
          </a>
          <button 
            type="submit" 
            class="button"
            aria-label="Save new song"
          >
            Save Song
          </button>
        </div>
      </form>
    </div>
  `
}

export async function handleAddSong(event) {
  event.preventDefault()
  
  const title = document.getElementById('title').value.trim()
  const author = document.getElementById('author').value.trim()
  const youtubeUrl = document.getElementById('youtube-url').value.trim()

  if (!title || !author || !youtubeUrl) {
    alert('Please fill in all required fields')
    return
  }

  const { error } = await supabase
    .from('songs')
    .insert([
      {
        title,
        author,
        youtube_url: youtubeUrl,
        created_by: window.currentUser.id
      }
    ])

  if (error) {
    alert('Error adding song: ' + error.message)
    return
  }

  alert('Song added successfully!')
  window.location.hash = '#songs'
  window.dispatchEvent(new Event('content-update'))
}

// Initialize handlers
window.handleAddSong = handleAddSong
