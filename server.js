require('dotenv').config();
const app = require('./app');
const { connectDB, sequelize } = require('./src/config/database');

const PORT = process.env.PORT || 8080;

connectDB().then(async () => {
    // Sync models
    await sequelize.sync({ alter: true }); // Use { force: true } to drop and recreate tables
    console.log('Database synced');

    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}).catch((error) => {
    console.error('Failed to connect to database', error);
    process.exit(1);
});
