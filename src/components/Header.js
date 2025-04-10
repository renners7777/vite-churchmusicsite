export function Header(currentUser) {
  const authLinks = currentUser 
    ? `<button 
         onclick="handleSignOut()" 
         class="button"
         aria-label="Sign out of your account"
       >
         Sign Out
       </button>`
    : `
      <div class="space-x-4">
        <a 
          href="#login" 
          class="button"
          aria-label="Log in to your account"
        >
          Login
        </a>
        <a 
          href="#signup" 
          class="button"
          aria-label="Create a new account"
        >
          Sign Up
        </a>
      </div>
    `

  const navLinks = currentUser
    ? `
      <li>
        <a 
          href="#songs" 
          class="nav-link"
          aria-label="View all songs"
          aria-current="${window.location.hash === '#songs' ? 'page' : 'false'}"
        >
          Songs
        </a>
      </li>
      <li>
        <a 
          href="#playlists" 
          class="nav-link"
          aria-label="View your playlists"
          aria-current="${window.location.hash === '#playlists' ? 'page' : 'false'}"
        >
          My Playlists
        </a>
      </li>
      <li>
        <a 
          href="#add-song" 
          class="nav-link"
          aria-label="Add a new song"
          aria-current="${window.location.hash === '#add-song' ? 'page' : 'false'}"
        >
          Add Song
        </a>
      </li>
      <li>
        <a 
          href="#sunday-services" 
          class="nav-link"
          aria-label="View Sunday Services playlists"
          aria-current="${window.location.hash === '#sunday-services' ? 'page' : 'false'}"
        >
          Sunday Services
        </a>
      </li>
    `
    : ''

  return `
    <header class="header" role="banner">
      <div class="container flex items-center justify-between py-4">
        <div class="flex items-center space-x-4">
          <img 
            src="/Reverse-Full-logo.png" 
            alt="St Timothy's Church Logo" 
            class="h-12 w-auto"
            width="48"
            height="48"
          >
          <h1 class="text-2xl font-bold text-white">St Timothy's Church Music</h1>
        </div>
        <div class="flex items-center">
          ${authLinks}
        </div>
      </div>
      ${currentUser ? `
        <nav class="bg-blue-700" role="navigation" aria-label="Main navigation">
          <div class="container py-2">
            <ul class="flex space-x-6">
              ${navLinks}
            </ul>
          </div>
        </nav>
      ` : ''}
    </header>
  `
}
