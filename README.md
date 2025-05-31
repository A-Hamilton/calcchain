# CalcChain - Grid Trading Profit Estimator

**CalcChain** is a web application designed to help cryptocurrency traders estimate potential profits from grid trading strategies. Users can input various parameters such as trading pair, principal investment, price range, grid count, leverage, and fees to receive detailed projections on daily profit, trade frequency, and overall performance. The application also offers an optimization feature to suggest grid parameters based on recent market volatility (ATR).

Built with React, TypeScript, Vite, and Material-UI.

## ✨ Features

* **Grid Parameter Input:** Comprehensive form to input all necessary details for a grid trading strategy.
* **Dynamic Calculation:** Real-time calculation of estimated profits, trades per day, profit per grid, and more.
* **ATR-Based Optimization:** Suggests optimal grid parameters (lower bound, upper bound, grid count) based on the selected symbol's Average True Range (ATR).
* **Detailed Results Display:** Clear and organized presentation of key metrics, profit estimates, and breakdowns.
* **Advanced Settings:** Options for geometric/arithmetic grids and long/short/neutral entry types.
* **Responsive Design:** User-friendly interface adaptable to various screen sizes.
* **Dark Theme:** Sleek and modern dark mode UI.
* **Informational Insights:** Contextual information about grid trading strategies and risks.

## 🛠️ Tech Stack

* **Frontend:** React, TypeScript
* **Build Tool:** Vite
* **UI Library:** Material-UI (MUI)
* **HTTP Client:** Axios (for fetching crypto market data from Binance API)
* **Animations:** Framer Motion
* **Styling:** MUI `sx` prop, `styled-components` (via MUI), custom theme

## 🚀 Getting Started

### Prerequisites

* Node.js (v18.x or later recommended)
* npm or yarn

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/a-hamilton/calcchain.git](https://github.com/a-hamilton/calcchain.git)
    cd calcchain
    ```

2.  **Install dependencies:**
    Using npm:
    ```bash
    npm install
    ```
    Or using yarn:
    ```bash
    yarn install
    ```

### Running Locally

1.  **Start the development server:**
    Using npm:
    ```bash
    npm run dev
    ```
    Or using yarn:
    ```bash
    yarn dev
    ```
    The application will typically be available at `http://localhost:5173`.

### Building for Production

1.  **Create a production build:**
    Using npm:
    ```bash
    npm run build
    ```
    Or using yarn:
    ```bash
    yarn build
    ```
    The production-ready files will be located in the `dist` directory.

2.  **Preview the production build locally (optional):**
    Using npm:
    ```bash
    npm run preview
    ```
    Or using yarn:
    ```bash
    yarn preview
    ```

## ⚙️ Available Scripts

* `dev`: Starts the development server with Hot Module Replacement (HMR).
* `build`: Bundles the application for production.
* `preview`: Serves the production build locally for previewing.

## 📁 Project Structure


calcchain/
├── public/                 # Static assets
├── src/
│   ├── assets/             # Images, icons, etc.
│   ├── components/         # React components
│   │   ├── InputForm.tsx
│   │   ├── ResultsDisplay.tsx
│   │   └── CryptoInsights.tsx
│   ├── utils/              # Utility functions (calculations, API calls)
│   │   ├── atr.ts
│   │   ├── calculator.ts
│   │   ├── calculator.test.ts # Example test file
│   │   └── optimizer.ts
│   ├── App.tsx             # Main application component
│   ├── constants.ts        # Application-wide constants
│   ├── ErrorBoundary.tsx   # Error boundary component
│   ├── index.css           # Global CSS
│   ├── index.tsx           # Entry point of the application
│   ├── theme.ts            # Material-UI theme configuration
│   └── types.ts            # TypeScript type definitions
├── .gitignore
├── firebase.json           # Firebase hosting configuration
├── index.html              # Main HTML file
├── package.json
├── README.md
├── tsconfig.json           # TypeScript configuration
├── tsconfig.node.json
└── vite.config.ts          # Vite configuration


## 🤝 Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue for bugs, feature requests, or suggestions.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the `LICENSE` file for details

## 🙏 Acknowledgements

* Vite
* React
* Material-UI
* Binance API (for market data)
* Inspiration from various financial tools and trading communities.

---

*This README was last updated on May 30, 2025.*
