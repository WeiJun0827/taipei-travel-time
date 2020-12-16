require('dotenv').config();
const { PORT_TEST, PORT, NODE_ENV, API_VERSION } = process.env;
const port = NODE_ENV == 'test' ? PORT_TEST : PORT;

// Express Initialization
const express = require('express');
const bodyparser = require('body-parser');
const app = express();

app.use(express.static('public'));
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));

// API routes
app.use('/api/' + API_VERSION,
    [
        require('./server/routes/travel_time_route'),
        require('./server/routes/user_route'),
    ]
);

// Page not found
app.use(function (req, res, next) {
    const err = new Error('Page Not Found');
    err.status = 404;
    next(err);
});

// Error handling
app.use(function (err, req, res) {
    res.status(err.status || 500);
    res.json({
        error: {
            message: err.message
        }
    });
});

app.listen(port, () => { console.log(`Listening on port: ${port}`); });