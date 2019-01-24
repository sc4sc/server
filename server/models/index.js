'use strict';


const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');

const result = require('dotenv').config(__dirname + '.env');
if (result.error) throw result.error

const config_associate = require('./config');
const basename = path.basename(__filename);

const env = result.parsed.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.json')[env];
const db = {};
let sequelize;

if (config.use_env_variable) {
  sequelize = new Sequelize(result.parsed.POSTGRES_URL, config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file !== 'config.js') && (file !== 'caver.js') && (file.slice(-3) === '.js');
  })
  .forEach(file => {
    const model = sequelize['import'](path.join(__dirname, file));
    db[model.name] = model;
  });

config_associate.initAssociations(db);

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
