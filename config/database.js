const mongoose = require("mongoose");
require("dotenv").config();

exports.connect = () => {
  mongoose
    .connect(
      "mongodb://uujwwsxrjfkytb7bd543:i3j1d0xoAJFHeENHtmCX@n1-c2-mongodb-clevercloud-customers.services.clever-cloud.com:27017,n2-c2-mongodb-clevercloud-customers.services.clever-cloud.com:27017/biiqzfk1ch1nxek?replicaSet=rs0",
      {
        useUnifiedTopology: true,
        useNewUrlParser: true,
      }
    )
    .then(() => {
      console.log("Successfully connected to database");
    })
    .catch((error) => {
      console.log("database connection failed.");
      console.log(error);
      process.exit(1);
    });
};

