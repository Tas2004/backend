const http = require('http');
const express = require('express');
const app = express();
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const hostname = '127.0.0.1';
const fs = require('fs');
const port = 3000;

const { readFileSync } = require("fs");
var path = require("path");
let cer_part = path.join(process.cwd(), 'isrgrootx1.pem');

const connection = mysql.createConnection({
    host: 'gateway01.us-west-2.prod.aws.tidbcloud.com',
    user: '4JvQ5tR7TwF2TiQ.root',
    password: 'Khtzs46jfQXQVpDG',
    database: 'child_vaccination',
    port:4000,
    ssl:{
        ca:fs.readFileSync(cer_part)
    }
});


app.use(cors())
app.use(express.json())
app.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});

var urlencodedParser = bodyParser.urlencoded({ extended: false })

app.get('/', (req, res) => {
    res.json({
        "Name": "Vaccine Tracking System",
        "Author": "Wadeelada Tasneem",
        "APIs": [
            {"api_name": "/children/", "method": "get"},
            {"api_name": "/children/:id", "method": "get"},
            {"api_name": "/children/:id/vaccination-history", "method": "get"},
            {"api_name": "/vaccination-history", "method": "post"},
            {"api_name": "/vaccination-history/:id", "method": "put"},
            {"api_name": "/vaccination-history/:id", "method": "delete"}
        ]
    });
});

// ดึงข้อมูลเด็กทั้งหมด
app.get('/children/', (req, res) => {
    let sql = 'SELECT * FROM children';
    connection.query(sql, (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});

// ดึงข้อมูลเด็กคนเดียว
app.get('/children/:id', (req, res) => {
    let sql = 'SELECT * FROM children WHERE id_child = ?';
    connection.query(sql, [req.params.id], (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});

// ดึงประวัติการฉีดวัคซีนของเด็กแต่ละคน
app.get('/children/:id/vaccination-history', (req, res) => {
    let sql = `
        SELECT vh.id, vh.child_id, c.name_child, v.name AS vaccine_name, vh.date_administered, vh.next_due_date, vh.hospital 
        FROM vaccination_history vh
        JOIN children c ON vh.child_id = c.id_child
        JOIN vaccines v ON vh.vaccine_id = v.id
        WHERE vh.child_id = ?`;
    connection.query(sql, [req.params.id], (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});

// เพิ่มข้อมูลการฉีดวัคซีน
app.post('/vaccination-history', urlencodedParser, (req, res) => {
    let { child_id, vaccine_id, date_administered, next_due_date, next_vaccine_id, hospital } = req.body;
    let sql = 'INSERT INTO vaccination_history (child_id, vaccine_id, date_administered, next_due_date, next_vaccine_id, hospital) VALUES (?, ?, ?, ?, ?, ?)';
    let values = [child_id, vaccine_id, date_administered, next_due_date, next_vaccine_id, hospital];

    connection.query(sql, values, (err, results) => {
        if (err) throw err;
        res.json({ error: false, data: results, msg: "Inserted" });
    });
});

// แก้ไขข้อมูลการฉีดวัคซีน
app.put('/vaccination-history/:id', urlencodedParser, (req, res) => {
    let { child_id, vaccine_id, date_administered, next_due_date, next_vaccine_id, hospital } = req.body;
    let sql = 'UPDATE vaccination_history SET child_id=?, vaccine_id=?, date_administered=?, next_due_date=?, next_vaccine_id=?, hospital=? WHERE id=?';
    let values = [child_id, vaccine_id, date_administered, next_due_date, next_vaccine_id, hospital, req.params.id];

    connection.query(sql, values, (err, results) => {
        if (err) throw err;
        res.json({ error: false, data: results, msg: "Updated" });
    });
});

// ลบข้อมูลการฉีดวัคซีน
app.delete('/vaccination-history/:id', urlencodedParser, (req, res) => {
    let sql = 'DELETE FROM vaccination_history WHERE id = ?';
    connection.query(sql, [req.params.id], (err, results) => {
        if (err) throw err;
        res.json({ error: false, data: results, msg: "Deleted" });
    });
});