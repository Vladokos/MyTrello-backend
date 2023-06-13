const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(403).send("A token is required for authentication");
    }

    jwt.verify(token, process.env.TOKEN_KEY);
  } catch (error) {
    console.log(error);
    return res.status(401).send("Invalid Token");
  }
  return next();
};

module.exports = verifyToken;
