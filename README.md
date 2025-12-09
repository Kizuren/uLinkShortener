# µLinkShortener v2

This project is the code behind [u.kizuren.dev](https://u.kizuren.dev), a custom URL shortener. It uses Next.JS, MongoDB, and Docker for quick deployment.

## Prerequisites
- bun (optional, for development)
- Docker & Docker Compose

## Setup
1. Clone the repository
4. Define environment variables in the `.env` file (mongo connection string is not needed when using docker):
   ```
   MONGO_URI=mongodb://<username>:<password>@<host>:<port>/<database>
   MONGO_DB_NAME=<database>
   NEXTAUTH_SECRET=VERY_SECURE_SECRET
   NEXTAUTH_URL=http://localhost:3000
   ```

## Running Locally

### Without Docker

1. Install dependencies:
   ```
   bun i
   ```
2. Build and run:
   ```
   bun run build
   bun run start
   ```

### With Docker

   ```
   docker compose up -d
   docker compose up --build
   ```
The application will be available at http://localhost:3000

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.