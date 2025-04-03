import { LoginForm, SignupForm } from '../components/Auth.js'
import { SongsList, AddSongForm } from '../components/Songs.js'
import { PlaylistsView } from '../components/Playlists.js'

export async function handleRoute(currentUser) {
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
      main.innerHTML = AddSongForm(currentUser)
      break
    case '#playlists':
      main.innerHTML = await PlaylistsView(currentUser)
      break
    default:
      main.innerHTML = await SongsList(currentUser, window.searchQuery || '')
  }
}
