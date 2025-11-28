const express = require('express')
const cors = require('cors');
const dotenv = require('dotenv');
const contactRoutes = require('./routes/contactRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5173'], // React default ports
    credentials: true
}));

// Middleware
app.use(express.json());
app.use(cors());


//app.use('/contact', contactRoutes);
// Basic route
app.get('/', (req, res) => {
    res.json({ message: 'Contact Form Backend is running!' });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        port: PORT
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Test the API: http://localhost:${PORT}/api/contact`);
});