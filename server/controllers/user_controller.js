require('dotenv').config();
const validator = require('validator');
const User = require('../models/user_model');
const ProviderType = User.ProviderType;
const expire = process.env.TOKEN_EXPIRE; // 30 days by seconds

const signUp = async (req, res) => {
    let { name } = req.body;
    const { email, password } = req.body;

    if (!name || !email || !password) {
        res.status(400).send({ error: 'Request Error: name, email and password are required.' });
        return;
    }

    if (!validator.isEmail(email)) {
        res.status(400).send({ error: 'Request Error: Invalid email format' });
        return;
    }

    name = validator.escape(name);

    const result = await User.signUp(name, email, password, expire);
    if (result.error) {
        res.status(403).send({ error: result.error });
        return;
    }

    const { accessToken, loginAt, user } = result;
    if (!user) {
        res.status(500).send({ error: 'Database Query Error' });
        return;
    }

    res.status(200).send({
        data: {
            access_token: accessToken,
            access_expired: expire,
            login_at: loginAt,
            user: {
                id: user.id,
                provider: user.provider,
                name: user.name,
                email: user.email
            }
        }
    });
};

const nativeSignIn = async (email, password) => {
    if (!email || !password) {
        return { error: 'Request Error: email and password are required.', status: 400 };
    }

    try {
        return await User.nativeSignIn(email, password, expire);
    } catch (error) {
        return { error };
    }
};

const facebookSignIn = async (accessToken) => {
    if (!accessToken) {
        return { error: 'Request Error: access token is required.', status: 400 };
    }

    try {
        const profile = await User.getFacebookProfile(accessToken);
        const { id, name, email } = profile;

        if (!id || !name || !email) {
            return { error: 'Permissions Error: facebook access token can not get user id, name or email' };
        }

        return await User.facebookSignIn(id, name, email, accessToken, expire);
    } catch (error) {
        return { error: error };
    }
};

const signIn = async (req, res) => {
    const data = req.body;

    let result;
    switch (data.provider) {
        case ProviderType.NATIVE:
            result = await nativeSignIn(data.email, data.password);
            break;
        case ProviderType.FACEBOOK:
            result = await facebookSignIn(data.access_token);
            break;
        default:
            result = { error: 'Provider Undefined' };
    }

    if (result.error) {
        const status_code = result.status ? result.status : 403;
        res.status(status_code).send({ error: result.error });
        return;
    }

    const { accessToken, loginAt, user } = result;
    if (!user) {
        res.status(500).send({ error: 'Database Query Error' });
        return;
    }

    res.status(200).send({
        data: {
            access_token: accessToken,
            access_expired: expire,
            login_at: loginAt,
            user: {
                id: user.id,
                provider: user.provider,
                name: user.name,
                email: user.email
            }
        }
    });
};

const verifyToken = async (req, res, next) => {
    let accessToken = req.get('Authorization');
    if (accessToken) {
        accessToken = accessToken.replace('Bearer ', '');
        const result = await User.getUserId(accessToken);
        if (result.error) {
            res.status(403).send({ error: result.error });
            return;
        }
        req.userId = result;
        next();
    } else {
        res.status(400).send({ error: 'Wrong Request: authorization is required.' });
        return;
    }
};

const getUserProfile = async (req, res) => {
    const profile = await User.getUserProfile(req.userId);
    res.status(200).send(profile);
};

const getAllPlaces = async (req, res) => {
    const places = await User.getAllPlaces(req.userId);
    res.status(200).send({ places: places });
};

const createPlace = async (req, res) => {
    const { lat, lon, icon, googleMapsId, title, description } = req.body;
    const placeId = await User.createPlace(req.userId, lat, lon, icon, googleMapsId, title, description);
    res.status(200).send({ placeId: placeId });
};

const getPlace = async (req, res) => {
    const placeId = Number(req.params.id);
    const place = await User.getPlace(req.userId, placeId);
    res.status(200).send({ place: place });
};

const updatePlace = async (req, res) => {
    const placeId = Number(req.params.id);
    const { title, type, description } = req.body;
    const myList = await User.updatePlace(req.userId, placeId, title, type, description);
    res.status(200).send({ data: myList });
};

const deletePlace = async (req, res) => {
    const placeId = Number(req.params.id);
    const myList = await User.deletePlace(req.userId, placeId);
    res.status(200).send({ data: myList });
};
module.exports = {
    signUp,
    signIn,
    verifyToken,
    getUserProfile,
    getAllPlaces,
    createPlace,
    getPlace,
    updatePlace,
    deletePlace
};
