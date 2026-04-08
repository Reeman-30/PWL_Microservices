require("dotenv").config();

module.exports = {
  development: {
    username: process.env.EXPRESS_DB_USERNAME,
    password: process.env.EXPRESS_DB_PASSWORD,
    database: process.env.EXPRESS_DB_NAME,
    host: process.env.EXPRESS_DB_HOST,
    dialect: "mysql",
    port: process.env.EXPRESS_DB_PORT,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  },
  test: {
    username: process.env.EXPRESS_DB_USERNAME,
    password: process.env.EXPRESS_DB_PASSWORD,
    database: process.env.EXPRESS_DB_NAME,
    host: process.env.EXPRESS_DB_HOST,
    dialect: "mysql",
    port: process.env.EXPRESS_DB_PORT,
  },
  production: {
    username: process.env.EXPRESS_DB_USERNAME,
    password: process.env.EXPRESS_DB_PASSWORD,
    database: process.env.EXPRESS_DB_NAME,
    host: process.env.EXPRESS_DB_HOST,
    dialect: "mysql",
    port: process.env.EXPRESS_DB_PORT,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  },
};
