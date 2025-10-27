# BNMIT Club Connect

A web application built with React, TypeScript, and Shadcn UI to facilitate seamless club membership management for BNMIT University students. Users can discover and register for clubs with a convenient, no-login experience.

## ✨ Features

- 🚀 **Club Discovery:** Browse available clubs with details.
- 📝 **Online Registration:** Register for clubs directly through the portal.
- 🔗 **Payment Integration:** Supports UPI payment links and proof of payment uploads.
- 🖼️ **QR Code Integration:** Utilizes QR codes for easy access and registration.
- 🛡️ **Admin Panel:** Dedicated admin interfaces for club and root administrators.

## 🛠️ Tech Stack

| Category    | Technologies                               |
| ----------- | ------------------------------------------ |
| Frontend    | React, TypeScript, Vite, Shadcn UI, Tailwind CSS |
| State Management | Zustand                                     |
| Data Fetching | TanStack React Query                      |
| UI Components| Radix UI                                   |
| Utilities   | class-variance-authority, clsx, tailwind-merge, lucide-react |
| Backend     | Google Apps Script (for file uploads)       |
| Database    | Supabase (potential, not directly evident in provided files) |

## 📦 Installation & Setup

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

### Setup Instructions

1.  **Clone the repository:**

    ```sh
    git clone <YOUR_GIT_URL>
    ```

2.  **Navigate to the project directory:**

    ```sh
    cd <YOUR_PROJECT_NAME>
    ```

3.  **Install the dependencies:**

    ```sh
    npm install # or yarn install
    ```

4.  **Create `.env` file:**

    Copy the contents of `.env.example` to a new file named `.env` and fill in your Google API credentials:

    ```
    VITE_GOOGLE_CLIENT_ID="YOUR_CLIENT_ID"
    VITE_GOOGLE_API_KEY="AIzaSyCS2FESjH0V3pE1JBgptW_z7QGGXPekH5c"
    ```

5.  **Run the development server:**

    ```sh
    npm run dev # or yarn dev
    ```

    This will start the development server with hot reloading. Open your browser to view the application.

6.  **Build for production:**

    ```sh
    npm run build # or yarn build
    ```

    This command creates an optimized production build in the `dist` directory.

## 💻 Usage

1.  **Access the application:** Open your browser and navigate to the URL where the application is running (usually `http://localhost:5173` during development).
2.  **Browse Clubs:** View available clubs with their descriptions and logos.
3.  **Register for a Club:** Click on a club card to open the registration modal.
4.  **Fill in the Registration Form:** Enter your details such as name, USN, email, branch, year, and phone number.
5.  **Upload Payment Proof:** If the club requires payment, upload a screenshot of the payment transaction.
6.  **Submit the Form:** Click the submit button to register for the club.

Example of using the `ClubCard` component:

```tsx
<ClubCard
  id={1}
  name="Coding Club"
  description="A club for coding enthusiasts."
  logo_url="https://example.com/coding_club_logo.png"
  qr_url="https://example.com/coding_club_qr.png"
  payment_link="upi://pay?pa=example@upi&pn=Example%20Merchant"
  memberCount={50}
/>
```

## 🗂️ Project Structure

```
.
├── .env.example           # Example environment variables
├── .gitignore              # Specifies intentionally untracked files that Git should ignore
├── README.md               # Project documentation
├── components.json         # Configuration for Shadcn UI components
├── eslint.config.js        # ESLint configuration
├── index.html              # Main HTML entry point
├── package.json            # Project dependencies and scripts
├── postcss.config.js       # PostCSS configuration
├── public
│   └── robots.txt          # Robots exclusion protocol file
├── src
│   ├── App.tsx             # Main application component
│   ├── components
│   │   ├── ClubCard.tsx      # Club card component
│   │   ├── RegistrationModal.tsx # Registration modal component
│   │   └── ui              # Shadcn UI components
│   │       ├── accordion.tsx   # Accordion component
│   │       ├── alert-dialog.tsx # Alert dialog component
│   │       ├── alert.tsx       # Alert component
│   │       ├── aspect-ratio.tsx# Aspect ratio component
│   │       ├── avatar.tsx      # Avatar component
│   │       ├── badge.tsx       # Badge component
│   │       └── breadcrumb.tsx  # Breadcrumb component
│   └── main.tsx            # Entry point for React application
└── tailwind.config.js      # Tailwind CSS configuration
```


## 📸 Screenshot

<img width="800" height="480" alt="image" src="https://github.com/user-attachments/assets/e49f96bd-fc8b-4d2d-a265-e9f117c5973f" />


## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1.  Fork the repository.
2.  Create a new branch for your feature or bug fix.
3.  Make your changes and commit them with clear, descriptive messages.
4.  Submit a pull request.

## 📧 Contact

[Your Name/Organization]
[Your Email Address]


_This README was generated using [GitRead](https://git-read.vercel.app)_
