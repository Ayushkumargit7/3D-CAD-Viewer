# 3D CAD Viewer Application

This is a 3D CAD viewer application built using React, Vite, and Three.js for frontend and Flask for backend. The application allows users to upload and view 3D models in OBJ and STL formats and export it in different format.

## Prerequisites

* Node.js (version 14 or higher)
* npm (version 6 or higher)
* Python (version 3.7 or higher) for the backend server

## Running the Application

### Frontend

1. Clone the repository and navigate to the `frontend` directory.
2. Install the dependencies by running `npm install`.
3. Start the development server by running `npm run dev`.

### Backend

1. Navigate to the `backend` directory.
2. Create virtual environment
   ```bash
   python -m venv venv

3. Activate virtual environment 
   ```bash
   For Windows
   venv\Scripts\activate
   OR for macOS/Linux
   source venv/bin/activate

5. Install required packages
   ```bash
   pip install flask flask-cors numpy trimesh
   
5. Start the Flask development server by running `python app.py`.

## Using the Application

1. Upload a 3D model in OBJ or STL format using the file uploader.
2. The model will be displayed in the 3D viewer.
3. Use the orbit controls to rotate, zoom, and pan the model.
4. Can export the model in a different format
