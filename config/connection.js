const Sequelize = require('sequelize');
const config = require('./config');

// Define your application URLs
const appUrl = 'https://companion-connect-2872c986be71.herokuapp.com';
const dashboardLink = `${appUrl}/dashboard`;
const accountSettingsLink = `${appUrl}/account-settings`;

let sequelize;

if (process.env.JAWSDB_URL) {
  sequelize = new Sequelize(process.env.JAWSDB_URL);
} else {
  const envConfig = config[process.env.NODE_ENV || "development"];
  sequelize = new Sequelize(envConfig.database, envConfig.username, envConfig.password, {
    host: envConfig.host,
    dialect: envConfig.dialect,
    port: 3306
  });
}

module.exports = sequelize;
