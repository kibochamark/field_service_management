import jwt from 'jsonwebtoken';

const JWT_SECRET = 'your_jwt_secret_key';
const JWT_REFRESH_SECRET = 'your_refresh_jwt_secret_key';

export const generateAccessToken = (userId: string) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7h' }); // Access token expires in 7hours
};

export const generateRefreshToken = (userId: string) => {
  return jwt.sign({ userId }, JWT_REFRESH_SECRET, { expiresIn: '7d' }); // Refresh token expires in 7 days
};

export const verifyAccessToken = (token: string) => {
  return jwt.verify(token, JWT_SECRET);
};

export const verifyRefreshToken = (token: string) => {
  return jwt.verify(token, JWT_REFRESH_SECRET);
};
