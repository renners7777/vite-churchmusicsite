import './style.css'
import { createClient } from '@supabase/supabase-js'
import { marked } from 'marked'

// Initialize Supabase client
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

// Main app component
const app = document.querySelector('#app')

// Header component
function Header() {
  return `
    <header class="header bg-primary-600 text-white p-4">
      <div class="container mx-auto flex items-center justify-between">
        <div class="flex items-center">
          <img src="/Reverse-Full-logo.png" alt="St Timothy's Church Logo" class="h-12 w-auto mr-4">
          <h1 class="text-2xl font-bold">St Timothy's Church Music</h1>
        </div>
        <nav>
          <ul class="flex space-x-4">
            <li><a href="#songs" class="hover:text-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-300 rounded">Songs</a></li>
            <li><a href="#add-song" class="hover:text-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-300 rounded">Add Song</a></li>
          </ul>
        </nav>
      </div>
    </header>
  `
}

// Songs list component
async function SongsList() {
  const { data: songs, error } = await supabase
    .from('songs')
    .select('*')
    .order('title')

  if (error) {
    return `<div role="alert" class="bg-red-100 text-red-700 p-4 rounded">Error loading songs: ${error.message}</div>`
  }

  return `
    <section aria-labelledby="songs-heading" class="container mx-auto p-4">
      <h2 id="songs-heading" class="text-3xl font-bold mb-6">Worship Songs</h2>
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        ${songs.map(song => `
          <article class="song-card">
            <h3 class="text-xl font-semibold mb-2">${song.title}</h3>
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

// Add song form component
function AddSongForm() {
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

// Event handlers
window.handleCommentSubmit = async (event, songId) => {
  event.preventDefault()
  const textarea = event.target.querySelector('textarea')
  const comment = textarea.value

  const { error } = await supabase
    .from('songs')
    .update({
      comments: comment
    })
    .eq('id', songId)

  if (error) {
    alert('Error adding comment: ' + error.message)
    return
  }

  textarea.value = ''
  renderApp()
}

window.handleAddSong = async (event) => {
  event.preventDefault()
  const title = document.getElementById('song-title').value
  const author = document.getElementById('song-author').value
  const youtubeUrl = document.getElementById('youtube-url').value

  const { error } = await supabase
    .from('songs')
    .insert([
      { title, author, youtube_url: youtubeUrl }
    ])

  if (error) {
    alert('Error adding song: ' + error.message)
    return
  }

  event.target.reset()
  renderApp()
}

// Router
function handleRoute() {
  const hash = window.location.hash || '#songs'
  const main = document.querySelector('main')
  
  switch (hash) {
    case '#add-song':
      main.innerHTML = AddSongForm()
      break
    default:
      SongsList().then(content => {
        main.innerHTML = content
      })
  }
}

// Render app
async function renderApp() {
  app.innerHTML = `
    <a href="#main" class="skip-link">Skip to main content</a>
    ${Header()}
    <main id="main" tabindex="-1">
      ${await SongsList()}
    </main>
    <footer class="bg-gray-100 p-4 mt-8">
      <div class="container mx-auto text-center">
        <p>Contact us: <a href="mailto:ChrisRenshaw7@outlook.com" class="text-blue-600 hover:underline">ChrisRenshaw7@outlook.com</a></p>
        <p class="mt-2">© ${new Date().getFullYear()} Chris Renshaw</p>
      </div>
    </footer>
  `
}

// Initialize app
window.addEventListener('hashchange', handleRoute)
renderApp()