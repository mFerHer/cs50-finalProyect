// Execute after DOM is loaded
document.addEventListener("DOMContentLoaded", () => {

    // Initialize the map
    const map = L.map("map").setView([40.4168, -3.7038], 6);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors"
    }).addTo(map);

    // Create a marker cluster group. Display optimizations
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


    // Create a lookup for localities
    const localitiesLookup = {};
    localities.forEach(local => {
        localitiesLookup[local.locality] = {
            lat: local.lat,
            lng: local.lng,
            municipality: local.municipality
        };
    });

    // Create icon-markers for origin and destination
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

    // Get coordinates from selected localities
    function getCoords(inputId) {
        const input = document.getElementById(inputId);
        const value = input.value.trim();
        if (!value || !localitiesLookup[value]) return null;

        const local = localitiesLookup[value];
        return { lat: local.lat, lng: local.lng, name: value, municipality: local.municipality };
    }
    
    // Place marker in map
    function placeMarker(inputId, icon, previousMarker) {
        const coords = getCoords(inputId);
        if (!coords) return previousMarker;

        // Remove previous marker if exists
        if (previousMarker) map.removeLayer(previousMarker);

        const marker = L.marker([coords.lat, coords.lng], { title: coords.name, icon })
            .addTo(map)
            .bindPopup(`<b>${coords.name}</b><br>${coords.municipality}`)
            .openPopup();

        map.setView([coords.lat, coords.lng], 10);

        return marker;
    } 

    // Add event listeners to input fields
    let originMarker, destMarker;

    document.getElementById("origin").addEventListener("change", () => {
        originMarker = placeMarker("origin", originIcon, originMarker);
    });

    document.getElementById("destination").addEventListener("change", () => {
        destMarker = placeMarker("destination", destinationIcon, destMarker);
    });
});