// config/db.js
import { Sequelize } from 'sequelize';
import configData from './config.json' with { type: 'json' };

const env = process.env.NODE_ENV || 'development';
const config = configData[env];

// Создаем экземпляр Sequelize с параметрами для SQLite
const sequelize = new Sequelize({
  storage: config.storage,
  dialect: config.dialect,
});

// Экспортируем экземпляр Sequelize
export default sequelize;
