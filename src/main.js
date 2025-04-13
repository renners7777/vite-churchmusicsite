import './style.css'
import supabase from './services/supabase.js'
import { Header } from './components/Header.js'
import { LoginForm, SignupForm } from './components/Auth.js'
import { SongsPage } from './components/Songs.js' // Renamed/Refactored component
import { Footer } from './components/Footer.js'
import { AboutPage } from './components/AboutPage.js' // New component needed
import { EventsPage } from './components/EventsPage.js' // New component needed

// Main app component
const app = document.querySelector('#app')

// Global state
window.currentUser = null

// Router
async function handleRoute() {
  const hash = window.location.hash || '#songs' // Default to songs page
  let content = ''

  // Ensure user state is checked before rendering content
  await checkSession(); 

  switch (hash) {
    case '#login':
      content = LoginForm()
      break
    case '#signup':
      content = SignupForm()
      break
    case '#about':
      content = AboutPage() // Render About page
      break
    case '#songs':
      // SongsPage now handles Sunday playlists, all songs, search, and add song form
      content = await SongsPage(window.currentUser) 
      break
    case '#events':
      content = EventsPage() // Render Events/News page
      break
    // Removed #playlists and #add-song cases
    default:
      // Redirect unknown hashes to the songs page
      window.location.hash = '#songs' 
      content = await SongsPage(window.currentUser)
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

  // Re-initialize component-specific handlers if needed after content update
  if (hash === '#songs') {
    // SongsPage component should handle its own initialization internally
    // Example: window.initializeSongsPageHandlers(); 
  }
}

// Check current session
async function checkSession() {
  const { data: { session } } = await supabase.auth.getSession()
  window.currentUser = session?.user ?? null
  // Initial route handling or refresh after session check
  // handleRoute(); // Be careful of infinite loops, handleRoute calls checkSession
}

// Initialize app
async function initializeApp() {
  await checkSession() // Check session first
  handleRoute() // Then handle the initial route

  // Listen for hash changes to navigate
  window.addEventListener('hashchange', handleRoute)
  // Listen for custom event to re-render content (e.g., after login/logout/add song)
  window.addEventListener('content-update', handleRoute) 
}

initializeApp()
