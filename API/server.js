const express = require('express');
const { initializeFirebaseApp } = require("./src/services/variable.service.js");
const path = require('path');
const variableRoute = require('./src/routes/variable.route.js');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT;

// Initializing Firebase app at the start
initializeFirebaseApp();

app.use(cors());
app.use(express.json());
app.use("/variables", variableRoute);


app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
