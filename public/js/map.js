/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
let map;
let mainMarker;
let polygon;
let placeMarkers = [];
let placeInfoWindow;
let directionsRenderer;
const token = window.localStorage.getItem('access_token');

document.getElementById('my-position-btn').addEventListener('click', goToUsersLocation);
document.getElementById('search-btn').addEventListener('click', textSearchPlaces);
document.getElementById('travel-time').addEventListener('change', drawTransitArea);
document.getElementById('departure-time').addEventListener('change', drawTransitArea);
document.getElementById('take-metro').addEventListener('change', drawTransitArea);
document.getElementById('take-bus').addEventListener('change', drawTransitArea);
document.getElementById('apply-max-walk-dist').addEventListener('change', drawTransitArea);
document.getElementById('max-walk-dist').addEventListener('change', () => {
    if (document.getElementById('apply-max-walk-dist').checked)
        drawTransitArea();
});
document.getElementById('apply-max-transfer-times').addEventListener('change', drawTransitArea);
document.getElementById('max-transfer-times').addEventListener('change', () => {
    if (document.getElementById('apply-max-transfer-times').checked)
        drawTransitArea();
});
$(document).ready(function () {
    $('#departure-time').val(new Date().toDateInputValue());
});

function initMap() {
    const styles = [
        {
            featureType: 'road.highway',
            elementType: 'geometry.stroke',
            stylers: [
                { lightness: +60 }
            ]
        }, {
            featureType: 'road.highway',
            elementType: 'geometry.fill',
            stylers: [
                { lightness: +75 }
            ]
        }, {
            featureType: 'road.highway',
            elementType: 'labels.icon',
            stylers: [
                { visibility: 'off' }
            ]
        }
    ];

    const mapOptions = {
        center: new google.maps.LatLng(25.0478072, 121.5170185),
        zoom: 13,
        styles: styles,
        mapTypeControl: false
    };
    map = new google.maps.Map(document.getElementById('map'), mapOptions);
    initMarker(mapOptions.center);
    initPolygon();
    initSearchBox();
    initDirectionsRenderer();
    initInfoWindow();
    getLabels();
    drawTransitArea();
}

function initMarker(position) {
    const icon = {
        path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
        scale: 7,
        strokeColor: '#B3672B',
        strokeWeight: 5,
    };
    mainMarker = new google.maps.Marker({
        map: map,
        position: position,
        title: 'Starter',
        draggable: true,
        animation: google.maps.Animation.DROP
    });
    google.maps.event.addListener(mainMarker, 'dragend', function () {
        drawTransitArea();
    });
}

function initPolygon() {
    // https://coolors.co/c4e5cd-9cc0f9-f1f3f4-fde293-ff8785
    polygon = new google.maps.Polygon({
        map: map,
        strokeWeight: 0,
        fillColor: '#FAA916',
        // fillColor: '#FFAAA0', // 草莓蘇打
        fillOpacity: 0.35
    });
}

function initSearchBox() {
    const searchBox = new google.maps.places.SearchBox(
        document.getElementById('search-place'));
    searchBox.setBounds(map.getBounds());
    searchBox.addListener('places_changed', function () {
        searchBoxPlaces(this);
    });
}

function initDirectionsRenderer() {
    directionsRenderer = new google.maps.DirectionsRenderer({
        map: map,
        panel: document.getElementById('directions-panel')
    });
}

function initInfoWindow() {
    placeInfoWindow = new google.maps.InfoWindow({ maxWidth: 220 });
    placeInfoWindow.addListener('domready', function () {
        if (placeInfoWindow.marker.isMyPlace)
            labeledMode();
        else
            defaultMode();
        $('.set-as-marker').click(moveMarkerForPlace);
        $('.display-directions').click(displayDirections);
        $('.create-label').click(() => {
            if (!token) window.location.href = './member.html';
            editingMode();
        });
        $('.hide-editor').click(() => {
            if (placeInfoWindow.marker.isMyPlace)
                labeledMode();
            else
                defaultMode();
        });
        $('.submit-place').click(() => {
            if (placeInfoWindow.marker.isMyPlace)
                updateLabel();
            else
                createLabel();
        });
        $('.edit-label').click(editingMode);
        $('.delete-label').click(() => {
            deleteLabel();
        });
    });
    placeInfoWindow.addListener('closeclick', function () {
        console.log('call close');
    });
}

function latLonSearchPlaces() {
    const bounds = map.getBounds();
    const placesService = new google.maps.places.PlacesService(map);
    placesService.textSearch({
        query: document.getElementById('search-place').value,
        bounds: bounds
    }, function (results, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            resetMarkers(placeMarkers);
            createMarkersForPlaces(results, true);
        }
    });
}

function searchBoxPlaces(searchBox) {
    const places = searchBox.getPlaces();
    if (places.length == 0) {
        window.alert('沒有符合的搜尋結果');
    } else {
        textSearchPlaces();
    }
}

function moveMarkerForPlace() {
    mainMarker.setPosition(placeInfoWindow.marker.position);
    drawTransitArea();
}

function textSearchPlaces() {
    const bounds = map.getBounds();
    const placesService = new google.maps.places.PlacesService(map);
    placesService.textSearch({
        query: document.getElementById('search-place').value,
        bounds: bounds
    }, function (results, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            resetMarkers(placeMarkers);
            createMarkersForPlaces(results, false);
            addPlaceInList(results);
        }
    });
}

function resetMarkers(markers) {
    markers.forEach(m => m.setMap(null));
    markers = [];
}

function createMarkersForPlaces(places, withIconUrl) {
    const bounds = new google.maps.LatLngBounds();
    let count = 0;
    for (const place of places) {
        count++;
        const marker = createMarker(place.place_id, place.geometry.location, place.name, { label: count.toString(), icon: place.icon });
        placeMarkers.push(marker);
        if (place.geometry.viewport) {
            bounds.union(place.geometry.viewport);
        } else {
            bounds.extend(place.geometry.location);
        }
    }
    map.fitBounds(bounds);
}


function createMarker(placeId, position, title, markerOptions) {
    // const icon = {
    //     url: iconUrl,
    //     size: new google.maps.Size(35, 35),
    //     origin: new google.maps.Point(0, 0),
    //     anchor: new google.maps.Point(15, 34),
    //     scaledSize: new google.maps.Size(25, 25)
    // };
    const { icon, label } = markerOptions;
    let marker;
    if (label)
        marker = new google.maps.Marker({
            map: map,
            label: label,
            iconUrl: icon,
            title: title,
            position: position,
            placeId: placeId
        });
    else
        marker = new google.maps.Marker({
            map: map,
            icon: icon,
            title: title,
            position: position,
            placeId: placeId
        });
    marker.addListener('click', function () {
        if (placeInfoWindow.marker != this) {
            getPlacesDetails(this, placeInfoWindow);
        }
    });
    return marker;
}

function getPlacesDetails(marker, placeInfoWindow) {
    const service = new google.maps.places.PlacesService(map);
    service.getDetails({
        placeId: marker.placeId
    }, function (place, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            placeInfoWindow.marker = marker;
            const infoDiv = $('<div></div>');
            if (place.name) {
                infoDiv.append(
                    $('<div></div>').attr('class', 'place-name').append(
                        $('<strong></strong>').text(place.name)));
            }
            if (place.formatted_address) {
                infoDiv.append(
                    $('<div></div>').attr('class', 'place-address').text(place.formatted_address));
            }
            if (place.formatted_phone_number) {
                infoDiv.append(
                    $('<div></div>').attr('class', 'place-phone').text(place.formatted_phone_number));
            }
            if (place.website) {
                infoDiv.append(
                    $('<div></div>').attr('class', 'place-website').append(
                        $('<a></a>').text(decodeURI(place.website)).attr('href', place.website)));
            }
            if (place.photos) {
                infoDiv.append(
                    $('<div><br></div>').attr('class', 'place-image').append(
                        $('<img>').attr('src', `${place.photos[0].getUrl({ maxHeight: 100, maxWidth: 200 })}`)));
            }
            initMyPlaceUi(infoDiv);
            placeInfoWindow.setContent(infoDiv.html());
            placeInfoWindow.open(map, marker);
        }
    });
}

function initMyPlaceUi(container) {
    const title = placeInfoWindow.marker.title || '';
    const description = placeInfoWindow.marker.description || '';
    const form = $('<form><br></form>').attr({ class: 'my-place-form' }).css('display', 'none');
    form.append($('<strong></strong>').text('My Place'));
    form.append($('<input>').attr({
        type: 'text',
        class: 'place-title-input',
        placeholder: '標題',
        style: 'width: 175px;',
        required: true,
        value: title,
    }).css({ width: '175px' }));
    form.append($('<textarea></textarea>').attr({
        class: 'place-description-input',
        rows: 4,
    }).css({ width: '176px', resize: 'none' }).text(description));
    form.append(
        $('<input>').attr({ type: 'button', class: 'submit-place', value: 'Submit' }));
    form.append(
        $('<input>').attr({ type: 'button', class: 'hide-editor', value: 'Cancel' }));
    container.append(form);

    const label = $('<div><br></div>').attr({ class: 'my-place-label' }).css('display', 'none');
    label.append($('<strong></strong>').attr({ class: 'place-title-label' }).text(title));
    label.append($('<div></div>').attr({ class: 'place-description-label' }).text(description));
    label.append($('<br>'));
    container.append(label);

    const optionsMenu = $('<div></div>').attr('class', 'options-menu');
    optionsMenu.append(
        $('<input>').attr({ type: 'button', class: 'set-as-marker', value: 'Here' }));
    optionsMenu.append(
        $('<input>').attr({ type: 'button', class: 'display-directions', value: 'Navi.' }));
    optionsMenu.append(
        $('<input>').attr({ type: 'button', class: 'create-label', value: 'Label' }));
    optionsMenu.append(
        $('<input>').attr({ type: 'button', class: 'edit-label', value: 'Edit' }));
    optionsMenu.append(
        $('<input>').attr({ type: 'button', class: 'delete-label', value: 'Delete' }));
    container.append(optionsMenu);
}

function addPlaceInList(places) {

    $('search-places-panel').append(
        $('<div></div>').attr('class', 'search-place-info').text(places.name));

}

function getLabels() {
    if (!token) return;

    const settings = {
        'url': '/api/1.0/user/places',
        'method': 'GET',
        'headers': {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        }
    };

    $.ajax(settings).done(function (response) {
        const { places } = response;
        for (const place of places) {
            const position = new google.maps.LatLng(place.lat, place.lon);
            const icon = {
                url: place.icon,
                size: new google.maps.Size(35, 35),
                origin: new google.maps.Point(0, 0),
                anchor: new google.maps.Point(15, 34),
                scaledSize: new google.maps.Size(25, 25)
            };
            const marker = createMarker(place.googleMapsId, position, place.title, { icon });
            marker.isMyPlace = true;
            marker.id = place.id;
            marker.description = place.description;
        }
    });
}

function createLabel() {
    const position = placeInfoWindow.marker.getPosition();
    const iconUrl = placeInfoWindow.marker.iconUrl;
    const title = $('.place-title-input').val();
    const description = $('.place-description-input').val();
    const settings = {
        'url': '/api/1.0/user/places',
        'method': 'POST',
        'headers': {
            'Authorization': 'Bearer ' + window.localStorage.getItem('access_token'),
            'Content-Type': 'application/json'
        },
        'data': JSON.stringify({
            lat: position.lat(),
            lon: position.lng(),
            icon: iconUrl,
            googleMapsId: placeInfoWindow.marker.placeId,
            title: title,
            description: description
        })
    };

    $.ajax(settings).done(function (response) {
        const { placeId } = response;
        placeInfoWindow.marker.setMap(null);
        getLabels();
        labeledMode();
    });
}

function updateLabel() {
    const settings = {
        'url': '/api/1.0/user/places/' + placeInfoWindow.marker.id,
        'method': 'PATCH',
        'headers': {
            'Authorization': 'Bearer ' + window.localStorage.getItem('access_token'),
            'Content-Type': 'application/json'
        },
        'data': JSON.stringify({
            title: $('.place-title-input').val(),
            description: $('.place-description-input').val()
        })
    };

    $.ajax(settings).done(function (response) {
        placeInfoWindow.marker.isMyPlace = true;
        placeInfoWindow.marker.title = $('.place-title-input').val();
        placeInfoWindow.marker.description = $('.place-description-input').val();
        $('.place-title-label').text($('.place-title-input').val());
        $('.place-description-label').text($('.place-description-input').val());
        labeledMode();
    });
}

function deleteLabel() {
    const settings = {
        'url': '/api/1.0/user/places/' + placeInfoWindow.marker.id,
        'method': 'DELETE',
        'headers': {
            'Authorization': 'Bearer ' + window.localStorage.getItem('access_token'),
            'Content-Type': 'application/json'
        }
    };

    $.ajax(settings).done(function (response) {
        delete placeInfoWindow.marker.isMyPlace;
        delete placeInfoWindow.marker.title;
        delete placeInfoWindow.marker.description;
        placeInfoWindow.marker.setMap(null);
        defaultMode();
    });
}


function labeledMode() {
    $('.my-place-form').css('display', 'none');
    $('.my-place-label').css('display', 'inherit');
    $('.options-menu').css('display', 'inherit');
    $('.create-label').css('display', 'none');
    $('.edit-label').css('display', 'inline-block');
    $('.delete-label').css('display', 'inline-block');
}

function editingMode() {
    $('.my-place-form').css('display', 'inherit');
    $('.my-place-label').css('display', 'none');
    $('.options-menu').css('display', 'none');
}

function defaultMode() {
    $('.my-place-form').css('display', 'none');
    $('.my-place-label').css('display', 'none');
    $('.options-menu').css('display', 'inherit');
    $('.create-label').css('display', 'inline-block');
    $('.edit-label').css('display', 'none');
    $('.delete-label').css('display', 'none');
}

function displayDirections() {
    console.log('call display directions');
    resetMarkers(placeMarkers);
    const modes = [];
    if (document.getElementById('take-metro').checked) modes.push('SUBWAY');
    if (document.getElementById('take-bus').checked) modes.push('BUS');
    const directionsService = new google.maps.DirectionsService;
    const origin = new google.maps.LatLng(mainMarker.getPosition().lat(), mainMarker.getPosition().lng());
    const destination = new google.maps.LatLng(placeInfoWindow.marker.getPosition().lat(), placeInfoWindow.marker.getPosition().lng());
    const departureTime = new Date(document.getElementById('departure-time').value);
    directionsService.route({
        origin: origin,
        destination: destination,
        travelMode: google.maps.TravelMode.TRANSIT,
        transitOptions: {
            departureTime: departureTime,
            modes: modes,
            // routingPreference: 'FEWER_TRANSFERS'
        },
    }, function (response, status) {
        if (status === google.maps.DirectionsStatus.OK) {
            directionsRenderer.setDirections(response);
            $('#directions-panel').css('display', 'block');
        } else {
            window.alert('Directions request failed due to ' + status);
        }
    });
}

function closeDirections() {
    directionsRenderer.setMap(null);
    initDirectionsRenderer();
    $('#directions-panel').css('display', 'none');
}

function closeSearchPlaces() {
    resetMarkers(placeMarkers);
    $('#search-places-panel').css('display', 'none');
}

function goToUsersLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            const currentPosition = new google.maps.LatLng(
                position.coords.latitude,
                position.coords.longitude);
            mainMarker.setPosition(currentPosition);
            map.setCenter(currentPosition);
            drawTransitArea();
        });
    }
}

function drawTransitArea() {
    const maxWalkDist = document.getElementById('apply-max-walk-dist').checked ? document.getElementById('max-walk-dist').value : Infinity;
    const maxTransferTimes = document.getElementById('apply-max-transfer-times').checked ? document.getElementById('max-transfer-times').value : Infinity;
    const params = new URLSearchParams({
        starterId: Math.random().toString(36).substr(2, 3) + Date.now().toString(36).substr(4, 3),
        lat: mainMarker.getPosition().lat(),
        lon: mainMarker.getPosition().lng(),
        maxTravelTime: document.getElementById('travel-time').value,
        departureTime: document.getElementById('departure-time').value,
        takeMetro: document.getElementById('take-metro').checked,
        takeBus: document.getElementById('take-bus').checked,
        maxWalkDist: maxWalkDist,
        maxTransferTimes: maxTransferTimes
    });
    fetch('/api/1.0/tavelTime/transit?' + params).then(response => {
        if (!response.ok) throw new Error(response.statusText);
        return response.json();
    }).then(json => {
        const paths = [];
        for (const station of json.data) {
            const circle = drawCircle(station.lat, station.lon, station.radius, 1);
            paths.push(circle);
        }
        polygon.setPaths(paths);
    }).catch(error => {
        console.log('Fetch Error: ', error);
    });
}

function drawCircle(lat, lon, radius, dir) {
    const d2r = Math.PI / 180; // degrees to radians
    const r2d = 180 / Math.PI; // radians to degrees
    const earthsradius = 6371e3; // the radius of the earth in metre
    const points = 32;

    // find the raidus in lat/lon
    const rlat = (radius / earthsradius) * r2d;
    const rlng = rlat / Math.cos(lat * d2r);

    const extp = [];
    let start, end;
    if (dir == 1) {
        start = 0;
        end = points + 1;
    } // one extra here makes sure we connect the
    else if (dir == -1) {
        start = points + 1;
        end = 0;
    } else return;

    for (let i = start; (dir == 1 ? i < end : i > end); i = i + dir) {
        const theta = Math.PI * (i / (points / 2));
        ey = lon + (rlng * Math.cos(theta)); // center a + radius x * cos(theta)
        ex = lat + (rlat * Math.sin(theta)); // center b + radius y * sin(theta)
        extp.push(new google.maps.LatLng(ex, ey));
    }

    return extp;
}

Date.prototype.toDateInputValue = (function () {
    var local = new Date(this);
    local.setMinutes(this.getMinutes() - this.getTimezoneOffset());
    return local.toJSON().slice(0, 16);
});