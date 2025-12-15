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

    // Add routing
    let routeLine;

    const routeBtn = document.getElementById("route-btn");
    const origin = document.getElementById("origin");
    const dest = document.getElementById("destination");

    console.log("route-btn:", routeBtn);

    // HARD STOP if elements are missing
    if (!routeBtn || !originSelect || !destinationSelect) {
        console.warn("Routing elements not found. Skipping route setup.");
        return;
    }

    routeBtn.addEventListener("click", () => {
        origin.selectedOptions[0];
        dest.selectedOptions[0];

        if (!origin || !dest) return;

        const originLat = parseFloat(origin.dataset.lat);
        const originLng = parseFloat(origin.dataset.lng);
        const destLat = parseFloat(dest.dataset.lat);
        const destLng = parseFloat(dest.dataset.lng);

        if (!originLat || !originLng || !destLat || !destLng) return;

        // Remove existing route if any
        if (routeLine) map.removeLayer(routeLine);

        routeLine = L.polyline([[originLat, originLng], [destLat, destLng]], { color: "red" }).addTo(map);

        const distance = map.distance([originLat, originLng], [destLat, destLng]) / 1000;
        document.getElementById("route-distance").textContent = `Distancia: ${distance.toFixed(2)} km`;
        
        map.fitBounds(routeLine.getBounds());
    });

});