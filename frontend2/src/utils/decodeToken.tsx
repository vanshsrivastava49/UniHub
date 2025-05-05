// utils/decodeToken.js
export const decodeToken = (token: string) => {
  try {
    const payload = atob(token.split('.')[1]);
    return JSON.parse(payload);
  } catch (e) {
    return null;
  }
};
