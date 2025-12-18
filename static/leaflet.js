// Execute after DOM is loaded
document.addEventListener("DOMContentLoaded", () => {

    //Step 0: Initialize the map
    const map = L.map("map").setView([40.4168, -3.7038], 6);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors"
    }).addTo(map);

    // Step 1: Station markers
    // Create a marker cluster group
    const clusters = L.markerClusterGroup({
        chunkedLoading: true,
        maxClusterRadius: 60,
        spiderfyOnMaxZoom: false
    });

    // Add custom icon-markers for each station
    const stationIcon = L.divIcon({
        html: '⛽',
        className: 'station-icon',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
        popupAnchor: [0, -10]
    });

    stations.forEach(station => {
        // Skip markers if coords are undefined
        if (station.latitude == null || station.longitude == null)
            return;

        const stationMarker = L.marker([station.latitude, station.longitude], { title: station.name, icon: stationIcon });
        
        stationMarker.bindPopup(`
                <b>${station.name}</b><br>
                ${station.address}<br>
                ${station.locality}, ${station.municipality}<br>
                ${station.timetable || 'N/A'}<br>
                Gasolina 95: ${station.gasoline95 ?? 'N/A'}<br>
                Gasolina 98: ${station.gasoline98 ?? 'N/A'}<br>
                Diesel: ${station.diesel ?? 'N/A'}<br>
                Diesel Premium: ${station.diesel_premium ?? 'N/A'}<br>
                Diesel B: ${station.dieselB ?? 'N/A'}
            `)
        clusters.addLayer(stationMarker);    
    });
    map.addLayer(clusters);

    // Step 2: Locations (origin & destination)
    let originMarker = null;
    let destMarker = null;

    // Create a lookup for localities
    const localitiesLookup = {};
    localities.forEach(local => {
        localitiesLookup[local.locality] = {
            lat: local.lat,
            lng: local.lng,
            municipality: local.municipality
        };
    });

    // Create icon-markers
    const originIcon = L.divIcon({
        html: '🟢',
        className: 'location-icon',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
        popupAnchor: [0, -10]
    });

    const destinationIcon = L.divIcon({
        html: '🔴',
        className: 'location-icon',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
        popupAnchor: [0, -10]
    });

    // Get coordinates from selected locations
    function getCoords(inputId) {
        const input = document.getElementById(inputId);
        const value = input.value.trim();
        if (!value || !localitiesLookup[value]) return null;

        const local = localitiesLookup[value];
        return { lat: local.lat, lng: local.lng, name: value, municipality: local.municipality };
    }
    
    // Place markers in the map
    function placeMarker(inputId, icon, previousMarker) {
        const coords = getCoords(inputId);
        if (!coords) return previousMarker;

        // Remove previous marker if exists
        if (previousMarker) map.removeLayer(previousMarker);

        const locationMarker = L.marker([coords.lat, coords.lng], { title: coords.name, icon })
            .addTo(map)
            .bindPopup(`<b>${coords.name}</b><br>${coords.municipality}`)
            .openPopup();

        map.setView([coords.lat, coords.lng], 10);
        return locationMarker;
    }

    // Step 3: Add routing
    // (Store lastRoute globally for later use in step 5)
    let lastRoute = null;
    let routingControl = null;

    function drawRoute() {
        if (!originMarker || !destMarker) {
            alert("Por favor, selecciona un lugar de origen y destino.");
            return null;
        }

        // Get waypoints
        const originLatLng = originMarker.getLatLng();
        const destLatLng = destMarker.getLatLng();

        // Remove previous route if exists
        if (routingControl) {
            map.removeControl(routingControl);
        }

        routingControl = L.Routing.control({
            waypoints: [
                L.latLng(originLatLng.lat, originLatLng.lng),
                L.latLng(destLatLng.lat, destLatLng.lng)
            ],
            // Open Source Routing Machine (OSRM)
            router: L.Routing.osrmv1({
                serviceUrl: "https://router.project-osrm.org/route/v1"
            }),
            lineOptions: {
                styles: [{ weight: 5 }]
            },
            addWaypoints: false,
            draggableWaypoints: false,
            fitSelectedRoutes: true,
            show: false,
            createMarker: () => null
        });
        
        routingControl.on('routesfound', function (e) {
            // Display first route (fastest)
            const route = e.routes[0];
            const km = (route.summary.totalDistance / 1000).toFixed(1);
            const min = Math.round(route.summary.totalTime / 60);
            document.getElementById("route-distance").textContent =
                `Distance: ${km} km · Time: ${min} min`;

            // (Store lastRoute for later use in step 5)
            lastRoute = route.coordinates;
        });
        routingControl.addTo(map);
    }

    // Step 4: Cheapest petrol station regarding fuel type
    // Icon for cheapest station
    let cheapestMarker = null;

    function emphasizeStation(station) {
        if (!station) return;

        // Remove previous highlight
        if (cheapestMarker) map.removeLayer(cheapestMarker);

        // Create icon-marker
        const highlightIcon = L.divIcon({
            html: '⭐',
            className: 'highlight-icon',
            iconSize: [25, 25],
            iconAnchor: [12, 12]
        });

        cheapestMarker = L.marker([station.latitude, station.longitude], { icon: highlightIcon })
            .addTo(map)
            .bindPopup(`<b>${station.name}</b><br>${station.municipality}<br>Precio: ${station[selectedFuel]}`)
            .openPopup();

        // Center map on the cheapest station
        map.setView([station.latitude, station.longitude], 10);
    }

    // Find cheapest station
    let selectedFuel = null;

    document.getElementById("fuel-type").addEventListener("change", (e) => {
        selectedFuel = e.target.value;
    });

    // if route selected
    function stationNearRoute(station, routeCoords, thresholdKm) {
        const stationLatLng = L.latLng(station.latitude, station.longitude);
        return routeCoords.some(point => {
            const distanceKm = stationLatLng.distanceTo(L.latLng(point.lat, point.lng)) / 1000;
            return distanceKm <= thresholdKm;
        });
    }

    function findCheapestStation(selectedFuel, options = {}) {
        const { routeCoords = null, maxDistanceKm = 0.5 } = options;
        
        if (!selectedFuel) {
            alert("Por favor, selecciona un tipo de combustible.");
            return null;
        }

        let cheapestStation = null;
        let cheapestPrice = Infinity;

        stations.forEach(station => {
            const price = parseFloat(station[selectedFuel]);
            if (isNaN(price)) return;

            // if route selected
            if (routeCoords) {
                if (!stationNearRoute(station, routeCoords, maxDistanceKm)) return;
            }

            // Update cheapest price & station
            if (price < cheapestPrice) {
                cheapestPrice = price;
                cheapestStation = station;
            }
        });
        return cheapestStation;
    }

    // Step 5: LAST: Event listeners of input fields
    document.getElementById("origin").addEventListener("change", () => {
        originMarker = placeMarker("origin", originIcon, originMarker);
    });

    document.getElementById("destination").addEventListener("change", () => {
        destMarker = placeMarker("destination", destinationIcon, destMarker);
    });

    document.getElementById("route-btn").addEventListener("click", () => {
        drawRoute();
    });

    document.getElementById("price-btn").addEventListener("click", () => {
        let station;
        if (lastRoute) {
            station = findCheapestStation(selectedFuel, {
                routeCoords: lastRoute
            });
        } else {
            station = findCheapestStation(selectedFuel);
        }

        if (!station) {
            alert("No se encontraron gasolineras cercanas a la ruta.");
            return;
        }
        emphasizeStation(station);
    });
});
