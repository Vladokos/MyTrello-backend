const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const dataUsersSchema = new Schema(
  {
    email: String,
    name: String,
    password: String,
    token: String,
    refreshToken: String,
    resetToken: String,
  },
  { versionKey: false }
);

module.exports = mongoose.model("DataUser", dataUsersSchema);