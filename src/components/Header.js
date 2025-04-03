export function Header(currentUser) {
  const authLinks = currentUser 
    ? `<button onclick="handleSignOut()" class="hover:text-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-300 rounded">Sign Out</button>`
    : `
      <a href="#login" class="hover:text-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-300 rounded">Login</a>
      <a href="#signup" class="hover:text-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-300 rounded ml-4">Sign Up</a>
    `

  const navLinks = currentUser
    ? `
      <li><a href="#songs" class="hover:text-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-300 rounded">Songs</a></li>
      <li><a href="#playlists" class="hover:text-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-300 rounded">My Playlists</a></li>
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
