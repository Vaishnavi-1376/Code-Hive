# CodeHive

**Ignite your coding potential.**

---

## Project Structure

The CodeHive project is organized into a modular structure, separating the frontend, main backend, and AI/compiler services for clarity and scalability.

## Code-Hive/
├── backend/
│   ├── compiler-ai-service/
│   │   ├── Dockerfile
│   │   ├── compilerController.js
│   │   ├── compilerRoutes.js
│   │   ├── geminiService.js
│   │   ├── index.js
│   │   └── package.json
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


---

## Detailed Project Description

**CodeHive** is a comprehensive online judge platform built with the **MERN stack (MongoDB, Express.js, React, Node.js)** and **Vite**, designed to foster coding skills and problem-solving. It offers secure user authentication, a personalized dashboard, and an interactive code editor supporting five popular languages (JavaScript, Python, Java, C++, C). A key highlight is its **intelligent AI integration**, providing detailed error explanations and smart hints via the Google Gemini API, enhancing the learning experience through instant feedback and personalized guidance.

---

## Technologies Used

### Frontend
* React + Vite
* Tailwind CSS
* Axios

### Backend (Main Service)
* Node.js + Express.js
* MongoDB + Mongoose
* bcryptjs, jsonwebtoken, Nodemailer, CORS, Dotenv, Express Async Handler, Multer, Axios

### Compiler & AI Service
* Node.js + Express.js
* fs-extra
* Supported Languages: JavaScript, Python, Java, C++, C

### External APIs
* Google Gemini API (`@google/generative-ai`)

### Deployment & Orchestration
* Vercel (Frontend)
* AWS EC2 (Backend)
* Docker
* Docker Compose
* Alpine Linux

---

## Key Features

* Secure User Authentication: Sign-up and Login functionalities.
* Personalized Dashboard: Displaying user progress, problem submission count, and latest activity.
* Interactive Problem Exploration: View coding questions with a dedicated problem description area.
* Integrated Code Editor: A feature-rich editor for writing and testing code.
* Multi-Language Support: Ability to write and submit code in JavaScript, Python, Java, C++, and C.
* Real-time Code Execution: "Run" feature to test code against custom inputs.
* Comprehensive Code Submission: "Submit" feature to evaluate code against predefined test cases.
* AI-Powered Error Explanations: Receive intelligent explanations for compilation or runtime errors in submitted code.
* AI-Powered Hint Generation: Get smart hints to guide users when they are stuck on a problem.
* Dynamic Leaderboard: Track and compare user performance across the platform.
* Submission History: Review past code submissions and their results.

---

## Prerequisites

Ensure you have the following installed on your system:
* Node.js & npm
* MongoDB (running instance)
* Git
* Docker & Docker Compose

---

## Installation

Follow these steps to set up CodeHive locally on your machine:

### 1. Clone the Repository

```bash
git clone [https://github.com/Vaishnavi-1376/Code-Hive.git](https://github.com/Vaishnavi-1376/Code-Hive.git)
cd Code-Hive