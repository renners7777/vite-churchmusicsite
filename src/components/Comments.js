import supabase from '../services/supabase.js'

export async function handleCommentSubmit(event, songId, currentUser) {
  event.preventDefault()
  if (!currentUser) {
    alert('Please login to add comments')
    return
  }

  const textarea = event.target.querySelector('textarea')
  const comment = textarea.value

  const { error } = await supabase
    .from('songs')
    .update({
      comments: comment,
      updated_by: currentUser.id
    })
    .eq('id', songId)

  if (error) {
    alert('Error adding comment: ' + error.message)
    return
  }

  textarea.value = ''
  window.dispatchEvent(new Event('content-update'))
}

// Initialize comment handlers
window.handleCommentSubmit = (event, songId) => handleCommentSubmit(event, songId, window.currentUser)
