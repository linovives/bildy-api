import app from './app.js';
import dbConnect from './config/db.js';

dbConnect();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});