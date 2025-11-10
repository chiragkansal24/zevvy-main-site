document.addEventListener('DOMContentLoaded', () => {
	console.log('Client loading');
	const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1Ijoia2Fuc2FsY2hpcmFnIiwiYSI6ImNtZjN3YzBpYjAxN3Yyb3M3ZHZ4aXVjNXQifQ.qtmurXbcJzINKGAR1J_8XA';

	if (!window.mapboxgl) { console.error('Mapbox not loaded'); return; }
	mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

	// Center on Chandigarh area like the screenshot
	const map = new mapboxgl.Map({
		container: 'map',
		style: 'mapbox://styles/mapbox/streets-v11',
		center: [76.7794, 30.7333],
		zoom: 12
	});

	// Basic controls
	map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');

	// Login button behaviour (placeholder)
	const loginBtn = document.getElementById('loginBtn');
	if (loginBtn) {
		loginBtn.addEventListener('click', () => {
			// Minimal placeholder action — later can open real modal
			alert('Log In / Register flow — not implemented in this test build.');
		});
	}
});
