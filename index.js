const express = require('express');
const fs = require('fs');
const mysql2 = require('mysql2');
const cors = require('cors');
const http = require('http');
const https = require('https');
const app = express();
const privateKey = fs.readFileSync('private.key', 'utf8');
const certificate = fs.readFileSync('certificate.crt');

const credentials = { key: privateKey, cert: certificate };
require('dotenv').config();

const db = mysql2.createConnection({
    host: "swapi.ch6626048hob.eu-north-1.rds.amazonaws.com",
    user: "root",
    password: "admin123",
    database: "swapi"
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        process.exit(1);
    }
    console.log('Connected to database');
});

app.use(cors());
app.use(express.json());

app.get("/api/planets", (req, res) => {
    db.query('SELECT * FROM planets WHERE NAME != ?', ('unknown'), (err, result) => {
        if (err) {
            console.error('Error querying planets:', err);
            res.status(500).json({ error: 'Internal Server Error' });
        } else {
            res.status(200).json(result);
        }
    });
});

app.get("/api/films", (req, res) => {
    db.query('SELECT * FROM films', (err, result) => {
        if (err) {
            console.error('Error querying films:', err);
            res.status(500).json({ error: 'Internal Server Error' });
        } else {
            res.status(200).json(result);
        }
    });
});

app.get("/api/people", (req, res) => {
    db.query('SELECT * FROM people', (err, result) => {
        if (err) {
            console.error('Error querying people:', err);
            res.status(500).json({ error: 'Internal Server Error' });
        } else {
            res.status(200).json(result);
        }
    });
});

app.get("/api/starships", (req, res) => {
    db.query('SELECT * FROM starships', (err, starshipsResult) => {
        if (err) {
            console.error('Error querying starships:', err);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }

        db.query('SELECT * FROM transport', (err, transportResult) => {
            if (err) {
                console.error('Error querying transport:', err);
                res.status(500).json({ error: 'Internal Server Error' });
                return;
            }

            let merged = [];
            for (const transport of transportResult) {
                const handlerShip = starshipsResult.find((ship) => ship.pk === Number(transport.pk));
                if (handlerShip) {
                    let jsonPilots = handlerShip.pilots;
                    transport.pilots = jsonPilots.map((pilot) => Number(pilot));
                    transport.MGLT = handlerShip.MGLT;
                    transport.starship_class = handlerShip.starship_class;
                    transport.hyperdrive_rating = handlerShip.hyperdrive_rating;
                    merged.push(transport);
                }
            }
            res.status(200).json(merged);
        });
    });
});

const httpServer = http.createServer(app);
httpServer.listen(80, () => {
    console.log("Running HTTP on port 80");
});

const httpsServer = https.createServer(credentials, app);
httpsServer.listen(443, () => {
    console.log("Running HTTPS on port 443");
});

module.exports = app()