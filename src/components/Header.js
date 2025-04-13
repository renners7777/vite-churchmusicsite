import supabase from '../services/supabase.js'; // Import supabase if not already

// Function to handle sign out
async function handleSignOut(buttonElement) {
  // Disable button and show signing out state immediately
  if (buttonElement) {
    buttonElement.disabled = true;
    buttonElement.textContent = 'Signing Out...';
    buttonElement.classList.add('opacity-50', 'cursor-not-allowed');
  }

  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Error signing out:', error);
    // Re-enable button if sign out fails
    if (buttonElement) {
        buttonElement.disabled = false;
        buttonElement.textContent = 'Sign Out';
        buttonElement.classList.remove('opacity-50', 'cursor-not-allowed');
        alert('Sign out failed. Please try again.'); // Optional user feedback
    }
  } else {
    window.currentUser = null;
    window.location.hash = '#login'; // Redirect to login after sign out
    // Dispatch an event to notify other components (like main.js router) to update
    window.dispatchEvent(new CustomEvent('content-update'));
    // No need to re-enable the button here as the component will re-render without it
  }
}

// Make handleSignOut globally accessible if called via onclick attribute
// Pass 'this' from the button element in the onclick handler
window.handleSignOut = handleSignOut;

export function Header(currentUser) {
  // console.log('Current User:', currentUser); // Keep for debugging if needed

  const authLinks = currentUser
    ? `<button
         onclick="handleSignOut(this)" // Pass the button element itself
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
          aria-current="${window.location.hash === '#login' ? 'page' : 'false'}"
        >
          Login
        </a>
        <a
          href="#signup"
          class="button"
          aria-label="Create a new account"
          aria-current="${window.location.hash === '#signup' ? 'page' : 'false'}"
        >
          Sign Up
        </a>
      </div>
    `;

  // Define main navigation links - visible whether logged in or not
  const mainNavLinks = `
    <li>
      <a
        href="#about"
        class="nav-link"
        aria-label="About St Timothy's Music"
        aria-current="${window.location.hash === '#about' ? 'page' : 'false'}"
      >
        About
      </a>
    </li>
    <li>
      <a
        href="#songs"
        class="nav-link"
        aria-label="View songs and Sunday playlists"
        aria-current="${window.location.hash === '#songs' || window.location.hash === '' ? 'page' : 'false'}"
      >
        Songs
      </a>
    </li>
    <li>
      <a
        href="#events"
        class="nav-link"
        aria-label="View events and news"
        aria-current="${window.location.hash === '#events' ? 'page' : 'false'}"
      >
        Events/News
      </a>
    </li>
  `;

  return `
    <header class="header" role="banner">
      <div class="container flex items-center justify-between py-4">
        <a href="#songs" class="flex items-center space-x-4" aria-label="Go to homepage (Songs)">
          <img
            src="/Reverse-Full-logo.png"
            alt="St Timothy's Church Logo"
            class="h-12 w-auto"
            width="48"
            height="48"
          >
          <h1 class="text-2xl font-bold text-white">St Timothy's Church Music</h1>
        </a>
        <div class="flex items-center">
          ${authLinks}
        </div>
      </div>
      <nav class="bg-blue-700" role="navigation" aria-label="Main navigation">
        <div class="container py-2">
          <ul class="flex space-x-6">
            ${mainNavLinks}
          </ul>
        </div>
      </nav>
    </header>
  `;
}
