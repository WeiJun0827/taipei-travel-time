require('dotenv').config();
const axios = require('axios');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { query, transaction, commit, rollback } = require('./mysql_connection');
const salt = parseInt(process.env.BCRYPT_SALT);
const ProviderType = {
    NATIVE: 'native',
    FACEBOOK: 'facebook',
    GOOGLE: 'google'
};

const signUp = async(name, email, password, expire) => {
    try {
        await transaction();

        const emails = await query('SELECT email FROM user WHERE email = ? FOR UPDATE', [email]);
        if (emails.length > 0) {
            await commit();
            return { error: 'Email Already Exists' };
        }

        const loginAt = new Date();
        const sha = crypto.createHash('sha256');
        sha.update(email + password + loginAt);
        const accessToken = sha.digest('hex');
        const user = {
            provider: ProviderType.NATIVE,
            email: email,
            password: bcrypt.hashSync(password, salt),
            name: name,
            access_token: accessToken,
            access_expired: expire,
            login_at: loginAt
        };
        const queryStr = 'INSERT INTO user SET ?';

        const result = await query(queryStr, user);
        user.id = result.insertId;

        await commit();
        return { accessToken, loginAt, user };
    } catch (error) {
        await rollback();
        return { error };
    }
};

const nativeSignIn = async(email, password, expire) => {
    try {
        await transaction();

        const users = await query('SELECT * FROM user WHERE email = ?', [email]);
        const user = users[0];

        if (!bcrypt.compareSync(password, user.password)) {
            await commit();
            return { error: 'Password is wrong' };
        }

        const loginAt = new Date();
        const sha = crypto.createHash('sha256');
        sha.update(email + password + loginAt);
        const accessToken = sha.digest('hex');

        const queryStr = 'UPDATE user SET access_token = ?, access_expired = ?, login_at = ? WHERE id = ?';
        await query(queryStr, [accessToken, expire, loginAt, user.id]);

        await commit();

        return { accessToken, loginAt, user };
    } catch (error) {
        await rollback();
        return { error };
    }
};

const facebookSignIn = async(id, name, email, accessToken, expire) => {
    try {
        await transaction();

        const loginAt = new Date();
        let user = {
            provider: ProviderType.FACEBOOK,
            email: email,
            name: name,
            access_token: accessToken,
            access_expired: expire,
            login_at: loginAt
        };

        const users = await query('SELECT id FROM user WHERE email = ? AND provider = ? FOR UPDATE', [ProviderType.FACEBOOK, email]);
        let userId;
        if (users.length === 0) { // Insert new user
            const queryStr = 'insert into user set ?';
            const result = await query(queryStr, user);
            userId = result.insertId;
        } else { // Update existed user
            userId = users[0].id;
            const queryStr = 'UPDATE user SET access_token = ?, access_expired = ?, login_at = ?  WHERE id = ?';
            await query(queryStr, [accessToken, expire, loginAt, userId]);
        }
        user.id = userId;

        await commit();

        return { accessToken, loginAt, user };
    } catch (error) {
        await rollback();
        return { error };
    }
};

const getUserProfile = async(userId) => {
    const results = await query('SELECT * FROM user WHERE id = ?', userId);
    return {
        data: {
            provider: results[0].provider,
            name: results[0].name,
            email: results[0].email
        }
    };

};

const getFacebookProfile = async function(accessToken) {
    try {
        let res = await axios('https://graph.facebook.com/me?fields=id,name,email&access_token=' + accessToken, {
            responseType: 'json'
        });
        return res.body;
    } catch (e) {
        await rollback();
        console.log(e);
        return { error: 'Fail to get user\'s profile.' };
    }
};


const getUserId = async(accessToken) => {
    const results = await query('SELECT * FROM user WHERE access_token = ?', accessToken);
    if (results.length === 0) return { error: 'Invalid Access Token' };
    return results[0].id;
};

const getAllPlaces = async(user_id) => {
    const places = await query('SELECT id, lat, lon, icon, google_maps_id AS googleMapsId, title, description FROM place WHERE user_id = ?', user_id);
    return places;
};

const createPlace = async(user_id, lat, lon, icon, google_maps_id, title, description) => {
    try {
        await transaction();
        const place = { user_id, lat, lon, icon, google_maps_id, title, description };
        const result = await query('INSERT INTO place SET ?', place);
        await commit();
        return result.insertId;
    } catch (e) {
        await rollback();
        console.log(e);
        return { error: 'Fail to create user\'s favorite place.' };
    }
};

const getPlace = async(user_id, place_id) => {
    const place = await query('SELECT * FROM place WHERE user_id = ? AND id = ?', [user_id, place_id]);
    return place;
};

const updatePlace = async(user_id, place_id, title, description) => {
    try {
        await transaction();
        const result = await query('UPDATE place SET title = ?, description = ? WHERE user_id = ? AND id = ?', [title, description, user_id, place_id]);
        await commit();
        return result;
    } catch (e) {
        await rollback();
        console.log(e);
        return { error: 'Fail to update user\'s favorite place.' };
    }
};

const deletePlace = async(user_id, place_id) => {
    try {
        await transaction();
        const result = await query('DELETE FROM place WHERE user_id = ? AND id = ?', [user_id, place_id]);
        await commit();
        return result;
    } catch (e) {
        console.log(e);
        return { error: 'Fail to delete user\'s favorite place.' };
    }
};

module.exports = {
    signUp,
    nativeSignIn,
    facebookSignIn,
    getUserProfile,
    getFacebookProfile,
    getUserId,
    getAllPlaces,
    createPlace,
    getPlace,
    updatePlace,
    deletePlace,
    ProviderType
};