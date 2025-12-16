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
    stations.forEach(station => {
        // Skip markers if coords are undefined
        if (station.latitude == null || station.longitude == null)
            return;

        const marker = L.marker([station.latitude, station.longitude], { title: station.name });
        
        marker.bindPopup(`
                <b>${station.name}</b><br>
                ${station.address}<br>
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