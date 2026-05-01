const getOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 15 * 60 * 1000, // 15 minutes
});

export const cookies = {
  getOptions,
  set: (res, name, value, options = {}) => {
    res.cookie(name, value, { ...getOptions(), ...options });
  },
  clear: (res, name, options = {}) => {
    res.clearCookie(name, { ...getOptions(), ...options });
  },

  get: (req, name) => {
    return req.cookies[name];
  },
};
