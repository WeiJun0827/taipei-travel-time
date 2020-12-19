/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
let map;
let mainMarker;
let polygon;
let placeMarkers = [];
let placeInfoWindow;
let directionsRenderer;

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
        title: '旅程起點',
        draggable: true,
        // icon: icon,
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
        fillColor: '#FAA916', // 柳橙蘇打，目前第一名
        // fillColor: '#FF8C00', // 原色，被雪莉嫌像大便
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
        draggable: true,
        panel: document.getElementById('directions-panel')
        // polylineOptions: {
        //     strokeColor: 'green'
        // }
    });
}

function initInfoWindow() {
    placeInfoWindow = new google.maps.InfoWindow({ maxWidth: 220 });
}

function searchBoxPlaces(searchBox) {
    const places = searchBox.getPlaces();
    if (places.length == 0) {
        window.alert('沒有符合的搜尋結果');
    } else {
        // moveMarkerForPlace(places[0]);
        textSearchPlaces();
    }
}

function moveMarkerForPlace(place) {
    const bounds = new google.maps.LatLngBounds();
    mainMarker.setPosition(place.geometry.location);
    if (place.geometry.viewport) {
        bounds.union(place.geometry.viewport);
    } else {
        bounds.extend(place.geometry.location);
    }
    map.fitBounds(bounds);
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
            createMarkersForPlaces(results);
        }
    });
}

function resetMarkers(markers) {
    markers.forEach(m => m.setMap(null));
    markers = [];
}

function createMarkersForPlaces(places) {
    const bounds = new google.maps.LatLngBounds();
    for (const place of places) {
        const icon = {
            url: place.icon,
            size: new google.maps.Size(35, 35),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(15, 34),
            scaledSize: new google.maps.Size(25, 25)
        };
        const marker = new google.maps.Marker({
            map: map,
            icon: icon,
            title: place.name,
            position: place.geometry.location,
            id: place.place_id
        });
        marker.addListener('click', function () {
            if (placeInfoWindow.marker != this) {
                getPlacesDetails(this, placeInfoWindow);
            }
        });
        placeMarkers.push(marker);
        if (place.geometry.viewport) {
            bounds.union(place.geometry.viewport);
        } else {
            bounds.extend(place.geometry.location);
        }
    }
    map.fitBounds(bounds);
}

function getPlacesDetails(marker, placeInfoWindow) {
    const service = new google.maps.places.PlacesService(map);
    service.getDetails({
        placeId: marker.id
    }, function (place, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            // Set the marker property on this infowindow so it isn't created again.
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
                        $('<a></a>').text(decodeURI(place.website))));
            }
            if (place.photos) {
                infoDiv.append(
                    $('<div></div>').attr('class', 'place-image').append(
                        $('<img>').attr('src', `${place.photos[0].getUrl({ maxHeight: 100, maxWidth: 200 })}`)));
            }
            const form = $('<form></form>').attr({ class: 'my-place-form' }).css('display', 'none');
            form.append($('<br>'));
            form.append($('<strong></strong>').text('我的地點'));
            form.append($('<input>').attr({
                type: 'text',
                class: 'place-title',
                placeholder: '標題',
                style: 'width: 175px;',
                required: true,
            }).css({ width: '175px' }));
            form.append($('<textarea></textarea>').attr({
                class: 'place-description',
                rows: 4,
            }).css({ width: '176px', resize: 'none' }));
            form.append(
                $('<input>').attr({ type: 'button', class: 'submit-place', value: '完成' }));
            form.append(
                $('<input>').attr({ type: 'button', class: 'hide-editor', value: '取消' }));
            infoDiv.append(form);
            const optionsMenu = $('<div></div>').attr('class', 'options-menu');
            infoDiv.append(optionsMenu);
            optionsMenu.append(
                $('<input>').attr({ type: 'button', class: 'display-directions', value: '顯示路徑' }));
            optionsMenu.append(
                $('<input>').attr({ type: 'button', class: 'create-label', value: '標記地點' }));
            optionsMenu.append(
                $('<input>').attr({ type: 'button', class: 'edit-label', value: '編輯' }).css('display', 'none'));
            optionsMenu.append(
                $('<input>').attr({ type: 'button', class: 'delete-label', value: '刪除' }).css('display', 'none'));
            placeInfoWindow.setContent(infoDiv.html());
            placeInfoWindow.open(map, marker);
            placeInfoWindow.addListener('domready', function () {
                $('.display-directions').click(displayDirections);
                $('.create-label').click(openEditor);
                $('.submit-place').click(createLabel);
                $('.hide-editor').click(hideEditor);
            });
            placeInfoWindow.addListener('closeclick', function () {
                placeInfoWindow.marker = null;
            });
        }
    });
}

function displayDirections() {
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
            routingPreference: 'FEWER_TRANSFERS'
        },
    }, function (response, status) {
        if (status === google.maps.DirectionsStatus.OK) {
            directionsRenderer.setDirections(response);
        } else {
            window.alert('Directions request failed due to ' + status);
        }
    });
}

function openEditor() {
    $('.my-place-form').css('display', 'inherit');
    $('.options-menu').css('display', 'none');
}

function createLabel() {
    var settings = {
        'url': '/api/1.0/user/places',
        'method': 'POST',
        'headers': {
            'Authorization': 'Bearer 48b752189d556d065393e53d01bb880012d111e4c57474e15cc277ddbb49d033',
            'Content-Type': 'application/json'
        },
        'data': JSON.stringify({
            lat: placeInfoWindow.marker.getPosition().lat(),
            lon: placeInfoWindow.marker.getPosition().lng(),
            title: $('.place-title').val(),
            type: null,
            description: $('.place-description').val()
        })
    };

    $.ajax(settings).done(function (response) {
        const { placeId } = response;
        console.log(placeId);
        const info = $('<div><br></div>');
        info.append(
            $('<strong></strong>').text($('.place-title').val()).attr({
                class: '.place-title'
            }));
        info.append(
            $('<div></div>').text($('.place-description').val()).attr({
                class: '.place-description'
            }));
        $('.my-place-form').replaceWith(info);
        $('.create-label').css('display', 'none');
        $('.edit-label').css('display', 'inline-block');
        $('.delete-label').css('display', 'inline-block');
        $('.options-menu').css('display', 'inherit');
    });

    // const headers = new Headers();
    // headers.append('Authorization', 'Bearer 48b752189d556d065393e53d01bb880012d111e4c57474e15cc277ddbb49d033');
    // headers.append('Content-Type', 'application/json');

    // const raw = JSON.stringify({
    //     lat: placeInfoWindow.marker.getPosition().lat(),
    //     lon: placeInfoWindow.marker.getPosition().lng(),
    //     title: $('.place-title').val(),
    //     type: null,
    //     description: $('.place-description').val()
    // });

    // const requestOptions = {
    //     method: 'POST',
    //     headers: headers,
    //     body: raw
    // };

    // fetch('/api/1.0/user/places', requestOptions)
    //     .then(response => response.text())
    //     .then(result => console.log(result))
    //     .catch(error => console.log('error', error));
}

function hideEditor() {
    $('.my-place-form').css('display', 'none');
    $('.options-menu').css('display', 'inherit');
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