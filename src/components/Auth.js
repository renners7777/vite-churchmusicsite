import supabase from '../services/supabase.js'

export function LoginForm() {
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

export function SignupForm() {
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

export async function handleLogin(event) {
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

  window.currentUser = data.user
  window.location.hash = '#songs'
  window.dispatchEvent(new Event('content-update'))
}

export async function handleSignup(event) {
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

export async function handleSignOut() {
  const { error } = await supabase.auth.signOut()
  
  if (error) {
    alert('Error signing out: ' + error.message)
    return
  }

  window.currentUser = null
  window.location.hash = '#login'
  window.dispatchEvent(new Event('content-update'))
}

// Initialize auth handlers
window.handleLogin = handleLogin
window.handleSignup = handleSignup
window.handleSignOut = handleSignOut
