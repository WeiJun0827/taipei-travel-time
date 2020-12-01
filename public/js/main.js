/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
let map;

function initMap() {
    // Constructor creates a new map - only center and zoom are required.
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 25.045, lng: 121.53 },
        zoom: 13,
        mapTypeControl: false
    });
    const textAutocomplete = new google.maps.places.Autocomplete(
        document.getElementById('search-place'));
    textAutocomplete.bindTo('bounds', map);
}
