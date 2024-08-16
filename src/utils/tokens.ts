import jwt from 'jsonwebtoken';

const JWT_SECRET = 'your_jwt_secret_key';
const JWT_REFRESH_SECRET = 'your_refresh_jwt_secret_key';

export const generateAccessToken = (userId: string) => {
  console.log(userId, "userid")
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '15m' }); // Access token expires in 15 minutes
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
