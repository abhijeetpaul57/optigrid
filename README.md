# OptiGrid — Local Setup & Run Guide

Follow these steps to build and run the OptiGrid platform locally on your Windows machine.

## Prerequisites

1. **Node.js**: Ensure Node.js (v20+) is installed.
2. **C++ Compiler**: You need `g++` (MinGW) to compile the optimization engine.
3. **MongoDB Atlas**: Have your MongoDB connection string ready (e.g., `mongodb+srv://<user>:<password>@cluster...`).

---

## Step 1: Compile the C++ Engine

The core routing and simulation logic is written in C++ for maximum performance.

1. Open PowerShell and navigate to the project root:
   ```powershell
   cd c:\Users\ABHIJEET\Desktop\optigrid
   ```
2. Run the compilation command:
   ```powershell
   cd engine
   g++ -std=c++14 -O2 -Isrc -o build/optigrid_engine.exe src/main.cpp src/Graph.cpp src/Dijkstra.cpp src/Allocator.cpp src/Simulator.cpp
   ```
3. Verify the executable `optigrid_engine.exe` is created inside the `engine/build/` directory.

---

## Step 2: Configure and Start the Backend (Express)

The backend manages the database, serves the REST API, and controls the C++ engine.

1. Navigate to the server folder:
   ```powershell
   cd c:\Users\ABHIJEET\Desktop\optigrid\server
   ```
2. Create your local environment file by copying the template:
   ```powershell
   Copy-Item .env.example .env
   ```
3. **Important:** Open `server/.env` in your editor and paste your MongoDB connection string:
   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster...
   ```
4. Start the backend server:
   ```powershell
   node src/server.js
   ```
   *You should see "Connected to MongoDB" and "Server listening on port 3000" in the console.*

---

## Step 3: Start the Frontend (React / Vite)

The frontend provides the visual dashboard to interact with the simulations.

1. Open a **new** PowerShell window (keep the backend running in the other one).
2. Navigate to the client folder:
   ```powershell
   cd c:\Users\ABHIJEET\Desktop\optigrid\client
   ```
3. Start the Vite development server:
   ```powershell
   npm run dev
   ```

---

## Step 4: Use the Application

1. Open your web browser and go to: **http://localhost:5173**
2. You will see the OptiGrid dashboard layout.
3. To test the system end-to-end, you can trigger a simulation (once the UI components are fully implemented) and watch the React frontend talk to the Express backend, which in turn orchestrates the C++ engine.
