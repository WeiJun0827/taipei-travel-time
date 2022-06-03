import axios from 'axios';
import { hashSync, compareSync } from 'bcrypt';

import ErrorWithCode from '../util/error.js';
import { pool } from './mysql.js';

const salt = parseInt(process.env.BCRYPT_SALT, 10);
const ProviderType = {
  NATIVE: 'native',
  FACEBOOK: 'facebook',
  GOOGLE: 'google',
};

async function signUp(name, email, password) {
  const connection = await pool.getConnection();
  try {
    await connection.query('START TRANSACTION');

    const [emails] = await connection.query('SELECT email FROM user WHERE email = ? FOR UPDATE', [email]);
    if (emails.length > 0) {
      await connection.query('COMMIT');
      throw new ErrorWithCode(403, 'Email already exists');
    }

    const provider = ProviderType.NATIVE;
    const user = {
      provider,
      email,
      password: hashSync(password, salt),
      name,
      login_at: new Date(),
    };
    const [result] = await connection.query('INSERT INTO user SET ?', user);
    await connection.query('COMMIT');

    const userInfo = {
      userId: result.insertId,
      provider,
      email,
      name,
    };
    return userInfo;
  } catch (error) {
    await connection.query('ROLLBACK');
    if (error instanceof ErrorWithCode) {
      throw error;
    } else {
      console.error(error);
      throw new ErrorWithCode(500, 'Sorry, native sign-up is temporarily unavailable');
    }
  } finally {
    connection.release();
  }
}

async function nativeSignIn(email, password) {
  const connection = await pool.getConnection();
  try {
    await connection.query('START TRANSACTION');

    const [users] = await connection.query('SELECT * FROM user WHERE email = ?', [email]);
    if (users.length === 0) {
      await connection.query('COMMIT');
      throw new ErrorWithCode(401, 'Invalid email');
    }

    const user = users[0];
    if (!compareSync(password, user.password)) {
      await connection.query('COMMIT');
      throw new ErrorWithCode(401, 'Invalid password');
    }

    const loginAt = new Date();
    await connection.query('UPDATE user SET login_at = ? WHERE id = ?', [loginAt, user.id]);
    await connection.query('COMMIT');

    const userInfo = {
      userId: user.id,
      provider: user.provider,
      email: user.email,
      name: user.name,
    };
    return userInfo;
  } catch (error) {
    await connection.query('ROLLBACK');
    if (error instanceof ErrorWithCode) {
      throw error;
    } else {
      console.error(error);
      throw new ErrorWithCode(500, 'Sorry, native sign-in is temporarily unavailable');
    }
  } finally {
    connection.release();
  }
}

const facebookSignIn = async (id, name, email, accessToken, expire) => {
  const connection = await pool.getConnection();
  try {
    await connection.query('START TRANSACTION');

    const loginAt = new Date();
    const user = {
      provider: ProviderType.FACEBOOK,
      email,
      name,
      access_token: accessToken,
      access_expired: expire,
      login_at: loginAt,
    };

    const users = await connection.query('SELECT id FROM user WHERE email = ? AND provider = ? FOR UPDATE', [email, ProviderType.FACEBOOK]);
    let userId;
    if (users.length === 0) { // Insert new user
      const queryStr = 'INSERT INTO user SET ?';
      const result = await connection.query(queryStr, user);
      userId = result.insertId;
    } else { // Update existed user
      userId = users[0].id;
      const queryStr = 'UPDATE user SET access_token = ?, access_expired = ?, login_at = ?  WHERE id = ?';
      await connection.query(queryStr, [accessToken, expire, loginAt, userId]);
    }
    user.id = userId;

    await connection.query('COMMIT');

    return { accessToken, loginAt, user };
  } catch (error) {
    await connection.query('ROLLBACK');
    return { error };
  } finally {
    connection.release();
  }
};

const getUserProfile = async (userId) => {
  const results = await pool.query('SELECT * FROM user WHERE id = ?', userId);
  return {
    data: {
      id: results[0].id,
      provider: results[0].provider,
      name: results[0].name,
      email: results[0].email,
    },
  };
};

const getFacebookProfile = async function (accessToken) {
  try {
    const res = await axios(`https://graph.facebook.com/me?fields=id,name,email&access_token=${accessToken}`, {
      responseType: 'json',
    });
    return res.data;
  } catch (e) {
    console.log(e);
    return { error: 'Fail to get user\'s profile.' };
  }
};

const getAllPlaces = async (userId) => {
  const places = await pool.query('SELECT id, lat, lon, icon, google_maps_id AS googleMapsId, title, description FROM place WHERE user_id = ?', userId);
  return places;
};

const createPlace = async (userId, lat, lon, icon, googleMapsId, title, description) => {
  try {
    const place = {
      user_id: userId, lat, lon, icon, google_maps_id: googleMapsId, title, description,
    };
    const result = await pool.query('INSERT INTO place SET ?', place);
    return result.insertId;
  } catch (e) {
    console.log(e);
    return { error: 'Fail to create user\'s favorite place.' };
  }
};

const getPlace = async (userId, placeId) => {
  const place = await pool.query('SELECT * FROM place WHERE user_id = ? AND id = ?', [userId, placeId]);
  return place;
};

const updatePlace = async (userId, placeId, title, description) => {
  try {
    const result = await pool.query('UPDATE place SET title = ?, description = ? WHERE user_id = ? AND id = ?', [title, description, userId, placeId]);
    return result;
  } catch (e) {
    console.log(e);
    return { error: 'Fail to update user\'s favorite place.' };
  }
};

const deletePlace = async (userId, placeId) => {
  try {
    const result = await pool.query('DELETE FROM place WHERE user_id = ? AND id = ?', [userId, placeId]);
    return result;
  } catch (e) {
    console.log(e);
    return { error: 'Fail to delete user\'s favorite place.' };
  }
};

export default {
  signUp,
  nativeSignIn,
  facebookSignIn,
  getUserProfile,
  getFacebookProfile,
  getAllPlaces,
  createPlace,
  getPlace,
  updatePlace,
  deletePlace,
  ProviderType,
};
