const users = [{
  provider: 'native',
  email: 'test1@gmail.com',
  password: 'test1password',
  name: 'test1',
  // picture: null,
  access_token: 'test1accesstoken',
  access_expired: (60 * 60), // 1hr by second
  login_at: new Date('2021-01-01'),
},
{
  provider: 'facebook',
  email: 'test2@gmail.com',
  password: null,
  name: 'test2',
  // picture: 'https://graph.facebook.com/1/picture?type=large',
  access_token: 'test2accesstoken',
  access_expired: (60 * 60), // 1hr by second
  login_at: new Date('2021-01-01'),
},
{
  provider: 'native',
  email: 'test3@gmail.com',
  password: 'test3passwod',
  name: 'test3',
  // picture: null,
  access_token: 'test3accesstoken',
  access_expired: 0,
  login_at: new Date('2021-01-01'),
},
];

const places = [{
  user_id: 1,
  lat: 25.048,
  lon: 121.556,
  icon: 'https://maps.gstatic.com/mapfiles/place_api/icons/v1/png_71/restaurant-71.png',
  google_maps_id: 'test_map_id_1',
  title: 'test_map_id_2',
  description: 'test_description_1',
}, {
  user_id: 1,
  lat: 25.049,
  lon: 121.557,
  icon: 'https://maps.gstatic.com/mapfiles/place_api/icons/v1/png_71/restaurant-71.png',
  google_maps_id: 'test_map_id_2',
  title: 'test_map_id_2',
  description: null,
}, {
  user_id: 1,
  lat: 25.050,
  lon: 121.558,
  icon: 'https://maps.gstatic.com/mapfiles/place_api/icons/v1/png_71/restaurant-71.png',
  google_maps_id: 'test_map_id_3',
  title: 'test_map_id_3',
  description: 'test_description_3',
}];

module.exports = { users, places };
