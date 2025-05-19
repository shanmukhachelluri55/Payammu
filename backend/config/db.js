const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
dotenv.config();

const sequelize = new Sequelize({
  host: process.env.DB_HOST,
  dialect: 'postgres',
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});

sequelize.authenticate()
  .then(async () => {
    console.log('Database connected!');
    try {
      const [results] = await sequelize.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'payload'
        );`
      );

      if (results[0].exists) {
        console.log('Table "payload" exists!');
      } else {
        console.log('Table "payload" does not exist.');
      }
    } catch (queryErr) {
      console.error('Error while checking table existence:', queryErr);
    }
  })
  .catch(err => console.error('Unable to connect to the database:', err));

module.exports = sequelize;
