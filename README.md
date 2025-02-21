# uLinkShortener

This project is the code behind [u.marcus7i.net](https://u.marcus7i.net), a custom URL shortener. It uses Flask, MongoDB, and Docker for quick deployment.

## Prerequisites
- Python
- MongoDB database (local or remote)
- Docker & Docker Compose (optional, for containerized deployments)

## Setup
1. Clone the repository
2. Create a virtual environment (optional):
   ```
   python -m venv env
   source env/bin/activate  # Linux/Mac
   env\Scripts\activate     # Windows
   ```
3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```
4. Define environment variables in the `.env` file:
   ```
   MONGO_URI=mongodb://<username>:<password>@<host>:<port>/<database>
   ```

## Running Locally
1. Start MongoDB
2. Run:
   ```
   python server.py
   ```
3. Access the app at http://localhost:5000

## Docker Deployment
1. Build and run containers:
   ```
   docker-compose up --build
   ```
2. The application will be available at http://localhost:5000

## Using GHCR

Pull the prebuilt image:
   ```bash
   docker pull ghcr.io/MarcUs7i/ulinkshortener:latest
   ```