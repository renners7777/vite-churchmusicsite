import { LoginForm, SignupForm } from '../components/Auth.js'
import { SongsList, AddSongForm } from '../components/Songs.js'
import { PlaylistsView } from '../components/Playlists.js'
import { SundayServicesPage, renderSundayPlaylists } from './pages/SundayServicesPage';

async function handleRoute() {
  const hash = window.location.hash || '#home';
  let content = '';

  switch (hash) {
    case '#home':
      content = HomePage();
      break;
    case '#songs':
      content = await SongsList(window.currentUser);
      break;
    case '#playlists':
      content = PlaylistsPage();
      break;
    case '#add-song':
      content = AddSongForm();
      break;
    case '#sunday-services':
      content = SundayServicesPage();
      break;
    default:
      content = HomePage();
  }

  document.getElementById('app').innerHTML = `
    <div class="min-h-screen flex flex-col">
      ${Header(window.currentUser)}
      <main class="container mx-auto px-4 py-8 flex-grow">
        ${content}
      </main>
      ${Footer()}
    </div>
  `;

  // Load additional data for Sunday Services
  if (hash === '#sunday-services') {
    await renderSundayPlaylists();
  }
}

window.addEventListener('hashchange', handleRoute);
window.addEventListener('load', handleRoute);
