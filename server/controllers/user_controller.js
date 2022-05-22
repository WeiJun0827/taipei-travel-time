import validator from 'validator';

import User from '../models/user_model.js';

import { TOKEN_EXPIRE } from '../config.js';

const { ProviderType } = User;

export async function signUp(req, res) {
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

  const result = await User.signUp(name, email, password, TOKEN_EXPIRE);
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
      access_expired: TOKEN_EXPIRE,
      login_at: loginAt,
      user: {
        id: user.id,
        provider: user.provider,
        name: user.name,
        email: user.email,
      },
    },
  });
}

export async function nativeSignIn(email, password) {
  if (!email || !password) {
    return { error: 'Request Error: email and password are required.', status: 400 };
  }

  try {
    return await User.nativeSignIn(email, password, TOKEN_EXPIRE);
  } catch (error) {
    return { error };
  }
}

export async function facebookSignIn(accessToken) {
  if (!accessToken) {
    return { error: 'Request Error: access token is required.', status: 400 };
  }

  try {
    const profile = await User.getFacebookProfile(accessToken);
    const { id, name, email } = profile;

    if (!id || !name || !email) {
      return { error: 'Permissions Error: facebook access token can not get user id, name or email' };
    }

    return await User.facebookSignIn(id, name, email, accessToken, TOKEN_EXPIRE);
  } catch (error) {
    return { error };
  }
}

export async function signIn(req, res) {
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
    const statusCode = result.status ? result.status : 403;
    res.status(statusCode).send({ error: result.error });
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
      access_expired: TOKEN_EXPIRE,
      login_at: loginAt,
      user: {
        id: user.id,
        provider: user.provider,
        name: user.name,
        email: user.email,
      },
    },
  });
}

export async function verifyToken(req, res, next) {
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
  }
}

export async function getUserProfile(req, res) {
  const profile = await User.getUserProfile(req.userId);
  res.status(200).send(profile);
}

export async function getAllPlaces(req, res) {
  const places = await User.getAllPlaces(req.userId);
  res.status(200).send({ places });
}

export async function createPlace(req, res) {
  const {
    lat, lon, icon, googleMapsId, title, description,
  } = req.body;
  const placeId = await User
    .createPlace(req.userId, lat, lon, icon, googleMapsId, title, description);
  res.status(200).send({ placeId });
}

export async function getPlace(req, res) {
  const placeId = Number(req.params.id);
  const place = await User.getPlace(req.userId, placeId);
  res.status(200).send({ place });
}

export async function updatePlace(req, res) {
  const placeId = Number(req.params.id);
  const { title, description } = req.body;
  const myList = await User.updatePlace(req.userId, placeId, title, description);
  res.status(200).send({ data: myList });
}

export async function deletePlace(req, res) {
  const placeId = Number(req.params.id);
  const myList = await User.deletePlace(req.userId, placeId);
  res.status(200).send({ data: myList });
}
