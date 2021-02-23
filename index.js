require('dotenv').config();
const { PORT_TEST, PORT, NODE_ENV, API_VERSION } = process.env;
const port = NODE_ENV == 'test' ?
    PORT_TEST ? PORT_TEST : 3001 :
    PORT ? PORT : 3000;

// Express Initialization
const express = require('express');
const bodyparser = require('body-parser');
const app = express();

app.use(express.static('public'));
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));

// API routes
app.use('/api/' + API_VERSION, [
    require('./server/routes/travel_time_route'),
    require('./server/routes/user_route'),
]);

// Page not found
app.use(function(req, res, next) {
    res.status(404).sendFile(__dirname + '/public/404.html');
});

// Error handling
app.use(function(err, req, res, next) {
    console.log(err);
    res.status(500).send('Internal Server Error');
});

app.listen(port, () => { console.log(`Listening on port: ${port}`); });

module.exports = app;