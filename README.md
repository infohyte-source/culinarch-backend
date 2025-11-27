# Culinarch Backend

Backend API for the Culinarch application built with Node.js and Express.

## Features

- Express.js framework
- Security middleware (Helmet)
- CORS enabled
- Request logging (Morgan)
- Environment variables support
- Health check endpoint

## Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Create `.env` file from `.env.example`
4. Start development server: `npm run dev`

## Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon

## API Endpoints

- `GET /` - Welcome message
- `GET /health` - Health check

## Environment Variables

- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 3001)