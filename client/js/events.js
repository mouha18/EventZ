const API_URL = 'https://eventz-backend.onrender.com'; // Replace with your Render URL

async function createEvent(e) {
  e.preventDefault();
  const formData = new FormData();
  formData.append('title', document.getElementById('title').value);
  formData.append('description', document.getElementById('description').value);
  formData.append('date_time', document.getElementById('date-time').value);
  formData.append('location', document.getElementById('location').value);
  formData.append('category', document.getElementById('category').value);
  formData.append('image', document.getElementById('image').files[0]);
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/api/events`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData,
  });
  if (res.ok) window.location.href = '/my-events.html';
  else alert((await res.json()).error);
}

async function loadEventDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get('id');
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/api/events/${eventId}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const event = await res.json();
  document.getElementById('event-title').textContent = event.title;
  document.getElementById('event-image').src = event.image || '/assets/default-event.jpg';
  document.getElementById('event-date-time').textContent = event.date_time;
  document.getElementById('event-location').textContent = event.location;
  document.getElementById('event-category').textContent = event.category;
  document.getElementById('event-description').textContent = event.description || 'No description';
  document.getElementById('rsvp-btn').textContent = event.rsvpd ? 'Un-RSVP' : 'RSVP';
  document.getElementById('bookmark-btn').textContent = event.bookmarked ? 'Unbookmark' : 'Bookmark';
}

async function toggleRSVP() {
  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get('id');
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/api/events/${eventId}/rsvp`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (res.ok) window.location.reload();
}

async function toggleBookmark() {
  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get('id');
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/api/events/${eventId}/bookmark`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (res.ok) window.location.reload();
}

async function postComment(e) {
  e.preventDefault();
  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get('id');
  const content = document.getElementById('comment-content').value;
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/api/events/${eventId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ content }),
  });
  if (res.ok) {
    document.getElementById('comment-content').value = '';
    loadComments();
  }
}

async function loadComments() {
  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get('id');
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/api/events/${eventId}/comments`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const comments = await res.json();
  const commentsDiv = document.getElementById('comments');
  commentsDiv.innerHTML = comments.map(c => `
    <div class="comment">
      <img src="${c.user.profile_pic || '/assets/default-pic.jpg'}" alt="Avatar">
      <p><strong>${c.user.username}</strong> ${c.content}</p>
      <small>${new Date(c.created_at).toLocaleString()}</small>
      ${(c.isCreator || c.isCommenter) ? `<button onclick="deleteComment(${c.id})">Delete</button>` : ''}
    </div>
  `).join('');
}

async function deleteComment(commentId) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/api/events/comments/${commentId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (res.ok) loadComments();
}

async function fetchUserEvents() {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/api/events/my-events`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const events = await res.json();
  document.getElementById('created-events').innerHTML = events.created.map(e => `
    <div class="event-card"><h2>${e.title}</h2><a href="/event.html?id=${e.id}">View</a></div>
  `).join('');
  document.getElementById('rsvpd-events').innerHTML = events.rsvpd.map(e => `
    <div class="event-card"><h2>${e.title}</h2><a href="/event.html?id=${e.id}">View</a></div>
  `).join('');
}

async function fetchBookmarkedEvents() {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/api/events/bookmarks`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const events = await res.json();
  document.getElementById('bookmarked-events').innerHTML = events.map(e => `
    <div class="event-card"><h2>${e.title}</h2><a href="/event.html?id=${e.id}">View</a></div>
  `).join('');
}