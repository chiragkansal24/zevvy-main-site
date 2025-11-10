// script.js
document.addEventListener('DOMContentLoaded', function() {
	// --- CONFIGURATION ---
	const API_BASE_URL = (location.hostname === 'localhost' || location.hostname === '127.0.0.1') ? 'http://localhost:5000' : '/api';
	const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1Ijoia2Fuc2FsY2hpcmFnIiwiYSI6ImNtZjN3YzBpYjAxN3Yyb3M3ZHZ4aXVjNXQifQ.qtmurXbcJzINKGAR1J_8XA';

	// --- STATE ---
	let startCoordinates = null;
	let destCoordinates = null;
	let userCoordinates = null;
	let userLocationMarker = null;
	let locationWatcher = null;
	let routeLayer = null;
	let stopsLayer = null;
	let isNavigating = false;
	let currentStationId = null;

	// --- UI SELECTORS ---
	const mapContainer = document.getElementById('map');
	const loggedOutView = document.getElementById('logged-out-view');
	const loggedInView = document.getElementById('logged-in-view');
	const showLoginBtn = document.getElementById('show-login-btn');
	const loginModal = document.getElementById('login-modal');
	const registerModal = document.getElementById('register-modal');
	const loginForm = document.getElementById('login-form');
	const registerForm = document.getElementById('register-form');
	const showRegisterLink = document.getElementById('show-register-link');
	const showLoginLink = document.getElementById('show-login-link');
	const closeLoginModalBtn = document.getElementById('close-login-modal-btn');
	const closeRegisterModalBtn = document.getElementById('close-register-modal-btn');
	const logoutBtn = document.getElementById('logout-btn');
	const startInput = document.getElementById('start-input');
	const destinationInput = document.getElementById('destination-input');
	const useLocationBtn = document.getElementById('use-location-btn');
	const startSuggestions = document.getElementById('start-suggestions');
	const destinationSuggestions = document.getElementById('destination-suggestions');
	const planTripBtn = document.getElementById('plan-trip-btn');
	const findNearbyBtn = document.getElementById('find-nearby-btn');
	const suggestActivitiesBtn = document.getElementById('suggest-activities-btn');
	const vehicleModal = document.getElementById('vehicle-modal');
	const vehicleProfileBtn = document.getElementById('vehicle-profile-btn');
	const closeModalBtn = document.getElementById('close-modal-btn');
	const saveVehicleBtn = document.getElementById('save-vehicle-btn');
	const carModelInput = document.getElementById('car-model');
	const carRangeInput = document.getElementById('car-range');
	const batteryCapacityInput = document.getElementById('battery-capacity');
	const vehicleInfoP = document.getElementById('vehicle-info');
	const currentChargeSlider = document.getElementById('current-charge');
	const currentChargeLabel = document.getElementById('current-charge-label');
	const resultsPanel = document.getElementById('results-panel');

	// --- NEW UI SELECTORS from first file ---
	const userMenuContainer = document.getElementById('user-menu-container');
	const userMenuBtn = document.getElementById('user-menu-btn');
	const userMenuDropdown = document.getElementById('user-menu-dropdown');
	const routeHistoryBtn = document.getElementById('route-history-btn');
	const chargerHistoryBtn = document.getElementById('charger-history-btn');
	const reviewHistoryBtn = document.getElementById('review-history-btn');
    
	// New Modal Selectors
	const reviewModal = document.getElementById('review-modal');
	const reviewForm = document.getElementById('review-form');
	const closeReviewModalBtn = document.getElementById('close-review-modal-btn');
	const reviewStationName = document.getElementById('review-station-name');
	const reviewStationIdInput = document.getElementById('review-station-id');
	const reviewIdEditInput = document.getElementById('review-id-edit');
	const ratingStarsContainer = document.getElementById('review-rating-stars');
	const ratingInput = document.getElementById('review-rating');

	const historyModal = document.getElementById('history-modal');
	const historyModalTitle = document.getElementById('history-modal-title');
	const historyModalContent = document.getElementById('history-modal-content');
	const closeHistoryModalBtn = document.getElementById('close-history-modal-btn');


	// --- MAP INITIALIZATION ---
	const map = L.map(mapContainer).setView([20.5937, 78.9629], 5);
	L.tileLayer(
	  'https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/{z}/{x}/{y}?access_token={accessToken}',
	  {
		attribution: '© Mapbox © OpenStreetMap',
		maxZoom: 19,
		accessToken: MAPBOX_ACCESS_TOKEN
	  }
	).addTo(map);

	routeLayer = L.layerGroup().addTo(map);
	stopsLayer = L.layerGroup().addTo(map);
	let nearbyStationMarkers = L.layerGroup().addTo(map);

	// --- AUTH HELPERS ---
	function getAuthToken() { return localStorage.getItem('authToken'); }
	function getAuthHeaders() {
		const headers = { 'Content-Type': 'application/json' };
		const token = getAuthToken();
		if (token) headers['Authorization'] = `Bearer ${token}`;
		return headers;
	}

	// MERGED: checkLoginState now handles the user menu visibility
	function checkLoginState() {
		if (getAuthToken()) {
			loggedInView.classList.remove('hidden');
			loggedOutView.classList.add('hidden');
			if (userMenuContainer) userMenuContainer.classList.remove('hidden'); // Show menu
			loadVehicleProfile();
		} else {
			loggedInView.classList.add('hidden');
			loggedOutView.classList.remove('hidden');
			if (userMenuContainer) userMenuContainer.classList.add('hidden'); // Hide menu
		}
		if (window.lucide) lucide.createIcons();
	}

	// --- AUTH / USER ---
	async function loginUser(email, password) {
		try {
			const res = await fetch(`${API_BASE_URL}/users/login`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password })
			});
			const data = await res.json();
			if (data.token) {
				localStorage.setItem('authToken', data.token);
				loginModal.classList.add('hidden');
				checkLoginState();
			} else {
				alert(data.msg || 'Login failed');
			}
		} catch (err) {
			console.error('Login error', err);
			alert('Login error — is the server running?');
		}
	}

	async function registerUser(username, email, password) {
		try {
			const res = await fetch(`${API_BASE_URL}/users/register`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username, email, password })
			});
			if (res.ok) {
				alert('Registered — please log in');
				registerModal.classList.add('hidden');
				loginModal.classList.remove('hidden');
			} else {
				const data = await res.json();
				alert(data.msg || data.error || 'Register failed');
			}
		} catch (err) {
			console.error('Register error', err);
			alert('Registration error');
		}
	}

	function logoutUser() {
		localStorage.removeItem('authToken');
		window.location.reload();
	}

	// --- VEHICLE PROFILE ---
	async function saveVehicleProfile() {
		if (!getAuthToken()) return alert('Please log in to save vehicle profile.');
		const vehicleData = {
			make: "EV Make",
			model: carModelInput.value || "My EV",
			maxRange: parseInt(carRangeInput.value) || 400,
			batteryCapacity_kwh: parseInt(batteryCapacityInput.value) || 65,
			connectorTypes: ["CCS", "CHAdeMO", "Type2"]
		};
		try {
			const res = await fetch(`${API_BASE_URL}/users/vehicle`, {
				method: 'POST',
				headers: getAuthHeaders(),
				body: JSON.stringify(vehicleData)
			});
			const data = await res.json();
			if (res.ok) {
				vehicleInfoP.textContent = `${vehicleData.model} - ${vehicleData.maxRange}km range`;
				vehicleModal.classList.add('hidden');
				alert('Vehicle saved');
			} else {
				alert(data.msg || data.error || 'Failed to save vehicle');
			}
		} catch (err) {
			console.error('Save vehicle error', err);
			alert('Error saving vehicle');
		}
	}

	async function loadVehicleProfile() {
		try {
			const res = await fetch(`${API_BASE_URL}/users/me`, { headers: getAuthHeaders() });
			if (!res.ok) return;
			const user = await res.json();
			const vehicle = user.vehicle;
			if (vehicle && vehicle.model) {
				carModelInput.value = vehicle.model;
				carRangeInput.value = vehicle.maxRange;
				batteryCapacityInput.value = vehicle.batteryCapacity_kwh;
				vehicleInfoP.textContent = `${vehicle.model} - ${vehicle.maxRange}km range`;
			}
		} catch (err) {
			console.error('Load vehicle profile error', err);
		}
	}
    
	// --- UTILITIES ---
	function debounce(func, wait) {
		let t;
		return function(...args) {
			clearTimeout(t);
			t = setTimeout(() => func.apply(this, args), wait);
		};
	}

	// --- GEOLOCATION HELPERS ---
	function getInitialLocation() {
		if (!navigator.geolocation) return;
		navigator.geolocation.getCurrentPosition(pos => {
			userCoordinates = { lat: pos.coords.latitude, lng: pos.coords.longitude };
			map.setView([userCoordinates.lat, userCoordinates.lng], 12);
		}, err => {
			console.log('Could not get initial location', err);
		}, { enableHighAccuracy: true });
	}

	async function geocode(query) {
		try {
			const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_ACCESS_TOKEN}&limit=1` +
						  (userCoordinates ? `&proximity=${userCoordinates.lng},${userCoordinates.lat}` : '');
			const res = await fetch(url);
			const data = await res.json();
			if (data && data.features && data.features.length > 0) {
				const [lng, lat] = data.features[0].center;
				return { lat, lng };
			}
			return null;
		} catch (err) {
			console.error('Geocode error', err);
			return null;
		}
	}
    
	// --- AUTOCOMPLETE ---
	async function handleAutocomplete(e) {
		const input = e.target;
		const query = input.value.trim();
		const suggestionsContainer = input.id === 'start-input' ? startSuggestions : destinationSuggestions;
		if (query.length < 3) {
			suggestionsContainer.innerHTML = '';
			suggestionsContainer.classList.add('hidden');
			return;
		}
		try {
			let url = `${API_BASE_URL}/geocode/autocomplete?q=${encodeURIComponent(query)}`;
			if (userCoordinates) url += `&lat=${userCoordinates.lat}&lng=${userCoordinates.lng}`;
			const res = await fetch(url, { headers: getAuthHeaders() });
			const suggestions = await res.json();
			suggestionsContainer.innerHTML = '';
			if (!Array.isArray(suggestions) || suggestions.length === 0) {
				suggestionsContainer.classList.add('hidden');
				return;
			}
			suggestions.forEach(s => {
				const div = document.createElement('div');
				div.className = 'p-2 cursor-pointer hover:bg-gray-100';
				div.textContent = s.place_name;
				div.onclick = () => {
					input.value = s.place_name;
					const coords = Array.isArray(s.coordinates) ? s.coordinates : s.center;
					if (coords && coords.length >= 2) {
						const point = { lat: coords[1], lng: coords[0] };
						if (input.id === 'start-input') startCoordinates = point;
						else destCoordinates = point;
					}
					suggestionsContainer.innerHTML = '';
					suggestionsContainer.classList.add('hidden');
				};
				suggestionsContainer.appendChild(div);
			});
			suggestionsContainer.classList.remove('hidden');
		} catch (err) {
			console.error('Autocomplete error', err);
		}
	}

	const debouncedAutocompleteStart = debounce(handleAutocomplete, 300);
	const debouncedAutocompleteDest = debounce(handleAutocomplete, 300);

	// --- PLAN TRIP ---
	// MERGED: planTrip now sends text labels for history
	async function planTrip() {
		const startQuery = startInput.value.trim();
		const destQuery = destinationInput.value.trim();
		if (!startQuery || !destQuery) {
			return alert('Please enter both start and destination.');
		}

		resultsPanel.innerHTML = '<p class="text-center p-4">Planning your route...</p>';
		planTripBtn.disabled = true;

		let startCoords = startCoordinates || await geocode(startQuery);
		let destCoords = destCoordinates || await geocode(destQuery);
		if (!startCoords || !destCoords) {
			planTripBtn.disabled = false;
			return resultsPanel.innerHTML = `<p class="text-red-500 p-4 text-center">Could not geocode the start or destination.</p>`;
		}

		const maxRange = parseInt(carRangeInput.value, 10) || 400;
		const batteryCapacity = parseInt(batteryCapacityInput.value, 10) || 65;
		const vehicleModel = carModelInput.value || 'My EV';
		const currentChargeKm = (parseInt(currentChargeSlider.value, 10) / 100) * maxRange;

		const vehicle = {
			make: 'EV',
			model: vehicleModel,
			maxRange,
			batteryCapacity_kwh: batteryCapacity,
			connectorTypes: ['CCS', 'CHAdeMO', 'Type 2']
		};

		try {
			const res = await fetch(`${API_BASE_URL}/chargers/route`, {
				method: 'POST',
				headers: getAuthHeaders(),
				body: JSON.stringify({
					start: startCoords,
					destination: destCoords,
					vehicle,
					currentChargeKm,
					startText: startQuery, // Send text for history
					endText: destQuery    // Send text for history
				})
			});
			const data = await res.json();

			if (!res.ok) {
				const msg = data.error || data.msg || 'Route planning failed';
				return resultsPanel.innerHTML = `<p class="text-red-500 p-4 text-center">Error: ${msg}</p>`;
			}

			if (data.route && data.route.geometry) drawRoute(data.route.geometry, startCoords, destCoords);
			const stops = Array.isArray(data.route?.stops) ? data.route.stops : (Array.isArray(data.chargingStops) ? data.chargingStops : []);
			displayChargingStops(stops, startQuery, destQuery);

			startLiveTracking();
		} catch (err) {
			console.error('Plan trip error', err);
			resultsPanel.innerHTML = `<p class="text-red-500 p-4 text-center">Error: ${err.message || 'Server error'}</p>`;
		} finally {
			planTripBtn.disabled = false;
		}
	}
    
	// --- DRAW HELPERS ---
	function clearRouteAndStops() {
		if (routeLayer) routeLayer.clearLayers();
		if (stopsLayer) stopsLayer.clearLayers();
		if (nearbyStationMarkers) nearbyStationMarkers.clearLayers();
	}

	function drawRoute(routeGeometry, startCoords, destCoords) {
		clearRouteAndStops();
		const geo = L.geoJSON(routeGeometry, { style: { color: '#007D85', weight: 6, opacity: 0.9 } });
		routeLayer.addLayer(geo);

		if (startCoords) {
			L.marker([startCoords.lat, startCoords.lng], {
				icon: L.divIcon({
					html: '<div style="background:#16a34a;width:18px;height:18px;border-radius:50%;border:3px solid white;box-shadow:0 2px 5px rgba(0,0,0,0.5);"></div>',
					className: '', iconSize: [18, 18]
				})
			}).bindPopup('<b>Start</b>').addTo(stopsLayer);
		}

		if (destCoords) {
			L.marker([destCoords.lat, destCoords.lng], {
				icon: L.divIcon({
					html: '<div style="background:#dc2626;width:18px;height:18px;border-radius:50%;border:3px solid white;box-shadow:0 2px 5px rgba(0,0,0,0.5);"></div>',
					className: '', iconSize: [18, 18]
				})
			}).bindPopup('<b>Destination</b>').addTo(stopsLayer);
		}

		try { map.fitBounds(geo.getBounds(), { padding: [50, 50] }); } catch (err) {}
	}
    
	// MERGED: displayChargingStops now includes the "Write Review" button
	function displayChargingStops(stops, startText, endText) {
		if (stopsLayer) {
			stopsLayer.eachLayer(layer => {
				if (layer.getPopup().getContent() !== '<b>Start</b>' && layer.getPopup().getContent() !== '<b>Destination</b>') {
					stopsLayer.removeLayer(layer);
				}
			});
		}
		if (nearbyStationMarkers) nearbyStationMarkers.clearLayers();

		const stopsHtml = (stops && stops.length) ? stops.map((stop, idx) => `
			<div class="p-3 border-l-4 border-[#20C2AD] rounded bg-gray-50 mb-2">
				<p class="font-bold">Stop ${idx + 1}: ${stop.name}</p>
				<p class="text-sm">Charge for ~${stop.chargeTimeMinutes || 30} minutes (${stop.power_kw || '—'} kW)</p>
				<button onclick="openReviewModal('${stop.id}', '${stop.name}')" class="mt-2 text-xs bg-teal-600 text-white px-3 py-1 rounded hover:bg-teal-700">
					⭐ Write Review
				</button>
			</div>`).join('') : '';

		(stops || []).forEach(stop => {
			if (stop.lat && stop.lon) {
				const marker = L.circleMarker([stop.lat, stop.lon], {
					radius: 8,
					fillColor: '#20C2AD',
					color: '#fff',
					weight: 2,
					fillOpacity: 0.8
				}).bindPopup(`<b>${stop.name}</b><br>Charging Stop<br><button onclick="openReviewModal('${stop.id}', '${stop.name}')" class="text-xs bg-teal-600 text-white px-2 py-1 rounded mt-1">⭐ Review</button>`);
				stopsLayer.addLayer(marker);
			}
		});

		const planSummaryEl = document.getElementById('plan-summary');
		if (planSummaryEl) {
			planSummaryEl.innerHTML = `
				<div class="bg-white rounded-lg shadow-lg p-4">
					<h3 class="text-lg font-bold text-teal-700 mb-3">Trip Summary</h3>
					${stopsHtml || '<p class="text-gray-500">No charging stops needed</p>'}
				</div>
			`;
		}
	}

	window.openReviewModal = function(stationId, stationName) {
		currentStationId = stationId;
		document.getElementById('review-station-name').textContent = stationName || 'this station';
		document.getElementById('review-id-edit').value = '';
		document.getElementById('review-text').value = '';
		setStars(5);
		reviewModal.classList.remove('hidden');
	};
    
	// --- LIVE TRACKING & NAVIGATION ---
	function startLiveTracking() {
		if (!navigator.geolocation) return;
		if (locationWatcher) navigator.geolocation.clearWatch(locationWatcher);
		const userIcon = L.divIcon({
			html: '<div style="background-color:#3b82f6;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 0 8px #3b82f6;"></div>',
			className: '', iconSize: [16, 16]
		});
		locationWatcher = navigator.geolocation.watchPosition((pos) => {
			const latLng = [pos.coords.latitude, pos.coords.longitude];
			if (!userLocationMarker) {
				userLocationMarker = L.marker(latLng, { icon: userIcon }).addTo(map);
			} else {
				userLocationMarker.setLatLng(latLng);
			}
			if (isNavigating) {
				map.setView(latLng, 16, { animate: true, pan: { duration: 1 } });
			}
		}, null, { enableHighAccuracy: true });
	}
    
	function toggleNavigation() {
		isNavigating = !isNavigating;
		const navBtn = document.getElementById('navigation-btn');
		if (isNavigating) {
			if (userLocationMarker) {
				map.setView(userLocationMarker.getLatLng(), 16, { animate: true });
			} else {
				alert("Waiting for your location to start navigation...");
			}
			navBtn.innerHTML = '<i data-lucide="navigation-off"></i><span>Stop Navigation</span>';
			navBtn.classList.remove('bg-blue-600', 'hover:bg-blue-700');
			navBtn.classList.add('bg-red-600', 'hover:bg-red-700');
		} else {
			navBtn.innerHTML = '<i data-lucide="navigation"></i><span>Start Navigation</span>';
			navBtn.classList.remove('bg-red-600', 'hover:bg-red-700');
			navBtn.classList.add('bg-blue-600', 'hover:bg-blue-700');
			if (routeLayer.getLayers().length > 0) {
			  map.fitBounds(routeLayer.getBounds(), { padding: [50, 50] });
			}
		}
		if (window.lucide) lucide.createIcons();
	}
    
	// --- NEARBY STATIONS ---
	// MERGED: findNearbyStations now includes the "Write Review" button
	async function findNearbyStations() {
		if (!userCoordinates) {
			alert("Could not get your current location. Please ensure location services are enabled.");
			return;
		}

		try {
			const { lat, lng } = userCoordinates;
			const res = await fetch(`${API_BASE_URL}/chargers/nearby?lat=${lat}&lng=${lng}`);
			if (!res.ok) {
				throw new Error('Failed to fetch nearby stations from the server.');
			}
			const stations = await res.json();
            
			clearRouteAndStops();
			resultsPanel.innerHTML = '<p class="text-gray-500">Showing nearby stations. Plan a new trip to see route details.</p>';

			if (stations.length === 0) {
				alert('No charging stations found within a 25km radius.');
				return;
			}

			map.setView([lat, lng], 13);

			stations.forEach(station => {
				const [stLng, stLat] = station.location.coordinates;
				const popupContent = `
					<b>${station.name}</b><br>
					${station.address}<br>
					<button class="write-review-btn text-sm text-[#007D85] font-bold mt-1" data-station-id="${station._id}" data-station-name="${station.name}">
					  Write a Review
					</button>`;
				L.marker([stLat, stLng]).addTo(nearbyStationMarkers)
					.bindPopup(popupContent);
			});

		} catch (err) {
			console.error("findNearbyStations error:", err);
			alert("An error occurred while finding nearby stations.");
		}
	}

	// --- NEW: HISTORY & REVIEW LOGIC ---
	function openReviewModal(stationId, stationName, reviewToEdit = null) {
		reviewModal.classList.remove('hidden');
		reviewStationName.textContent = stationName;
		reviewStationIdInput.value = stationId;
		reviewForm.reset();
		ratingInput.value = '';
		ratingStarsContainer.querySelectorAll('.star').forEach(s => s.classList.remove('text-yellow-400'));

		if (reviewToEdit) {
			reviewIdEditInput.value = reviewToEdit._id;
			document.getElementById('review-text').value = reviewToEdit.reviewText;
			setStars(reviewToEdit.rating);
		} else {
			reviewIdEditInput.value = '';
		}
	}

	function setStars(rating) {
		ratingInput.value = rating;
		ratingStarsContainer.querySelectorAll('.star').forEach(star => {
			star.classList.toggle('text-yellow-400', star.dataset.value <= rating);
		});
	}

	async function showRouteHistory() {
		historyModalTitle.textContent = 'Route History';
		historyModalContent.innerHTML = '<p>Loading...</p>';
		historyModal.classList.remove('hidden');

		const res = await fetch(`${API_BASE_URL}/users/history/routes`, { headers: getAuthHeaders() });
		const routes = await res.json();

		if (routes.length === 0) {
			historyModalContent.innerHTML = '<p>No routes planned yet.</p>';
			return;
		}

		historyModalContent.innerHTML = routes.map(route => `
			<div class="border-b p-3 hover:bg-gray-50">
				<p><strong>From:</strong> ${route.startLocation}</p>
				<p><strong>To:</strong> ${route.endLocation}</p>
				<p class="text-sm text-gray-500">Stops: ${route.chargingStops.length} · ${new Date(route.createdAt).toLocaleString()}</p>
			</div>
		`).join('');
	}
    
	async function showChargerHistory() {
		historyModalTitle.textContent = 'Recent Chargers';
		historyModalContent.innerHTML = '<p>Loading...</p>';
		historyModal.classList.remove('hidden');

		const res = await fetch(`${API_BASE_URL}/users/history/chargers`, { headers: getAuthHeaders() });
		const history = await res.json();
        
		if (history.length === 0) {
			historyModalContent.innerHTML = '<p>No chargers visited via a planned route yet.</p>';
			return;
		}

		historyModalContent.innerHTML = history.map(item => `
			<div class="border-b p-3 flex justify-between items-center">
				<div>
					<p><strong>${item.station.name}</strong></p>
					<p class="text-sm text-gray-500">${new Date(item.visitedAt).toLocaleDateString()}</p>
				</div>
				<button class="write-review-btn text-sm bg-gray-200 px-3 py-1 rounded-md hover:bg-gray-300" data-station-id="${item.station._id}" data-station-name="${item.station.name}">
					Review
				</button>
			</div>
		`).join('');
	}

	async function showReviewHistory() {
		historyModalTitle.textContent = 'Your Reviews';
		historyModalContent.innerHTML = '<p>Loading...</p>';
		historyModal.classList.remove('hidden');

		const res = await fetch(`${API_BASE_URL}/users/history/reviews`, { headers: getAuthHeaders() });
		const reviews = await res.json();

		if (reviews.length === 0) {
			historyModalContent.innerHTML = '<p>You have not written any reviews yet.</p>';
			return;
		}
        
		historyModalContent.innerHTML = reviews.map(review => `
			<div class="border-b p-3">
				<div class="flex justify-between items-start">
					<div>
						<p><strong>${review.chargingStation.name}</strong></p>
						<p class="flex items-center text-yellow-400">${'★'.repeat(review.rating)}${'☆'.repeat(5-review.rating)}</p>
					</div>
					<button class="edit-review-btn text-sm bg-gray-200 px-3 py-1 rounded-md hover:bg-gray-300" data-review='${JSON.stringify(review)}'>
						Edit
					</button>
				</div>
				<p class="mt-2 text-gray-700">${review.reviewText}</p>
			</div>
		`).join('');
	}

	// --- EVENT LISTENERS ---
	startInput.addEventListener('input', (e) => { startCoordinates = null; debouncedAutocompleteStart(e); });
	destinationInput.addEventListener('input', (e) => { destCoordinates = null; debouncedAutocompleteDest(e); });
    
	// Original listener for closing autocomplete suggestions
	document.addEventListener('click', (e) => {
		if (!e.target.closest('.relative')) {
			startSuggestions.classList.add('hidden');
			destinationSuggestions.classList.add('hidden');
		}
	});

	// Auth Modal Listeners
	if (showLoginBtn) showLoginBtn.addEventListener('click', () => loginModal.classList.remove('hidden'));
	if (closeLoginModalBtn) closeLoginModalBtn.addEventListener('click', () => loginModal.classList.add('hidden'));
	if (showRegisterLink) showRegisterLink.addEventListener('click', () => { loginModal.classList.add('hidden'); registerModal.classList.remove('hidden'); });
	if (showLoginLink) showLoginLink.addEventListener('click', () => { registerModal.classList.add('hidden'); loginModal.classList.remove('hidden'); });
	if (closeRegisterModalBtn) closeRegisterModalBtn.addEventListener('click', () => registerModal.classList.add('hidden'));
	if (loginForm) loginForm.addEventListener('submit', (e) => { e.preventDefault(); loginUser(e.target['login-email'].value, e.target['login-password'].value); });
	if (registerForm) registerForm.addEventListener('submit', (e) => { e.preventDefault(); registerUser(e.target['register-username'].value, e.target['register-email'].value, e.target['register-password'].value); });
    
	// Vehicle Modal Listeners
	if (vehicleProfileBtn) vehicleProfileBtn.addEventListener('click', () => vehicleModal.classList.remove('hidden'));
	if (closeModalBtn) closeModalBtn.addEventListener('click', () => vehicleModal.classList.add('hidden'));
	if (saveVehicleBtn) saveVehicleBtn.addEventListener('click', saveVehicleProfile);
    
	// Main UI Listeners
	if (currentChargeSlider) currentChargeSlider.addEventListener('input', (e) => { currentChargeLabel.textContent = e.target.value; });
	if (useLocationBtn) useLocationBtn.addEventListener('click', async () => {
		if (!navigator.geolocation) return alert('Geolocation not available');
		startInput.value = 'Detecting your location...';
		navigator.geolocation.getCurrentPosition(async (pos) => {
			const lat = pos.coords.latitude, lng = pos.coords.longitude;
			startCoordinates = { lat, lng };
			try {
				const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_ACCESS_TOKEN}&limit=1`;
				const res = await fetch(url);
				const data = await res.json();
				startInput.value = data.features?.[0]?.place_name || 'My Location';
			} catch { startInput.value = 'My Location'; }
		}, () => { startCoordinates = null; startInput.value = ''; });
	});

	if (planTripBtn) planTripBtn.addEventListener('click', planTrip);
	if (findNearbyBtn) findNearbyBtn.addEventListener('click', findNearbyStations);

	// --- NEW EVENT LISTENERS from first file ---
	// User Menu Listeners
	if (userMenuBtn) userMenuBtn.addEventListener('click', () => userMenuDropdown.classList.toggle('hidden'));
	document.addEventListener('click', (e) => {
		if (userMenuContainer && !userMenuContainer.contains(e.target)) {
			if (userMenuDropdown) userMenuDropdown.classList.add('hidden');
		}
	});
	if (logoutBtn) logoutBtn.addEventListener('click', logoutUser);
	if (routeHistoryBtn) routeHistoryBtn.addEventListener('click', (e) => { e.preventDefault(); showRouteHistory(); if (userMenuDropdown) userMenuDropdown.classList.add('hidden'); });
	if (chargerHistoryBtn) chargerHistoryBtn.addEventListener('click', (e) => { e.preventDefault(); showChargerHistory(); if (userMenuDropdown) userMenuDropdown.classList.add('hidden'); });
	if (reviewHistoryBtn) reviewHistoryBtn.addEventListener('click', (e) => { e.preventDefault(); showReviewHistory(); if (userMenuDropdown) userMenuDropdown.classList.add('hidden'); });
    
	// History & Review Modal Listeners
	if (closeHistoryModalBtn) closeHistoryModalBtn.addEventListener('click', () => historyModal.classList.add('hidden'));
	if (closeReviewModalBtn) closeReviewModalBtn.addEventListener('click', () => reviewModal.classList.add('hidden'));

	ratingStarsContainer?.addEventListener('click', (e) => {
		if (e.target.classList.contains('star')) {
			setStars(e.target.dataset.value);
		}
	});

	reviewForm?.addEventListener('submit', async (e) => {
		e.preventDefault();
		const stationId = reviewStationIdInput.value;
		const reviewId = reviewIdEditInput.value;
		const rating = parseInt(ratingInput.value);
		const reviewText = document.getElementById('review-text').value;

		if (!rating) {
			alert('Please select a star rating.');
			return;
		}

		let url = `${API_BASE_URL}/reviews/add`;
		let method = 'POST';

		if (reviewId) { // It's an edit
			url = `${API_BASE_URL}/reviews/${reviewId}`;
			method = 'PUT';
		}

		try {
			const res = await fetch(url, {
				method,
				headers: getAuthHeaders(),
				body: JSON.stringify({ rating, reviewText, chargingStationId: stationId })
			});
			if (res.ok) {
				alert(`Review ${reviewId ? 'updated' : 'submitted'} successfully!`);
				reviewModal.classList.add('hidden');
			} else {
				const data = await res.json();
				alert(`Error: ${data.error || data.msg}`);
			}
		} catch (err) {
			alert('An error occurred.');
		}
	});

	// Event delegation for dynamically created buttons
	document.body.addEventListener('click', (e) => {
		const writeReviewBtn = e.target.closest('.write-review-btn');
		const editReviewBtn = e.target.closest('.edit-review-btn');

		if (writeReviewBtn) {
			const stationId = writeReviewBtn.dataset.stationId || writeReviewBtn.getAttribute('data-station-id');
			const stationName = writeReviewBtn.dataset.stationName || writeReviewBtn.getAttribute('data-station-name');
			openReviewModal(stationId, stationName);
		}
		if (editReviewBtn) {
			const reviewData = JSON.parse(editReviewBtn.dataset.review);
			openReviewModal(reviewData.chargingStation._id, reviewData.chargingStation.name, reviewData);
		}
	});

	// --- INIT ---
	function initializeApp() {
		checkLoginState();
		getInitialLocation();
		if (window.lucide) lucide.createIcons();
	}
	initializeApp();
});
