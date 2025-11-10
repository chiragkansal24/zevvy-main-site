document.addEventListener('DOMContentLoaded', () => {
	const API_BASE_URL = location.hostname.includes('localhost')
		? 'http://localhost:5000/api'
		: '/api';

	const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1Ijoia2Fuc2FsY2hpcmFnIiwiYSI6ImNtZjN3YzBpYjAxN3Yyb3M3ZHZ4aXVjNXQifQ.qtmurXbcJzINKGAR1J_8XA';

	if (!window.mapboxgl) {
		console.error('Mapbox GL JS failed to load');
		return;
	}

	mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;
	const map = new mapboxgl.Map({
		container: 'map',
		style: 'mapbox://styles/mapbox/streets-v11',
		center: [-122.4194, 37.7749],
		zoom: 10
	});
	map.addControl(new mapboxgl.NavigationControl(), 'top-right');

	// Example call to backend via Netlify proxy
	fetch(`${API_BASE_URL}/health`).then(r => r.json()).then(console.log).catch(console.error);
});
