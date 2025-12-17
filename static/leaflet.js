// Execute after DOM is loaded
document.addEventListener("DOMContentLoaded", () => {

    // Initialize the map
    const map = L.map("map").setView([40.4168, -3.7038], 4.5);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors"
    }).addTo(map);

    // Create a marker cluster group. Display optimizations
    const clusters = L.markerClusterGroup({
        chunkedLoading: true,
        maxClusterRadius: 60,
        spiderfyOnMaxZoom: false
    });

    // Add markers for each station
    const stationIcon = L.icon({
        iconUrl: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="37" viewBox="0 0 32 37">
                <!-- Pin -->
                <path d="M16 0C7.7 0 1 6.7 1 15c0 11.2 15 22 15 22s15-10.8 15-22C31 6.7 24.3 0 16 0z"
                    fill="#1e88e5"/>
                <!-- Fuel pump -->
                <rect x="11" y="9" width="10" height="12" rx="1.5" fill="#ffffff"/>
                <rect x="12.5" y="10.5" width="7" height="4" fill="#1e88e5"/>
                <path d="M21 11.5h2c1 0 2 1 2 2v6c0 1-.8 1.8-1.8 1.8h-.7"
                    stroke="#ffffff" stroke-width="1.5" fill="none"/>
                <circle cx="16" cy="26" r="2" fill="#ffffff"/>
            </svg>
        `),
        iconSize: [32, 37],
        iconAnchor: [16, 37],
        popupAnchor: [0, -30]
    });

    stations.forEach(station => {
        // Skip markers if coords are undefined
        if (station.latitude == null || station.longitude == null)
            return;

        const marker = L.marker([station.latitude, station.longitude], { title: station.name, icon: stationIcon });
        
        marker.bindPopup(`
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
        clusters.addLayer(marker);    
    });
    map.addLayer(clusters);


    // Get coordinates from selected localities
    function getCoords(inputId, datalistId) {
        const input = document.getElementById(inputId);
        const list = document.getElementById(datalistId);
        const value = input.value;
        
        // Find matching options
        const option = Array.from(list.options).find(
            opt => opt.value === value
        );

        if (!option) return null;

        return {
            lat: parseFloat(option.dataset.lat),
            lng: parseFloat(option.dataset.lng),
            name: option.value,
            municipality: option.dataset.municipality
        };
    }

    // Add pin for origin and destination
    let originPin, destPin;

    document.getElementById("origin").addEventListener("change", () => {
        originPin = updatePin("origin", "localities-list", originPin);
    });

    document.getElementById("destination").addEventListener("change", () => {
        destPin = updatePin("destination", "localities-list", destPin);
    });

    // Update pin on map when input changes
    function updatePin(inputId, datalistId, previousMarker) {
        const coords = getCoords(inputId, datalistId);
        if (!coords) return null;

        // Remove previous marker if exists
        if (previousMarker) map.removeLayer(previousMarker);

        const marker = L.marker([coords.lat, coords.lng], { title: coords.name })
            .addTo(map)
            .bindPopup(`<b>${coords.name}</b><br>${coords.municipality}`)
            .openPopup();

        map.setView([coords.lat, coords.lng], 10);

        return marker;
    }

});