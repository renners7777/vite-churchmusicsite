import './style.css'
import supabase from './services/supabase.js'
import { Header } from './components/Header.js'
import { LoginForm, SignupForm } from './components/Auth.js'
import { SongsList } from './components/Songs.js'
import { PlaylistsView } from './components/Playlists.js'
import { AddSongForm } from './components/AddSong.js'
import { Footer } from './components/Footer.js'

// Main app component
const app = document.querySelector('#app')

// Global state
window.currentUser = null
window.searchQuery = ''

// Router
async function handleRoute() {
  const hash = window.location.hash || '#songs'
  let content = ''

  switch (hash) {
    case '#login':
      content = LoginForm()
      break
    case '#signup':
      content = SignupForm()
      break
    case '#songs':
      content = await SongsList(window.currentUser, window.searchQuery)
      break
    case '#playlists':
      content = await PlaylistsView(window.currentUser)
      break
    case '#add-song':
      content = AddSongForm()
      break
    default:
      content = await SongsList(window.currentUser, window.searchQuery)
  }

  app.innerHTML = `
    <div class="min-h-screen flex flex-col">
      ${Header(window.currentUser)}
      <main class="container mx-auto px-4 py-8 flex-grow">
        ${content}
      </main>
      ${Footer()}
    </div>
  `
}

// Check current session
async function checkSession() {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) {
    console.error('Error checking session:', error.message)
    return
  }
  window.currentUser = session?.user || null
}

// Handle search input
window.handleSearchInput = (event) => {
  window.searchQuery = event.target.value
  handleRoute()
}

// Initialize app
window.addEventListener('hashchange', handleRoute)
window.addEventListener('content-update', handleRoute)
checkSession().then(() => handleRoute())

// Export for components
window.supabase = supabase
