async function login(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem('token', data.token);
      window.location.href = '/index.html';
    } else {
      alert(data.error);
    }
  }
  
  async function signup(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const res = await fetch(`${API_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem('token', data.token);
      window.location.href = '/index.html';
    } else {
      alert(data.error);
    }
  }
  
  async function loadProfile() {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/api/auth/profile`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (res.ok) {
      const user = await res.json();
      document.getElementById('username').value = user.username;
      document.getElementById('profile-pic').src = user.profile_pic || '/assets/default-pic.jpg';
    } else {
      window.location.href = '/login.html';
    }
  }
  
  async function updateProfilePic(e) {
    e.preventDefault();
    const file = document.getElementById('profile-pic-upload').files[0];
    const formData = new FormData();
    formData.append('profilePic', file);
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/api/auth/profile`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData,
    });
    if (res.ok) window.location.reload();
  }
  
  function applyTheme() {
    if (localStorage.getItem('theme') === 'dark') {
      document.getElementById('theme').disabled = false;
      document.getElementById('theme-toggle').textContent = 'Light Mode';
    }
  }