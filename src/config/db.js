import mongoose from 'mongoose';

const dbConnect = async () => {
  try {
    const mongoURL = process.env.MONGO_URL;

    if (!mongoURL) {
      throw new Error('MONGO_URL no está definida en el archivo .env');
    }

    const conn = await mongoose.connect(mongoURL);

    console.log(`MongoDB Conectado: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error de conexión a la BD: ${error.message}`);
    process.exit(1);
  }
};

export default dbConnect;