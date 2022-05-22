/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
let map;
let mainMarker;
let polygon;
let searchPlaceMarkers = [];
let placeInfoWindow;
let directionsRenderer;
let datetime;
const token = window.localStorage.getItem('access_token');

document.getElementById('my-location-btn').addEventListener('click', moveMainMarkerToUsersLocation);
document.getElementById('search-place-btn').addEventListener('click', textSearchPlaces);
document.getElementById('clear-search-place-btn').addEventListener('click', closeSearchPlaces);
document.getElementById('travel-time').addEventListener('change', displayReachableArea);
document.getElementById('transit-mode').addEventListener('change', displayReachableArea);
document.getElementById('max-walk-dist').addEventListener('change', displayReachableArea);
document.getElementById('max-transfer-times').addEventListener('change', displayReachableArea);

// Menu Toggle Script
$('#close-sidebar-btn').click((e) => {
  e.preventDefault();
  resetDirections();
});

$(document).ready(() => {
  $('#departure-time').val(new Date().toDateInputValue());
  datetime = $('#departure-time').val();
  initNavbar();
});

function initNavbar() {
  if (token) {
    const settings = {
      url: '/api/1.0/user/profile',
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };

    $.ajax(settings).done((response) => {
      const { data: { name } } = response;
      $('#user-name').css('display', 'block');
      $('#sign-out').css('display', 'block');
      $('#user-name-field').text(name);
    }).fail(() => {
      $('#sign-in-sign-up').css('display', 'block');
    });
  } else {
    $('#sign-in-sign-up').css('display', 'block');
  }
}

function initMap() {
  const styles = [{
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [
      { lightness: +60 },
    ],
  }, {
    featureType: 'road.highway',
    elementType: 'geometry.fill',
    stylers: [
      { lightness: +75 },
    ],
  }, {
    featureType: 'road.highway',
    elementType: 'labels.icon',
    stylers: [
      { visibility: 'off' },
    ],
  }];

  const mapOptions = {
    center: new google.maps.LatLng(25.0478072, 121.5170185),
    zoom: 13,
    styles,
    mapTypeControl: false,
  };
  map = new google.maps.Map(document.getElementById('map'), mapOptions);
  initMarker(mapOptions.center);
  initPolygon();
  initSearchBox();
  initDirectionsRenderer();
  initInfoWindow();
  if (token) getFavoritePlaces();
}

function initMarker(position) {
  const icon = {
    url: '../assets/svg/metro-marker.svg',
    strokeWeight: 0,
    fillOpacity: 1,
    scale: 10,
    origin: new google.maps.Point(0, 0),
    anchor: new google.maps.Point(35, 70),
    scaledSize: new google.maps.Size(70, 70),
  };
  mainMarker = new google.maps.Marker({
    icon,
    map,
    position,
    title: 'Starter',
    draggable: true,
    animation: google.maps.Animation.DROP,
  });
  google.maps.event.addListener(mainMarker, 'dragend', () => {
    displayReachableArea();
  });
}

function initPolygon() {
  // https://coolors.co/c4e5cd-9cc0f9-f1f3f4-fde293-ff8785
  polygon = new google.maps.Polygon({
    map,
    strokeWeight: 0,
    fillColor: '#FAA916',
    fillOpacity: 0.35,
  });
}

function initSearchBox() {
  const searchBox = new google.maps.places.SearchBox(
    document.getElementById('search-place'),
  );
  searchBox.setBounds(map.getBounds());
  searchBox.addListener('places_changed', function () {
    searchBoxPlaces(this);
  });
}

function initDirectionsRenderer() {
  $('#directions-info').replaceWith($('<div></div>').attr('id', 'directions-info'));
  directionsRenderer = new google.maps.DirectionsRenderer({
    map,
    panel: document.getElementById('directions-info'),
  });
}

function initInfoWindow() {
  placeInfoWindow = new google.maps.InfoWindow({ maxWidth: 220 });
  placeInfoWindow.addListener('domready', () => {
    if (placeInfoWindow.marker.isMyPlace) setInfoWindowToLabeledMode();
    else setInfoWindowToDefaultMode();
    $('.set-as-marker').click(moveMarkerForPlace);
    $('.display-directions').click(displayDirections);
    $('.create-label').click(() => {
      if (!token) {
        Swal.fire({
          icon: 'info',
          title: 'Sign in to mark your favorite places',
          showCancelButton: true,
          confirmButtonText: 'Sign In',
          reverseButtons: true,
        }).then((result) => {
          if (result.isConfirmed) window.location.href = './member.html';
        });
      } else setInfoWindowToEditingMode();
    });
    $('.hide-editor').click(() => {
      if (placeInfoWindow.marker.isMyPlace) setInfoWindowToLabeledMode();
      else setInfoWindowToDefaultMode();
    });
    $('.submit-place').click(() => {
      if (placeInfoWindow.marker.isMyPlace) updateFavoritePlace();
      else createFavoritePlace();
    });
    $('.edit-label').click(setInfoWindowToEditingMode);
    $('.delete-label').click(() => {
      deleteFavoritePlace();
    });
  });
  placeInfoWindow.addListener('closeclick', () => {
    placeInfoWindow.marker = null;
  });
}

function searchBoxPlaces(searchBox) {
  const places = searchBox.getPlaces();
  if (places.length == 0) {
    Swal.fire({
      icon: 'warning',
      title: 'No search results',
      text: 'Try to search a specific location or address.',
    });
  } else {
    textSearchPlaces();
  }
}

function moveMarkerForPlace() {
  mainMarker.setPosition(placeInfoWindow.marker.position);
  displayReachableArea();
}

function textSearchPlaces() {
  $('#clear-search-place-btn').css('display', 'flex');
  const bounds = map.getBounds();
  const placesService = new google.maps.places.PlacesService(map);
  placesService.textSearch({
    query: document.getElementById('search-place').value,
    bounds,
  }, (results, status) => {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
      resetMarkers();
      resetDirections();
      createMarkersForSearchResults(results);
    }
  });
}

function resetMarkers() {
  searchPlaceMarkers.forEach((m) => m.setMap(null));
  searchPlaceMarkers = [];
}

function resetDirections() {
  if (!$('#sidebar-wrapper').hasClass('hiden')) $('#sidebar-wrapper').addClass('hiden');
  directionsRenderer.setMap(null);
  searchPlaceMarkers.forEach((m) => m.setMap(map));
  initDirectionsRenderer();
}

function createMarkersForSearchResults(places) {
  const bounds = new google.maps.LatLngBounds();
  let count = 0;
  for (const place of places) {
    count++;
    const marker = createMarker(place.place_id, place.geometry.location, place.name, place.icon, count.toString());
    searchPlaceMarkers.push(marker);
    if (place.geometry.viewport) {
      bounds.union(place.geometry.viewport);
    } else {
      bounds.extend(place.geometry.location);
    }
  }
  map.fitBounds(bounds);
}

function createMarker(placeId, position, title, icon, label, additioalParamsObj) {
  let marker;
  if (label) {
    marker = new google.maps.Marker({
      map,
      label,
      iconUrl: icon,
      title,
      position,
      placeId,
    });
  } else {
    marker = new google.maps.Marker({
      map,
      icon,
      title,
      position,
      placeId,
    });
  }
  if (additioalParamsObj) Object.assign(marker, additioalParamsObj);
  marker.addListener('click', function () {
    if (placeInfoWindow.marker != this) {
      getPlaceDetails(this, placeInfoWindow);
    }
  });
  return marker;
}

function getPlaceDetails(marker, placeInfoWindow) {
  const service = new google.maps.places.PlacesService(map);
  service.getDetails({
    placeId: marker.placeId,
  }, (place, status) => {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
      placeInfoWindow.marker = marker;
      const infoDiv = $('<div></div>');
      if (place.name) {
        infoDiv.append(
          $('<div></div>').attr('class', 'place-name').append(
            $('<strong></strong>').text(place.name),
          ),
        );
      }
      if (place.formatted_address) {
        infoDiv.append(
          $('<div></div>').attr('class', 'place-address').text(place.formatted_address),
        );
      }
      if (place.formatted_phone_number) {
        infoDiv.append(
          $('<div></div>').attr('class', 'place-phone').text(place.formatted_phone_number),
        );
      }
      if (place.website) {
        infoDiv.append(
          $('<div></div>').attr('class', 'place-website').append(
            $('<a></a>').text(decodeURI(place.website)).attr('href', place.website),
          ),
        );
      }
      if (place.photos) {
        infoDiv.append(
          $('<div><br></div>').attr('class', 'place-image').append(
            $('<img>').attr('src', `${place.photos[0].getUrl({ maxHeight: 100, maxWidth: 200 })}`),
          ),
        );
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
  const form = $('<form><br></form>').attr({ class: 'my-place-form' });
  form.append($('<input>').attr({
    type: 'text',
    class: 'place-title-input',
    placeholder: '標題',
    required: true,
    value: title,
  }));
  form.append($('<textarea></textarea>').attr({
    class: 'place-description-input',
    rows: 4,
  }).text(description));
  const formBtns = $('<div></div>').attr({ class: 'form-btns' });
  form.append(formBtns);
  formBtns.append(
    $('<button type="button"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-x" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/></svg></button>').attr({ class: 'info-window-btn hide-editor btn' }),
  );
  formBtns.append(
    $('<button type="button"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-check" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M10.97 4.97a.75.75 0 0 1 1.071 1.05l-3.992 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.236.236 0 0 1 .02-.022z"/></svg></button>').attr({ class: 'info-window-btn submit-place btn' }),
  );
  container.append(form);

  const label = $('<div><br></div>').attr({ class: 'my-place-label' }).css('display', 'none');
  label.append($('<strong></strong>').attr({ class: 'place-title-label' }).text(title));
  label.append($('<div></div>').attr({ class: 'place-description-label' }).text(description));
  label.append($('<br>'));
  container.append(label);

  const optionsMenu = $('<div></div>').attr('class', 'info-window-menu');
  optionsMenu.append(
    $('<button type="button"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-geo-alt-fill" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10zm0-7a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/></svg></button>').attr({
      class: 'info-window-btn set-as-marker btn', 'data-bs-placement': 'bottom', 'data-bs-toggle': 'tooltip', title: 'Set as starter',
    }),
  );
  optionsMenu.append(
    $('<button type="button"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-cursor-fill" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M14.082 2.182a.5.5 0 0 1 .103.557L8.528 15.467a.5.5 0 0 1-.917-.007L5.57 10.694.803 8.652a.5.5 0 0 1-.006-.916l12.728-5.657a.5.5 0 0 1 .556.103z"/></svg></button>').attr({
      class: 'info-window-btn display-directions btn', 'data-bs-placement': 'bottom', 'data-bs-toggle': 'tooltip', title: 'Directions to here',
    }),
  );
  optionsMenu.append(
    $('<button type="button"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-star-fill" viewBox="0 0 16 16"><path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.283.95l-3.523 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z"/></svg></button>').attr({
      class: 'info-window-btn create-label btn', 'data-bs-placement': 'bottom', 'data-bs-toggle': 'tooltip', title: 'Add to favorite',
    }),
  );
  optionsMenu.append(
    $('<button type="button"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-pencil-fill" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-3-3zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207l6.5-6.5zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.499.499 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11l.178-.178z"/></svg></button>').attr({
      class: 'info-window-btn edit-label btn', 'data-bs-placement': 'bottom', 'data-bs-toggle': 'tooltip', title: 'Edit favorite',
    }),
  );
  optionsMenu.append(
    $('<button type="button"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-trash-fill" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1H2.5zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5zM8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5zm3 .5a.5.5 0 0 0-1 0v7a.5.5 0 0 0 1 0v-7z"/></svg></button>').attr({
      class: 'info-window-btn delete-label btn', 'data-bs-placement': 'bottom', 'data-bs-toggle': 'tooltip', title: 'Delete favorite',
    }),
  );
  container.append(optionsMenu);
}

function getFavoritePlaces() {
  if (!token) return;

  const settings = {
    url: '/api/1.0/user/places',
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };

  $.ajax(settings).done((response) => {
    const { places } = response;
    for (const place of places) {
      const position = new google.maps.LatLng(place.lat, place.lon);
      const icon = {
        url: place.icon,
        size: new google.maps.Size(35, 35),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(15, 34),
        scaledSize: new google.maps.Size(25, 25),
      };
      const additionalParams = {
        isMyPlace: true,
        id: place.id,
        description: place.description,
      };
      const marker = createMarker(place.googleMapsId, position, place.title, icon, undefined, additionalParams);
    }
  }).fail(() => {});
}

function createFavoritePlace() {
  const position = placeInfoWindow.marker.getPosition();
  const { iconUrl } = placeInfoWindow.marker;
  const { placeId } = placeInfoWindow.marker;
  const title = $('.place-title-input').val();
  const description = $('.place-description-input').val();
  const settings = {
    url: '/api/1.0/user/places',
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    data: JSON.stringify({
      lat: position.lat(),
      lon: position.lng(),
      icon: iconUrl,
      googleMapsId: placeId,
      title,
      description,
    }),
  };

  $('#loading-cover').css('display', 'block');
  $.ajax(settings).done(() => {
    const icon = {
      url: iconUrl,
      size: new google.maps.Size(35, 35),
      origin: new google.maps.Point(0, 0),
      anchor: new google.maps.Point(15, 34),
      scaledSize: new google.maps.Size(25, 25),
    };
    const additionalParams = {
      isMyPlace: true,
      id: placeId,
      description,
    };
    placeInfoWindow.marker.setMap(null);
    setInfoWindowToLabeledMode();
    const marker = createMarker(placeId, position, title, icon, undefined, additionalParams);
  }).fail((error) => {
    console.error(error);
  }).always(() => {
    $('#loading-cover').css('display', 'none');
  });
}

function updateFavoritePlace() {
  const settings = {
    url: `/api/1.0/user/places/${placeInfoWindow.marker.id}`,
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    data: JSON.stringify({
      title: $('.place-title-input').val(),
      description: $('.place-description-input').val(),
    }),
  };

  $('#loading-cover').css('display', 'block');
  $.ajax(settings).done(() => {
    placeInfoWindow.marker.isMyPlace = true;
    placeInfoWindow.marker.title = $('.place-title-input').val();
    placeInfoWindow.marker.description = $('.place-description-input').val();
    $('.place-title-label').text($('.place-title-input').val());
    $('.place-description-label').text($('.place-description-input').val());
    setInfoWindowToLabeledMode();
  }).fail((error) => {
    console.error(error);
  }).always(() => {
    $('#loading-cover').css('display', 'none');
  });
}

function deleteFavoritePlace() {
  Swal.fire({
    icon: 'question',
    title: 'Delete place',
    text: 'You are about to delete a place, are you sure?',
    showCancelButton: true,
    confirmButtonText: 'Yes, delete it',
    cancelButtonText: 'No, cancel',
    reverseButtons: true,
  }).then((result) => {
    if (result.isConfirmed) {
      const settings = {
        url: `/api/1.0/user/places/${placeInfoWindow.marker.id}`,
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      };

      $('#loading-cover').css('display', 'block');
      $.ajax(settings).done(() => {
        placeInfoWindow.marker.setMap(null);
        setInfoWindowToDefaultMode();
      }).fail((error) => {
        console.error(error);
      }).always(() => {
        $('#loading-cover').css('display', 'none');
      });
    }
  });
}

function setInfoWindowToLabeledMode() {
  $('.my-place-form').css('display', 'none');
  $('.my-place-label').css('display', 'block');
  $('.info-window-menu').css('display', 'flex');
  $('.create-label').css('display', 'none');
  $('.edit-label').css('display', 'inline-block');
  $('.delete-label').css('display', 'inline-block');
}

function setInfoWindowToEditingMode() {
  $('.my-place-form').css('display', 'flex');
  $('.my-place-label').css('display', 'none');
  $('.info-window-menu').css('display', 'none');
}

function setInfoWindowToDefaultMode() {
  $('.my-place-form').css('display', 'none');
  $('.my-place-label').css('display', 'none');
  $('.info-window-menu').css('display', 'flex');
  $('.create-label').css('display', 'inline-block');
  $('.edit-label').css('display', 'none');
  $('.delete-label').css('display', 'none');
}

function displayDirections() {
  if ($('#sidebar-wrapper').hasClass('hiden')) $('#sidebar-wrapper').removeClass('hiden');
  searchPlaceMarkers.forEach((m) => m.setMap(null));
  const modes = [];
  switch (document.getElementById('transit-mode').value) {
    case '1':
      modes.push('BUS');
      break;
    case '2':
      modes.push('SUBWAY');
      break;
    case '3':
    default:
      modes.push('SUBWAY');
      modes.push('BUS');
      break;
  }
  const directionsService = new google.maps.DirectionsService();
  const origin = new google.maps.LatLng(mainMarker.getPosition().lat(), mainMarker.getPosition().lng());
  const destination = new google.maps.LatLng(placeInfoWindow.marker.getPosition().lat(), placeInfoWindow.marker.getPosition().lng());
  const departureTime = new Date(document.getElementById('departure-time').value);
  directionsService.route({
    origin,
    destination,
    travelMode: google.maps.TravelMode.TRANSIT,
    transitOptions: {
      departureTime,
      modes,
    },
  }, (response, status) => {
    if (status === google.maps.DirectionsStatus.OK) {
      directionsRenderer.setDirections(response);
    } else {
      window.alert(`Directions request failed due to ${status}`);
    }
  });
}

function closeDirections() {
  directionsRenderer.setMap(null);
  searchPlaceMarkers.forEach((m) => m.setMap(map));
  initDirectionsRenderer();
}

function closeSearchPlaces() {
  resetMarkers();
  $('#search-place').val('');
  $('#clear-search-place-btn').css('display', 'none');
}

function moveMainMarkerToUsersLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((position) => {
      const currentPosition = new google.maps.LatLng(
        position.coords.latitude,
        position.coords.longitude,
      );
      mainMarker.setPosition(currentPosition);
      map.setCenter(currentPosition);
      displayReachableArea();
    });
  }
}

function displayReachableArea() {
  const maxWalkDist = document.getElementById('max-walk-dist').value;
  const maxTransferTimes = document.getElementById('max-transfer-times').value;
  const transitMode = document.getElementById('transit-mode').value;
  const lat = mainMarker.getPosition().lat();
  const lon = mainMarker.getPosition().lng();
  if (lat < 24.83 || lat > 25.3 || lon < 121.285 || lon > 122) {
    Swal.fire({
      icon: 'warning',
      title: 'The location is not supported',
      text: 'Try somewhere else in Taipei or New Taipei City.',
    });
    return;
  }
  const params = new URLSearchParams({
    starterId: Math.random().toString(36).substr(2, 3) + Date.now().toString(36).substr(4, 3),
    lat,
    lon,
    maxTravelTime: document.getElementById('travel-time').value,
    departureTime: datetime,
    takeMetro: transitMode == '2' || transitMode == '3',
    takeBus: transitMode == '1' || transitMode == '3',
    maxWalkDist,
    maxTransferTimes,
  });
  $('#loading-cover').css('display', 'block');
  fetch(`/api/1.0/tavelTime/transit?${params}`).then((response) => {
    if (!response.ok) throw new Error(response.statusText);
    return response.json();
  }).then((json) => {
    const paths = [];
    for (const station of json.data) {
      const circle = drawCircle(station.lat, station.lon, station.radius, 1);
      paths.push(circle);
    }
    polygon.setPaths(paths);
  }).catch((error) => {
    console.log('Fetch Error: ', error);
  })
    .finally(() => {
      $('#loading-cover').css('display', 'none');
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
  let start; let
    end;
  if (dir == 1) {
    start = 0;
    end = points + 1;
  } // one extra here makes sure we connect the
  else if (dir == -1) {
    start = points + 1;
    end = 0;
  } else return;

  for (let i = start;
    (dir == 1 ? i < end : i > end); i += dir) {
    const theta = Math.PI * (i / (points / 2));
    ey = lon + (rlng * Math.cos(theta)); // center a + radius x * cos(theta)
    ex = lat + (rlat * Math.sin(theta)); // center b + radius y * sin(theta)
    extp.push(new google.maps.LatLng(ex, ey));
  }

  return extp;
}

function updateDepartureTime() {
  datetime = $('#departure-time').val();
  $('#departure-time-text').val(datetime.slice(11, 16));
  displayReachableArea();
}

function cancelSetDepartureTime() {
  $('#departure-time').val(datetime);
}

function setDepartureTimeToNow() {
  $('#departure-time').val(new Date().toDateInputValue());
}

function signOut() {
  if (window.localStorage.getItem('access_token')) {
    window.localStorage.removeItem('access_token');
    Swal.fire({
      icon: 'info',
      title: 'Sign you out',
      text: 'See you next time.',
    }).then(() => {
      $('#sign-in-sign-up').css('display', 'block');
      $('#user-name').css('display', 'none');
      $('#sign-out').css('display', 'none');
    });
  }
}

Date.prototype.toDateInputValue = (function () {
  const local = new Date(this);
  local.setMinutes(this.getMinutes() - this.getTimezoneOffset());
  return local.toJSON().slice(0, 16);
});
