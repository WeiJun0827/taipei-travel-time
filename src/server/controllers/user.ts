import axios from 'axios';
import jwt, { JwtPayload } from 'jsonwebtoken';
import validator from 'validator';

import * as User from '../models/user';

import { JWT_SECRET, TOKEN_EXPIRE } from '../config';
import ErrorWithStatusCode from '../util/error';

const { ProviderType } = User;

export async function signUp(req, res) {
  const { name: inputName, email, password } = req.body;

  if (!inputName || !email || !password) {
    throw new ErrorWithStatusCode(400, 'Name, email and password are required');
  }

  if (!validator.isEmail(email)) {
    throw new ErrorWithStatusCode(400, 'Invalid email format');
  }

  const name = validator.escape(inputName);

  const userInfo = await User.signUp(name, email, password);

  const accessToken = jwt.sign(userInfo as Object, JWT_SECRET, { expiresIn: TOKEN_EXPIRE });

  res.status(200).json({ accessToken });
}

export async function signIn(req, res) {
  const data = req.body;

  let userInfo;
  switch (data.provider) {
    case ProviderType.NATIVE:
      userInfo = await nativeSignIn(data.email, data.password);
      break;
    case ProviderType.FACEBOOK:
      userInfo = await facebookSignIn(data.accessToken);
      break;
    default:
      throw new ErrorWithStatusCode(400, 'Provider undefined');
  }

  const accessToken = jwt.sign(userInfo, JWT_SECRET, { expiresIn: TOKEN_EXPIRE });

  res.status(200).json({ accessToken });
}

async function nativeSignIn(email, password) {
  if (!email || !password) {
    throw new ErrorWithStatusCode(400, 'Email and password are required');
  }
  const userInfo = await User.nativeSignIn(email, password);
  return userInfo;
}

async function facebookSignIn(accessToken) {
  if (!accessToken) {
    throw new ErrorWithStatusCode(400, 'Access token is required');
  }

  const { data } = await axios(`https://graph.facebook.com/me?fields=id,name,email&access_token=${accessToken}`);
  const { name, email } = data;

  if (!name || !email) {
    throw new ErrorWithStatusCode(403, 'Cannot get Facebook user info from token');
  }

  const userInfo = await User.facebookSignIn(name, email);
  return userInfo;
}

export async function verifyToken(req, res, next) {
  let accessToken = req.get('Authorization');
  if (!accessToken) {
    throw new ErrorWithStatusCode(400);
  }
  accessToken = accessToken.replace('Bearer ', '');
  const { userId } = jwt.verify(accessToken, JWT_SECRET) as JwtPayload;
  res.locals.userId = userId;
  next();
}

export async function getUserProfile(req, res) {
  const { userId } = res.locals;
  const profile = await User.getUserProfile(userId);
  res.status(200).json(profile);
}

export async function getAllPlaces(req, res) {
  const { userId } = res.locals;
  const places = await User.getAllPlaces(userId);
  res.status(200).json(places);
}

export async function createPlace(req, res) {
  const {
    lat, lon, icon, googleMapsId, title, description,
  } = req.body;

  if (!lat || !lon || !googleMapsId) {
    throw new ErrorWithStatusCode(400, 'lat, lon, and googleMapsId are required');
  }

  const { userId } = res.locals;
  const placeInfo = await User.createPlace({
    userId, lat, lon, icon, googleMapsId, title, description,
  });
  res.json(placeInfo);
}

export async function updatePlace(req, res) {
  const id = Number.parseInt(req.params.id, 10);

  if (!Number.isInteger(id)) {
    throw new ErrorWithStatusCode(400, 'Cannot parse place id');
  }
  const { title, description } = req.body;
  const { userId } = res.locals;
  await User.updatePlace({
    userId, id, title, description,
  });
  res.sendStatus(200);
}

export async function deletePlace(req, res) {
  const id = Number.parseInt(req.params.id, 10);

  if (!Number.isInteger(id)) {
    throw new ErrorWithStatusCode(400, 'Cannot parse place id');
  }

  const { userId } = res.locals;
  await User.deletePlace(userId, id);
  res.sendStatus(200);
}
