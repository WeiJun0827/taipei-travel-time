require('dotenv').config();
const axios = require('axios');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { query, transaction, commit, rollback } = require('./mysqlcon');
const salt = parseInt(process.env.BCRYPT_SALT);
const ProviderType = {
    NATIVE: 'native',
    FACEBOOK: 'facebook',
    GOOGLE: 'google'
};

const signUp = async (name, email, password, expire) => {
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

const nativeSignIn = async (email, password, expire) => {
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

const facebookSignIn = async (id, name, email, accessToken, expire) => {
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

const getUserProfile = async (accessToken) => {
    const results = await query('SELECT * FROM user WHERE access_token = ?', [accessToken]);
    if (results.length === 0) {
        return { error: 'Invalid Access Token' };
    } else {
        return {
            data: {
                provider: results[0].provider,
                name: results[0].name,
                email: results[0].email
            }
        };
    }
};

const getFacebookProfile = async function (accessToken) {
    try {
        let res = await axios('https://graph.facebook.com/me?fields=id,name,email&access_token=' + accessToken, {
            responseType: 'json'
        });
        return res.body;
    } catch (e) {
        console.log(e);
        throw ('Permissions Error: facebook access token is wrong');
    }
};


const getMySavedPlacesList = async (accessToken) => {
    //extract user id
    const userData = await query('SELECT * FROM user WHERE access_token = ?', accessToken);
    let userId = userData[0].id;
    let myPlacesList = await query(`SELECT * FROM user INNER JOIN saved_place ON user.id = (SELECT product_id WHERE user_id=${userId});`);
    for (const fav of myPlacesList) {
        const imgPath = require('../../util/util').getImagePath(fav.id);
        fav['main_image'] = imgPath + fav['main_image'];
    }
    return myPlacesList;
};

module.exports = {
    signUp,
    nativeSignIn,
    facebookSignIn,
    getUserProfile,
    getFacebookProfile,
    getMySavedPlacesList,
    ProviderType
};