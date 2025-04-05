async function searchEvents() {
    const query = document.getElementById('search-query').value;
    const res = await fetch(`${API_URL}/api/events/search?q=${encodeURIComponent(query)}`);
    const events = await res.json();
    document.getElementById('search-results').innerHTML = events.map(e => `
      <div class="event-card"><h2>${e.title}</h2><a href="/event.html?id=${e.id}">View</a></div>
    `).join('');
  }