import { loadSundayPlaylists } from '.src/components/SundayServicesPage.js'; // Corrected path

export function SundayServicesPage() {
  return `
    <div class="container mx-auto py-8">
      <h2 class="text-2xl font-bold mb-4">Sunday Services</h2>
      <p>Welcome to the Sunday Services page. Here you can view and manage the playlists for Sunday morning and evening services.</p>
      <div class="mt-4">
        <h3 class="text-xl font-semibold">Morning Service</h3>
        <ul id="morning-service-playlist" class="list-disc pl-5">
          <!-- Morning service songs will be dynamically loaded here -->
        </ul>
      </div>
      <div class="mt-4">
        <h3 class="text-xl font-semibold">Evening Service</h3>
        <ul id="evening-service-playlist" class="list-disc pl-5">
          <!-- Evening service songs will be dynamically loaded here -->
        </ul>
      </div>
    </div>
  `;
}

export async function renderSundayPlaylists() {
  const { morningSongs, eveningSongs } = await loadSundayPlaylists();

  const morningList = document.getElementById('morning-service-playlist');
  const eveningList = document.getElementById('evening-service-playlist');

  if (morningList) {
    morningList.innerHTML = morningSongs
      .map(song => `<li>${song.songs.title} by ${song.songs.author || 'Unknown'}</li>`)
      .join('');
  }

  if (eveningList) {
    eveningList.innerHTML = eveningSongs
      .map(song => `<li>${song.songs.title} by ${song.songs.author || 'Unknown'}</li>`)
      .join('');
  }
}