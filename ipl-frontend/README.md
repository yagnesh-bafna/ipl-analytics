# IPL Solver - React Frontend

This directory contains the modern React/Tailwind/Framer-Motion frontend for the IPL Decision Analytics System.

## Getting Started

1. **Install Dependencies** (if not already done):
   ```bash
   npm install
   ```

2. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   *The frontend will run on [http://localhost:5173](http://localhost:5173).*
   *It is pre-configured to proxy API requests to the Flask backend running on port 5000.*

3. **Required**: Ensure your Flask backend is running:
   ```bash
   python app.py
   ```

## Key Technologies
- **React 18** (Vite)
- **Tailwind CSS v3** (Utility-first styling)
- **Framer Motion** (Pro-grade animations)
- **Lucide React** (Standard icons)
- **Lottie React** (Premium vector animations)
- **Recharts** (Data visualization)

## Features
- **Light/Dark Mode**: Persisted in local storage.
- **Role-based UI**: Dynamic sidebar for Users vs Admins.
- **Smart Squad Builder**: Global state management for drafting squads across pages.
- **Professional Aesthetics**: Indigo primary / Cyan secondary dual-tone palette.
