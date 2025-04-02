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

// Auth state
let currentUser = null

// Auth components
function LoginForm() {
  return `
    <div class="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 class="text-2xl font-bold mb-4">Login</h2>
      <form onsubmit="handleLogin(event)" class="space-y-4">
        <div>
          <label for="login-email" class="block text-sm font-medium text-gray-700">Email</label>
          <input type="email" id="login-email" required class="input" />
        </div>
        <div>
          <label for="login-password" class="block text-sm font-medium text-gray-700">Password</label>
          <input type="password" id="login-password" required class="input" />
        </div>
        <button type="submit" class="button w-full">Login</button>
      </form>
      <p class="mt-4 text-center">
        Don't have an account? 
        <a href="#signup" class="text-blue-600 hover:underline">Sign up</a>
      </p>
    </div>
  `
}

function SignupForm() {
  return `
    <div class="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 class="text-2xl font-bold mb-4">Sign Up</h2>
      <form onsubmit="handleSignup(event)" class="space-y-4">
        <div>
          <label for="signup-email" class="block text-sm font-medium text-gray-700">Email</label>
          <input type="email" id="signup-email" required class="input" />
        </div>
        <div>
          <label for="signup-password" class="block text-sm font-medium text-gray-700">Password</label>
          <input type="password" id="signup-password" required class="input" minlength="6" />
        </div>
        <button type="submit" class="button w-full">Sign Up</button>
      </form>
      <p class="mt-4 text-center">
        Already have an account? 
        <a href="#login" class="text-blue-600 hover:underline">Login</a>
      </p>
    </div>
  `
}

// Header component
function Header() {
  const authLinks = currentUser 
    ? `<button onclick="handleSignOut()" class="hover:text-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-300 rounded">Sign Out</button>`
    : `
      <a href="#login" class="hover:text-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-300 rounded">Login</a>
      <a href="#signup" class="hover:text-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-300 rounded ml-4">Sign Up</a>
    `

  const navLinks = currentUser
    ? `
      <li><a href="#songs" class="hover:text-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-300 rounded">Songs</a></li>
      <li><a href="#add-song" class="hover:text-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-300 rounded">Add Song</a></li>
    `
    : ''

  return `
    <header class="header bg-primary-600 text-white p-4 flex flex-col">
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <img src="/Reverse-Full-logo.png" alt="St Timothy's Church Logo" class="h-12 w-auto mr-4">
          <h1 class="text-2xl font-bold">St Timothy's Church Music</h1>
        </div>
        <div class="flex items-center">
          ${currentUser ? `<span class="mr-4">Welcome, ${currentUser.email}</span>` : ''}
          ${authLinks}
        </div>
      </div>
      <nav class="mt-4">
        <ul class="flex space-x-4">
          ${navLinks}
        </ul>
      </nav>
    </header>
  `
}

// Songs list component
async function SongsList() {
  if (!currentUser) {
    return `
      <div class="text-center p-8">
        <h2 class="text-2xl font-bold mb-4">Please login to view songs</h2>
        <a href="#login" class="button">Login</a>
      </div>
    `
  }

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
            <div class="flex justify-between items-start mb-2">
              <h3 class="text-xl font-semibold">${song.title}</h3>
              <div class="flex space-x-2">
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

// Add song form component
function AddSongForm() {
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

// Auth event handlers
window.handleLogin = async (event) => {
  event.preventDefault()
  const email = document.getElementById('login-email').value
  const password = document.getElementById('login-password').value

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) {
    alert('Error logging in: ' + error.message)
    return
  }

  currentUser = data.user
  window.location.hash = '#songs'
  renderApp()
}

window.handleSignup = async (event) => {
  event.preventDefault()
  const email = document.getElementById('signup-email').value
  const password = document.getElementById('signup-password').value

  const { data, error } = await supabase.auth.signUp({
    email,
    password
  })

  if (error) {
    alert('Error signing up: ' + error.message)
    return
  }

  alert('Please check your email for verification link')
  window.location.hash = '#login'
}

window.handleSignOut = async () => {
  const { error } = await supabase.auth.signOut()
  
  if (error) {
    alert('Error signing out: ' + error.message)
    return
  }

  currentUser = null
  window.location.hash = '#login'
  renderApp()
}

// CRUD event handlers
window.handleCommentSubmit = async (event, songId) => {
  event.preventDefault()
  if (!currentUser) {
    alert('Please login to add comments')
    return
  }

  const textarea = event.target.querySelector('textarea')
  const comment = textarea.value

  const { error } = await supabase
    .from('songs')
    .update({
      comments: comment,
      updated_by: currentUser.id
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
  renderApp()
}

window.handleEditSong = async (songId) => {
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

  renderApp()
}

window.handleDeleteSong = async (songId) => {
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

  renderApp()
}

// Router
function handleRoute() {
  const hash = window.location.hash || '#songs'
  const main = document.querySelector('main')
  
  switch (hash) {
    case '#login':
      main.innerHTML = LoginForm()
      break
    case '#signup':
      main.innerHTML = SignupForm()
      break
    case '#add-song':
      main.innerHTML = AddSongForm()
      break
    default:
      SongsList().then(content => {
        main.innerHTML = content
      })
  }
}

// Check current session
async function checkSession() {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) {
    console.error('Error checking session:', error.message)
    return
  }
  
  if (session) {
    currentUser = session.user
  }
}

// Render app
async function renderApp() {
  await checkSession()
  app.innerHTML = `
    <a href="#main" class="skip-link">Skip to main content</a>
    ${Header()}
    <main id="main" tabindex="-1">
      ${await SongsList()}
    </main>
    <footer class="bg-gray-100 p-4 mt-8">
      <div class="container mx-auto text-center">
        <p>Contact us: <a href="mailto:ChrisRenshaw7@outlook.com" class="text-blue-600 hover:underline">ChrisRenshaw7@outlook.com</a></p>
        <p class="mt-2"> ${new Date().getFullYear()} Chris Renshaw</p>
      </div>
    </footer>
  `
}

// Initialize app
window.addEventListener('hashchange', handleRoute)
checkSession().then(() => renderApp())