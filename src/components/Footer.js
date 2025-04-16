export function Footer() {
  return `
    <footer class="bg-gray-800 text-white mt-auto">
      <div class="container mx-auto py-8 px-4">
        <div class="grid md:grid-cols-2 gap-8">
          <div>
            <h3 class="text-xl font-semibold mb-4">Contact Us</h3>
            <p class="mb-2">Have questions or suggestions? We'd love to hear from you!</p>
            <a 
              href="mailto:ChrisRenshaw7@outlook.com" 
              class="text-blue-300 hover:text-blue-400 transition-colors flex items-center gap-2 mb-4"
              aria-label="Email us at ChrisRenshaw7@outlook.com"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
              ChrisRenshaw7@outlook.com
            </a>
            <a 
              href="https://www.sttims.org.uk/"
              target="_blank"
              rel="noopener noreferrer"
              class="text-blue-300 hover:text-blue-400 transition-colors inline-flex items-center gap-2"
              aria-label="Visit St Timothy's Church Sheffield website (opens in new tab)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
              </svg>
              Visit St Timothy's Church Website
            </a>
          </div>
          <div>
            <h3 class="text-xl font-semibold mb-4">About</h3>
            <p>This website helps manage and organize church music for St Timothy's Church. It's designed to make song management and playlist creation simple and efficient.</p>
          </div>
        </div>
        <div class="border-t border-gray-700 mt-8 pt-4 text-center text-gray-400">
          <p>&copy; ${new Date().getFullYear()} Chris Renshaw. All rights reserved. Built using Windsurf & Github Copilot</p>
        </div>
      </div>
    </footer>
  `
}
