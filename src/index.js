import app from './app.js';
import mongoose from 'mongoose';
import dbConnect from './config/db.js';

dbConnect();

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});

const shutdown = async (signal) => {
  console.log(`${signal} recibido. Cerrando servidor...`);
  server.close(async () => {
    await mongoose.disconnect();
    console.log('Conexiones cerradas. Proceso terminado.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
