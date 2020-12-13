/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
let map;
let marker;
let polygon;

document.getElementById('my-position-btn').addEventListener('click', goToUsersLocation);
document.getElementById('travel-time').addEventListener('change', drawTransitArea);
document.getElementById('departure-time').addEventListener('change', drawTransitArea);
document.getElementById('is-holiday').addEventListener('change', drawTransitArea);
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
// document.getElementById('search-btn').addEventListener('click', drawTransitArea);

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
    drawTransitArea();
}

function initMarker(position) {
    const icon = {
        path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
        scale: 7,
        strokeColor: '#B3672B',
        strokeWeight: 5,
    };
    marker = new google.maps.Marker({
        map: map,
        position: position,
        title: '旅程起點',
        draggable: true,
        icon: icon
    });
    google.maps.event.addListener(marker, 'dragend', function () {
        drawTransitArea();
    });
}

function initPolygon() {
    // https://coolors.co/c4e5cd-9cc0f9-f1f3f4-fde293-ff8785
    polygon = new google.maps.Polygon({
        strokeWeight: 0,
        fillColor: '#FAA916', // 柳橙蘇打，目前第一名
        // fillColor: '#FF8C00', // 原色，被雪莉嫌像大便
        // fillColor: '#FFAAA0', // 草莓蘇打
        fillOpacity: 0.35
    });
    polygon.setMap(map);
}

function initSearchBox() {
    const searchBox = new google.maps.places.SearchBox(
        document.getElementById('search-place'));
    searchBox.setBounds(map.getBounds());
    searchBox.addListener('places_changed', function () {
        searchBoxPlaces(this);
    });
}

function searchBoxPlaces(searchBox) {
    const places = searchBox.getPlaces();
    if (places.length == 0) {
        window.alert('沒有符合的搜尋結果');
    } else {
        moveMarkerForPlace(places[0]);
    }
}

function moveMarkerForPlace(place) {
    const bounds = new google.maps.LatLngBounds();
    marker.setPosition(place.geometry.location);
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
            moveMarkerForPlace(results[0]);
        }
    });
}

function goToUsersLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            const currentPosition = new google.maps.LatLng(
                position.coords.latitude,
                position.coords.longitude);
            marker.setPosition(currentPosition);
            map.setCenter(currentPosition);
            drawTransitArea();
        });
    }
}

function drawTransitArea() {
    const maxWalkDist = document.getElementById('apply-max-walk-dist').checked ? document.getElementById('max-walk-dist').value : Infinity;
    const maxTransferTimes = document.getElementById('apply-max-transfer-times').checked ? document.getElementById('max-transfer-times').value : Infinity;
    const params = new URLSearchParams({
        starterId: 'ABC',
        lat: marker.getPosition().lat(),
        lon: marker.getPosition().lng(),
        maxTravelTime: document.getElementById('travel-time').value,
        departureTime: document.getElementById('departure-time').value,
        isHoliday: document.getElementById('is-holiday').checked,
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