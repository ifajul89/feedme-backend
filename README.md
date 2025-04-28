# FeedMe Backend

FeedMe Backend is a RESTful API built using Node.js, Express, TypeScript, and MongoDB. This backend serves as the foundation for the FeedMe application, providing user authentication, file uploading, payment gateway integration (ShurjoPay), and other essential functionalities.

## Table of Contents

- [Installation](#installation)
- [Development](#development)
- [Building](#building)
- [Testing](#testing)
- [Linting](#linting)
- [Formatting](#formatting)
- [Dependencies](#dependencies)
- [License](#license)

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/ifajul89/feedme-backend.git
   ```

2. Navigate into the project directory:

   ```bash
   cd feedme-backend
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

## Development

For development, use the following command to run the server in development mode. This command uses `ts-node-dev` to automatically restart the server on code changes and to transpile TypeScript code.

```bash
npm run dev
```

This will start the server using `src/server.ts`.

## Building

To build the TypeScript files into JavaScript for production, use the following command:

```bash
npm run build
```

This will compile the TypeScript code to the `dist` directory.

## Testing

Currently, there are no tests specified in this project, but you can run the following to see the message:

```bash
npm run test
```

You should see:

```bash
Error: no test specified
```

## Linting

To lint the project files, run:

```bash
npm run lint
```

This will check for coding style issues based on the ESLint configuration.

To automatically fix linting issues, run:

```bash
npm run lint:fix
```

## Formatting

To format the project files using Prettier, run:

```bash
npm run format
```

This will format all `.js`, `.ts`, and `.json` files in the project, ignoring files listed in `.gitignore`.

## Dependencies

- **@types/cookie-parser**: TypeScript definitions for cookie-parser
- **@types/http-status**: TypeScript definitions for HTTP status codes
- **@types/multer**: TypeScript definitions for Multer (file upload middleware)
- **bcrypt**: Library for hashing passwords
- **cloudinary**: Cloud image and video management
- **cookie-parser**: Middleware for cookie parsing
- **cors**: CORS middleware for enabling cross-origin requests
- **dotenv**: Loads environment variables from a `.env` file
- **express**: Web framework for building REST APIs
- **http-status**: HTTP status codes
- **jsonwebtoken**: JSON Web Token library for authentication
- **mongodb**: MongoDB driver for Node.js
- **mongoose**: ODM for MongoDB and Node.js
- **multer**: Middleware for handling file uploads
- **nodemailer**: Email sending library
- **shurjopay**: Integration with ShurjoPay payment gateway
- **zod**: Schema validation library

### Development Dependencies

- **@eslint/js**: ESLint configuration
- **@types/bcrypt**: TypeScript definitions for bcrypt
- **@types/cors**: TypeScript definitions for CORS
- **@types/express**: TypeScript definitions for Express
- **@types/jsonwebtoken**: TypeScript definitions for jsonwebtoken
- **@types/node**: TypeScript definitions for Node.js
- **@types/nodemailer**: TypeScript definitions for nodemailer
- **eslint**: Linting utility for JavaScript/TypeScript
- **eslint-config-prettier**: Disables conflicting rules between ESLint and Prettier
- **globals**: Provides global variables for ESLint
- **prettier**: Code formatting tool
- **ts-node-dev**: Tool for running TypeScript with auto-reloading
- **typescript**: TypeScript compiler
- **typescript-eslint**: ESLint parser and plugin for TypeScript
