// imports here for express and pg
require('dotenv').config()
const pg = require('pg');
const express = require('express');
const client = new pg.Client(
    process.env.DATABASE_URL || 'postgres://localhost/acme_hr_directory'
);
const app = express()

// app routes here
    app.get('/api/employees', async (req, res, next) => {
        try {
            let SQL = /* sql */ `SELECT * from employees`;
            const response = await client.query(SQL);
            res.send(response.rows);
        } catch (error) {
            next(error)
        }
    })

    app.get('/api/departments', async (req, res, next) => {
        try {
            let SQL = /* sql */ `SELECT * from departments`;
            const response = await client.query(SQL);
            res.send(response.rows);
        } catch (error) {
            next(error)
        }
    })

    app.post('/api/employees', async (req, res, next) => {
        try {
            const SQL = /* sql */ `INSERT INTO employees(txt, category_id) VALUES($1, $2) RETURNING *`
            console.log('req.body = ', req.body);
            const response = await client.query(SQL, [req.body.txt, req.body.category_id]);
            res.send(response.rows[0]);
        } catch (error) {
            next(error)
        }
    })

    app.put('/api/employees/:id', async (req, res, next) => {
        try {
            const SQL = /* sql */ `UPDATE employees SET txt=$1, ranking=$2, updated_at= now() WHERE id=$3`
            const response = await client.query(SQL, [
                req.body.txt,
                req.body.ranking,
                req.params.id,
            ]);
            res.send(response.rows[0]);
        } catch (error) {
            next(error)
        }
    })

    app.delete('/api/employees/:id', async(req, res, next) => {
        try {
            const SQL = /* sql */ `DELETE from notes WHERE id = $1`
            const response = await client.query(SQL, [req.params.id]);
            res.sendStatus(204);
        } catch (error) {
            next(error)
        }
    });

// create your init function
const init = async () => {
    await client.connect()
    console.log('connected to database');
    let SQL = /* sql */ `
    DROP TABLE IF EXISTS notes;
    DROP TABLE IF EXISTS categories;

    CREATE TABLE categories(
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL
    );
    CREATE TABLE notes(
        id SERIAL PRIMARY KEY,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now(),
        ranking INTEGER DEFAULT 3 NOT NULL,
        txt VARCHAR(50),
        category_id INTEGER REFERENCES categories(id) NOT NULL
    )
    `;
    await client.query(SQL);
    console.log('table category')
    
        SQL = /* sql */ `
            INSERT INTO categories(name) VALUES('Departments');
            INSERT INTO categories(name) VALUES('Employees');
            INSERT INTO notes(txt, ranking, category_id) VALUES('Finance', 1,
            (SELECT id from categories WHERE name = 'Departments'));
            INSERT INTO notes(txt, ranking, category_id) VALUES('Tyler', 2,
            (SELECT id from categories WHERE name = 'Employees'));
        `;
    
    await client.query(SQL);
    console.log('tables created')
    const port = process.env.PORT || 3000;
    app.listen(port, () => console.log(`listening on port ${port}`));
};
    app.use((err, req, res, next) => {
        res.status(500).send(err.message);
    })
// init function invocation
init();