import { hashSync, compareSync } from 'bcrypt';

import ErrorWithCode from '../util/error.js';
import { pool } from './mysql.js';

const salt = parseInt(process.env.BCRYPT_SALT, 10);
const ProviderType = {
  NATIVE: 'native',
  FACEBOOK: 'facebook',
  GOOGLE: 'google',
};

export async function signUp(name, email, password) {
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

    return { userId: result.insertId };
  } catch (error) {
    await connection.query('ROLLBACK');
    handleError(error, 'Sorry, native sign-up is temporarily unavailable');
    return false;
  } finally {
    connection.release();
  }
}

export async function nativeSignIn(email, password) {
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

    return { userId: user.id };
  } catch (error) {
    await connection.query('ROLLBACK');
    handleError(error, 'Sorry, native sign-in is temporarily unavailable');
    return false;
  } finally {
    connection.release();
  }
}

export async function facebookSignIn(name, email) {
  const connection = await pool.getConnection();
  try {
    await connection.query('START TRANSACTION');

    const provider = ProviderType.FACEBOOK;
    const loginAt = new Date();
    const user = {
      provider,
      email,
      name,
      login_at: loginAt,
    };

    const [users] = await connection.query('SELECT id FROM user WHERE email = ? AND provider = ? FOR UPDATE', [email, provider]);
    let userId;
    if (users.length === 0) { // Insert new user
      const [result] = await connection.query('INSERT INTO user SET ?', user);
      userId = result.insertId;
    } else { // Update existed user
      userId = users[0].id;
      await connection.query('UPDATE user SET login_at = ?  WHERE id = ?', [loginAt, userId]);
    }
    await connection.query('COMMIT');

    return { userId };
  } catch (error) {
    await connection.query('ROLLBACK');
    handleError(error, 'Sorry, sign-in with Facebook is temporarily unavailable');
    return false;
  } finally {
    connection.release();
  }
}

function handleError(error, message) {
  if (error instanceof ErrorWithCode) {
    throw error;
  } else {
    console.error(error);
    throw new ErrorWithCode(500, message);
  }
}

export async function getUserProfile(userId) {
  const [[user]] = await pool.query('SELECT * FROM user WHERE id = ?', userId);
  return {
    name: user.name,
  };
}

export async function getAllPlaces(userId) {
  const [places] = await pool.query('SELECT id, lat, lon, icon, google_maps_id AS googleMapsId, title, description FROM place WHERE user_id = ?', userId);
  return places;
}

export async function createPlace({
  userId, lat, lon, icon, googleMapsId, title, description,
}) {
  const place = {
    user_id: userId,
    lat,
    lon,
    icon,
    google_maps_id: googleMapsId,
    title,
    description,
  };
  const [result] = await pool.query('INSERT INTO place SET ?', place);
  return { placeId: result.insertId };
}

export async function updatePlace({
  userId, id, title, description,
}) {
  await pool.query('UPDATE place SET title = ?, description = ? WHERE user_id = ? AND id = ?', [title, description, userId, id]);
}

export async function deletePlace(userId, id) {
  await pool.query('DELETE FROM place WHERE user_id = ? AND id = ?', [userId, id]);
}
