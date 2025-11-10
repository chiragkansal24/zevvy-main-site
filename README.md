# Zevvy Main Site

## Overview
Zevvy is a web application designed to help users find electric vehicle (EV) charging stations, plan trips, and manage their vehicle profiles. The application consists of a client-side interface and a server-side API.

## Project Structure
The project is organized into two main directories: `client` and `server`.

### Client
- **index.html**: The main HTML document for the client-side application.
- **script.js**: JavaScript code for handling user interactions and API calls.
- **styles.css**: CSS styles for the visual appearance of the application.
- **assets**: Contains images and icons used in the application.

### Server
- **server.js**: Entry point for the server-side application, setting up the Express server.
- **config/db.js**: Database configuration and connection logic.
- **models**: Contains the data models for users, charging stations, and reviews.
- **routes**: Defines the API routes for user operations, charging stations, geocoding, and reviews.
- **middleware/auth.js**: Authentication middleware to protect certain routes.

## Setup Instructions

### Prerequisites
- Node.js and npm installed on your machine.
- A MongoDB database (or any other database you choose) for storing user and charging station data.

### Installation
1. Clone the repository:
   ```
   git clone <repository-url>
   cd zevvy-main-site
   ```

2. Install dependencies for the server:
   ```
   cd server
   npm install
   ```

3. Install dependencies for the client:
   ```
   cd ../client
   npm install
   ```

4. Set up environment variables:
   - Create a `.env` file in the root directory and add your database connection string and any other necessary API keys.

### Running the Application
1. Start the server:
   ```
   cd server
   node server.js
   ```

2. Open the client application in your browser:
   - You can open `client/index.html` directly or set up a local server for better performance.

## Usage
- Users can register and log in to manage their vehicle profiles.
- The application allows users to find nearby charging stations and plan trips based on their vehicle's specifications.
- Users can leave reviews for charging stations they visit.

## Deployment
The application can be deployed on platforms like Vercel or Netlify. Configuration files for both platforms are included in the project.

## Contributing
Contributions are welcome! Please submit a pull request or open an issue for any suggestions or improvements.

## License
This project is licensed under the MIT License. See the LICENSE file for more details.