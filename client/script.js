// filepath: script.js
document.addEventListener('DOMContentLoaded', () => {
	// --- CONFIGURATION ---
	const API_BASE_URL = location.hostname.includes('localhost')
		? 'http://localhost:5000'
		: 'https://zevvy-main-site.onrender.com';
	const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1Ijoia2Fuc2FsY2hpcmFnIiwiYSI6ImNtZjN3YzBpYjAxN3Yyb3M3ZHZ4aXVjNXQifQ.qtmurXbcJzINKGAR1J_8XA';

	// --- STATE ---
	let map;

	// --- UI SELECTORS ---
	const mapContainer = document.getElementById('map');
	const loggedOutView = document.getElementById('logged-out-view');
	const loggedInView = document.getElementById('logged-in-view');
	const showLoginBtn = document.getElementById('show-login-btn');
	const showLoginBtn2 = document.getElementById('show-login-btn-2');
	const loginModal = document.getElementById('login-modal');
	const registerModal = document.getElementById('register-modal');
	const loginForm = document.getElementById('login-form');
	const registerForm = document.getElementById('register-form');
	const showRegisterLink = document.getElementById('show-register-link');
	const showLoginLink = document.getElementById('show-login-link');
	const closeLoginModalBtn = document.getElementById('close-login-modal-btn');
	const closeRegisterModalBtn = document.getElementById('close-register-modal-btn');
	const logoutBtn = document.getElementById('logout-btn');
	const userMenuContainer = document.getElementById('user-menu-container');
	const userMenuBtn = document.getElementById('user-menu-btn');

	// --- Simple UI toggles ---
	const open = el => el && (el.style.display = 'flex');
	const close = el => el && (el.style.display = 'none');

	[showLoginBtn, showLoginBtn2].forEach(b => b && b.addEventListener('click', () => open(loginModal)));
	closeLoginModalBtn?.addEventListener('click', () => close(loginModal));
	closeRegisterModalBtn?.addEventListener('click', () => close(registerModal));
	showRegisterLink?.addEventListener('click', e => { e.preventDefault(); close(loginModal); open(registerModal); });
	showLoginLink?.addEventListener('click', e => { e.preventDefault(); close(registerModal); open(loginModal); });
	userMenuBtn?.addEventListener('click', () => userMenuContainer.classList.toggle('open'));

	// Fake auth state for now (show logged-in UI after login)
	loginForm?.addEventListener('submit', async (e) => {
		e.preventDefault();
		try {
			const body = Object.fromEntries(new FormData(loginForm).entries());
			const res = await fetch(`${API_BASE_URL}/api/users/login`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			});
			if (!res.ok) throw new Error('Login failed');
			const data = await res.json();
			localStorage.setItem('token', data.token);
			close(loginModal);
			loggedOutView.style.display = 'none';
			loggedInView.style.display = 'block';
		} catch (err) {
			alert(err.message || 'Login failed');
		}
	});

	logoutBtn?.addEventListener('click', () => {
		localStorage.removeItem('token');
		loggedInView.style.display = 'none';
		loggedOutView.style.display = 'block';
	});

	// --- Mapbox ---
	if (mapContainer && window.mapboxgl) {
		mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;
		map = new mapboxgl.Map({
			container: mapContainer,
			style: 'mapbox://styles/mapbox/streets-v11',
			center: [-122.4194, 37.7749],
			zoom: 10
		});
		map.addControl(new mapboxgl.NavigationControl(), 'top-right');
		map.addControl(new mapboxgl.GeolocateControl({ trackUserLocation: true }), 'top-right');
	}

	console.log('Frontend ready. API:', API_BASE_URL);
});
