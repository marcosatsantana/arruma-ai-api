module.exports = {
  jwt: {
      secret: process.env.SECRET_JWT,
      expiresIn: "5d"
  }
}