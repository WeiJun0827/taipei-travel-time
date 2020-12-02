function initMap() {
    const map = new google.maps.Map(document.getElementById("map"), {
        zoom: 4,
        center: { lat: -24.345, lng: 134.46 },
    });
    const directionsService = new google.maps.DirectionsService();
    displayRoute(
        "Perth, WA",
        "Sydney, NSW",
        directionsService,
        directionsRenderer
    );
}

function displayRoute(origin, destination, service, display) {
    service.route(
        {
            origin: origin,
            destination: destination,
            waypoints: [
                { location: "Adelaide, SA" },
                { location: "Broken Hill, NSW" },
            ],
            travelMode: google.maps.TravelMode.DRIVING,
            avoidTolls: true,
        },
        (result, status) => {
            if (status === "OK") {
                display.setDirections(result);
            } else {
                alert("Could not display directions due to: " + status);
            }
        }
    );
}