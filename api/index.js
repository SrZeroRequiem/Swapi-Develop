import express from 'express';
import mysql2 from 'mysql2/promise';
import cors from 'cors';
import http from 'http';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Crear la conexión a la base de datos
const db = await mysql2.createConnection({
    host: process.env.HOST,
    user: process.env.USER,
    password: process.env.PASS,
    database: "swapi",
    multipleStatements: true // Habilita múltiples consultas si es necesario
});

try {
    await db.connect();
    console.log('Connected to database');
} catch (err) {
    console.error('Error connecting to database:', err);
    process.exit(1);
}

app.use(cors());
app.use(express.json());

// Middleware global para manejo de errores
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
});

// Función auxiliar para manejo de consultas SQL
const executeQuery = async (res, query, params = []) => {
    try {
        const [result] = await db.query(query, params);
        return res.status(200).json(result);
    } catch (err) {
        console.error('SQL error:', err);
        return res.status(500).json({ error: 'Database Error' });
    }
};

// Rutas API

// Planetas: Obtiene todos los planetas excepto aquellos cuyo nombre sea 'unknown'
app.get("/api/planets", (req, res) => {
    const query = 'SELECT * FROM planets WHERE NAME != ?';
    executeQuery(res, query, ['unknown']);
});

// Películas: Obtiene todas las películas
app.get("/api/films", (req, res) => {
    const query = 'SELECT * FROM films';
    executeQuery(res, query);
});

// Personas: Obtiene todas las personas
app.get("/api/people", (req, res) => {
    const query = 'SELECT * FROM people';
    executeQuery(res, query);
});

// Naves espaciales: Combina resultados de naves espaciales y transportes
app.get("/api/starships", async (req, res) => {
    try {
        const [starshipsResult] = await db.query('SELECT * FROM starships');
        const [transportResult] = await db.query('SELECT * FROM transport');

        // Optimizamos la combinación de resultados con un reduce
        const merged = transportResult.reduce((acc, transport) => {
            const handlerShip = starshipsResult.find(ship => ship.pk === transport.pk);
            if (handlerShip) {
                transport.pilots = handlerShip.pilots.map(pilot => Number(pilot));
                transport.MGLT = handlerShip.MGLT;
                transport.starship_class = handlerShip.starship_class;
                transport.hyperdrive_rating = handlerShip.hyperdrive_rating;
                acc.push(transport);
            }
            return acc;
        }, []);

        return res.status(200).json(merged);
    } catch (err) {
        console.error('Error querying starships or transport:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Middleware para rutas no encontradas
app.use((req, res) => {
    res.status(404).json({ error: 'Not Found' });
});

// Servidor HTTP
const httpServer = http.createServer(app);
httpServer.listen(3001, () => {
    console.log("Running HTTP on port 3001");
});

export default app;
