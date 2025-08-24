const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDb = require('./config/connectDb')
require('dotenv').config();

const authRoutes = require('./routes/auth');
const leadRoutes = require('./routes/leads');
const { authenticationToken } = require('./middleware/auth');

const app = express();


const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'To many request from this IP, please try again later...'
});

const corsOptions = {
    origin: [
        "http://localhost:3000",    
        "https://erinolms.vercel.app",
        "https://erino-lms-production.up.railway.app"
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    exposedHeaders: ['set-cookie'],
    optionsSuccessStatus: 200,
    preflightContinue: false
};
app.use(helmet());
app.use(cors(corsOptions));
app.use(limiter);

//Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Log all incoming requests
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path} - Headers:`, req.headers);
    next();
});

//connect to the database
connectDb();

//Routes
app.use('/api/auth', authRoutes);
app.use('/api/leads', authenticationToken, leadRoutes);

app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() })
});

//Error handling
app.use((err, req, res, next) => {
    console.log(err.stack);
    res.status(err.status || 500).json({
        message: err.message || 'Internal Server Error',

    })
})

app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
})

