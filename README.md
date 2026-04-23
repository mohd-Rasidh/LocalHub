# LocalHub - Real-Time Service Booking Platform

LocalHub is a modern, full-stack web application designed to connect users with trusted local service providers (electricians, plumbers, cleaners, etc.). It features a sleek glassmorphic UI, real-time database synchronization, secure payments, and Google authentication.

## ✨ Features
* **Modern UI/UX:** A stunning dark-themed interface built with Vanilla CSS, featuring 3D hover effects, micro-animations, and responsive design.
* **Real-Time Data Sync:** Powered by Firebase Firestore. Any changes made to provider profiles or pricing are instantly reflected across all connected clients without reloading the page.
* **Secure Payments:** Integrated with Stripe Checkout for seamless and secure payment processing.
* **Google Authentication:** Users can instantly sign in using their Google accounts via Firebase Auth.
* **Lightning Fast:** Built on top of Vite for instant hot module replacement (HMR) and optimized production builds.

## 🛠️ Technology Stack
* **Frontend:** HTML5, Vanilla JavaScript, Vanilla CSS, Vite
* **Backend:** Node.js, Express.js
* **Database & Auth:** Firebase (Firestore & Firebase Auth)
* **Payment Gateway:** Stripe API

## 🚀 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### 1. Installation
Clone the repository and install the dependencies:
```bash
# Install frontend dependencies
npm install

# Navigate to backend folder (if applicable) or install backend dependencies
npm install express cors stripe
```

### 2. Firebase Configuration
1. Go to the [Firebase Console](https://console.firebase.google.com/) and create a project.
2. Enable **Firestore Database** (Start in Test Mode).
3. Enable **Authentication** and turn on the **Google** sign-in provider.
4. Register a Web App and copy your Firebase SDK config keys.
5. Open `firebase.js` in the root directory and replace the placeholder `firebaseConfig` object with your actual keys.

### 3. Stripe Configuration
1. Go to the [Stripe Dashboard](https://dashboard.stripe.com/) and toggle **Test mode** on.
2. Navigate to **Developers > API keys**.
3. Copy your **Secret key** (`sk_test_...`).
4. Open `server.js` and paste your key on line 3:
   ```javascript
   const stripe = require('stripe')('YOUR_STRIPE_SECRET_KEY');
   ```

### 4. Running the Application
You will need two terminal windows to run both the frontend and the backend simultaneously.

**Terminal 1 (Backend Server):**
```bash
node server.js
```
*The backend server will start on `http://localhost:3000`.*

**Terminal 2 (Frontend Vite Server):**
```bash
npx vite
```
*The Vite development server will start on `http://localhost:5173`.*

Open your browser and navigate to `http://localhost:5173`. If your Firestore database is empty, the app will automatically seed the initial provider data for you!

## 📝 License
This project is for educational and portfolio purposes.

---
*Built with ❤️ using Vite, Firebase, and Stripe.*
