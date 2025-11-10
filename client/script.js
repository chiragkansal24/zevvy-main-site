document.addEventListener('DOMContentLoaded', () => {
	console.log('Client loading');
	const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1Ijoia2Fuc2FsY2hpcmFnIiwiYSI6ImNtZjN3YzBpYjAxN3Yyb3M3ZHZ4aXVjNXQifQ.qtmurXbcJzINKGAR1J_8XA';
	if (!window.mapboxgl) { console.error('Mapbox not loaded'); return; }
	mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;
	new mapboxgl.Map({ container: 'map', style: 'mapbox://styles/mapbox/streets-v11', center: [0,0], zoom: 2 });
});
