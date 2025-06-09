CodeHive
Ignite your coding potential.

Project Structure-
The CodeHive project is organized into a modular structure, separating the frontend, main backend, and AI/compiler services for clarity and scalability.

Code-Hive/
├── backend/
│   ├── compiler-ai-service/
│   │   ├── Dockerfile
│   │   ├── compilerController.js
│   │   ├── compilerRoutes.js
│   │   ├── geminiService.js
│   │   ├── index.js
│   │   ├── package.json
│   │   └── .env (runtime)
│   │
│   ├── main-backend/
│   │   ├── controllers/
│   │   ├── database/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── utils/
│   │   ├── Dockerfile
│   │   ├── index.js
│   │   ├── package.json
│   │   └── .env (runtime)
│   │
│   └── docker-compose.yml
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── Pages/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── context/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── (CSS/other files)
│   │
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── .env (runtime)
│
└── README.md

Detailed Project Description-

CodeHive is a comprehensive online judge platform meticulously built using the MERN stack (MongoDB, Express.js, React, Node.js), with Vite for a blazing-fast frontend development experience. It's designed to provide an interactive and intelligent environment for users to sharpen their coding skills and tackle algorithmic challenges.

The platform features robust user authentication with secure sign-up and login functionalities. Once authenticated, users gain access to a personalized dashboard showcasing their progress, including the number of problems submitted, a competitive leaderboard, and a history of their latest submissions. The core of CodeHive lies in its "Explore Problems" section, where a wide array of coding questions are presented. Users can select a problem to view its description on the left, while simultaneously writing their code in a versatile integrated code editor on the right. The editor supports five popular programming languages: JavaScript, Python, Java, C++, and C, along with a dedicated area for user input.

CodeHive provides instant feedback through its "Run" and "Submit" functionalities, where code is executed against test cases. A standout feature is its intelligent AI integration: for incorrect submissions, the AI provides detailed error explanations, helping users understand what went wrong. Users can also leverage the "Get AI Hint" button for personalized guidance, offering insights into their mistakes and suggestions for correction, fostering a deeper learning experience.

Technologies Used-

CodeHive is built upon a robust and modern technology stack, leveraging the power of MERN for a scalable and efficient online judge platform.

Frontend-

React: A declarative, component-based JavaScript library for building user interfaces.
Vite: A next-generation frontend tooling that provides a significantly faster development experience.
Tailwind CSS: A utility-first CSS framework for rapidly building custom designs.
Axios: A promise-based HTTP client for making API requests from the browser.

Backend (Main Service - main-backend)-

Node.js: A JavaScript runtime built on Chrome's V8 JavaScript engine.
Express.js: A fast, unopinionated, minimalist web framework for Node.js.
MongoDB: A NoSQL, document-oriented database for flexible data storage.
Mongoose: An elegant MongoDB object modeling for Node.js.
bcryptjs: For hashing passwords to secure user authentication.
JSON Web Token (jsonwebtoken): For secure user authentication and authorization.
Nodemailer: For sending emails (e.g., for user verification or password resets).
CORS: Middleware for enabling Cross-Origin Resource Sharing.
Dotenv: For loading environment variables from a .env file.
Express Async Handler: Simple middleware for handling exceptions in Express async routes.
Multer: Middleware for handling multipart/form-data, primarily for file uploads.
Axios: For making HTTP requests to the Compiler/AI Service.

Compiler & AI Service (compiler-ai-service)-

Node.js: Runtime environment.
Express.js: Web framework.
fs-extra: For extended file system operations (like managing temporary code files).
Supported Programming Languages:
JavaScript
Python
Java
C++
C
(The Dockerfile for this service indicates the presence of openjdk17, python3, gcc, g++, make, which are crucial for running these languages.)

External APIs-

Google Gemini API (@google/generative-ai): Utilized for generating intelligent hints and providing detailed error explanations.
Deployment & Orchestration

Vercel: For seamless frontend deployment and continuous integration.
AWS EC2: For hosting the backend services (Main Backend and Compiler/AI Service).
Docker: For containerizing both backend services, ensuring consistent environments.
Docker Compose: For orchestrating multi-container Docker applications (used for local setup or single-host deployment).
Alpine Linux: The lightweight base operating system for Docker images.

Key Features-

Secure User Authentication: Sign-up and Login functionalities.
Personalized Dashboard: Displaying user progress, problem submission count, and latest activity.
Interactive Problem Exploration: View coding questions with a dedicated problem description area.
Integrated Code Editor: A feature-rich editor for writing and testing code.
Multi-Language Support: Ability to write and submit code in JavaScript, Python, Java, C++, and C.
Real-time Code Execution: "Run" feature to test code against custom inputs.
Comprehensive Code Submission: "Submit" feature to evaluate code against predefined test cases.
AI-Powered Error Explanations: Receive intelligent explanations for compilation or runtime errors in submitted code.
AI-Powered Hint Generation: Get smart hints to guide users when they are stuck on a problem.
Dynamic Leaderboard: Track and compare user performance across the platform.
Submission History: Review past code submissions and their results.

Installation-

Prerequisites-
Ensure you have the following installed:

Node.js & npm
MongoDB (running instance)
Git
Docker & Docker Compose
Setup & Run
Clone Repository:
git clone https://github.com/Vaishnavi-1376/Code-Hive.git
cd Code-Hive

Environment Variables-
Create .env files in main-backend/ and compiler-ai-service/ with your respective API keys and credentials.

main-backend/.env: PORT, MONGO_URI, SECRET_KEY, EMAIL_USER, EMAIL_PASS, GEMINI_API_KEY, FRONTEND_VERCEL_URL
compiler-ai-service/.env: GEMINI_API_KEY, COMPILER_SERVICE_PORT
Install Dependencies & Start Services:

First, install dependencies for each part of the application. Navigate into each of the following directories (client/, main-backend/, compiler-ai-service/) and run npm install in each.

Then, from the root Code-Hive directory, start the backend services using Docker Compose:
docker-compose up --build -d
(This command will start both your main-backend and compiler-ai-service.)

Finally, in a new terminal window, navigate to the directory and start the frontend development server:
cd client && npm run dev

License
This project is licensed under the MIT License.

See the LICENSE file in the repository for more details.

Live Demo-
Explore the live application deployed on Vercel:
https://mycodehive.vercel.app