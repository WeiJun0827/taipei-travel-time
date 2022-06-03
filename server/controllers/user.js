import validator from 'validator';
import jwt from 'jsonwebtoken';

import User from '../models/user.js';

import { JWT_SECRET, TOKEN_EXPIRE } from '../config.js';
import ErrorWithCode from '../util/error.js';

const { ProviderType } = User;

export async function signUp(req, res) {
  const { name: inputName, email, password } = req.body;

  if (!inputName || !email || !password) {
    throw new ErrorWithCode(400, 'Name, email and password are required');
  }

  if (!validator.isEmail(email)) {
    throw new ErrorWithCode(400, 'Invalid email format');
  }

  const name = validator.escape(inputName);

  const userInfo = await User.signUp(name, email, password);

  const accessToken = jwt.sign(userInfo, JWT_SECRET, { expiresIn: TOKEN_EXPIRE });

  res.status(200).send({
    data: {
      accessToken,
    },
  });
}

export async function nativeSignIn(email, password) {
  if (!email || !password) {
    throw new ErrorWithCode(400, 'Email and password are required');
  }
  const userInfo = await User.nativeSignIn(email, password, TOKEN_EXPIRE);
  return userInfo;
}

export async function facebookSignIn(accessToken) {
  if (!accessToken) {
    throw new ErrorWithCode(400, 'Access token id required');
  }

  try {
    const profile = await User.getFacebookProfile(accessToken);
    const { id, name, email } = profile;

    if (!id || !name || !email) {
      throw new ErrorWithCode(403, 'Cannot get Facebook user info from token');
    }

    return await User.facebookSignIn(id, name, email, accessToken, TOKEN_EXPIRE);
  } catch (error) {
    return { error };
  }
}

export async function signIn(req, res) {
  const data = req.body;

  let userInfo;
  switch (data.provider) {
    case ProviderType.NATIVE:
      userInfo = await nativeSignIn(data.email, data.password);
      break;
    case ProviderType.FACEBOOK:
      userInfo = await facebookSignIn(data.access_token);
      break;
    default:
      throw new ErrorWithCode(400, 'Provider undefined');
  }

  const accessToken = jwt.sign(userInfo, JWT_SECRET, { expiresIn: TOKEN_EXPIRE });

  res.status(200).json({ accessToken });
}

export async function verifyToken(req, res, next) {
  let accessToken = req.get('Authorization');
  if (accessToken) {
    accessToken = accessToken.replace('Bearer ', '');
    const { userId } = jwt.verify(accessToken, JWT_SECRET);
    res.locals.userId = userId;
    next();
  } else {
    res.status(400).send({ error: 'Wrong Request: authorization is required.' });
  }
}

export async function getUserProfile(req, res) {
  const { userId } = res.locals;
  const profile = await User.getUserProfile(userId);
  res.status(200).send(profile);
}

export async function getAllPlaces(req, res) {
  const { userId } = res.locals;
  const places = await User.getAllPlaces(userId);
  res.status(200).send({ places });
}

export async function createPlace(req, res) {
  const {
    lat, lon, icon, googleMapsId, title, description,
  } = req.body;
  const { userId } = res.locals;
  const placeId = await User
    .createPlace(userId, lat, lon, icon, googleMapsId, title, description);
  res.status(200).send({ placeId });
}

export async function getPlace(req, res) {
  const placeId = Number(req.params.id);
  const { userId } = res.locals;
  const place = await User.getPlace(userId, placeId);
  res.status(200).send({ place });
}

export async function updatePlace(req, res) {
  const placeId = Number(req.params.id);
  const { title, description } = req.body;
  const { userId } = res.locals;
  const myList = await User.updatePlace(userId, placeId, title, description);
  res.status(200).send({ data: myList });
}

export async function deletePlace(req, res) {
  const placeId = Number(req.params.id);
  const { userId } = res.locals;
  const myList = await User.deletePlace(userId, placeId);
  res.status(200).send({ data: myList });
}
