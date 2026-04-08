# 💸 Spent — Premium Expense Tracker

Spent is a security-first, high-performance personal finance companion built with **Vue 3** and **Vite**. It combines a sleek, modern aesthetic with robust features to help users track their spending with elegance and privacy.

![App Mockup](https://via.placeholder.com/800x450/0A0A0A/00FFAB?text=Spent+Premium+Expense+Tracker)

## ✨ Features

- **🛡️ Security-First Architecture**: 
  - Mandatory 6-digit PIN setup on first launch.
  - Automatic inactivity locking (30-minute timeout).
  - Encrypted-style hashing for local security (via `localStorage`).
- **📊 Advanced Analytics**:
  - Interactive **Spending Trends** with weekly breakdown.
  - Dynamic **Category Breakdown** to visualize where your money goes.
  - Monthly reports featuring "Largest Expense" and "Largest Income" highlights.
- **📱 PWA Ready**: 
  - Fully installable on iOS and Android.
  - Custom "Add to Home Screen" prompts and tooltips.
  - Smart update notifications ensuring you always have the latest version.
- **💎 Premium UX**:
  - Glassmorphic UI elements and vibrant HSL-tailored colors.
  - Smooth tab transitions and staggering entry animations.
  - Localized currency support with 150+ options.

## 🚀 Tech Stack

- **Core**: [Vue 3](https://vuejs.org/) (Composition API)
- **Tooling**: [Vite](https://vitejs.dev/) for lightning-fast development.
- **Persistence**: Hybrid `localStorage` strategy for transactions and security states.
- **Styling**: Vanilla CSS with a deep design token system (CSS Variables).
- **Notifications**: [Vue-Toastification](https://github.com/Maronato/vue-toastification) for responsive feedback.

## 🛠️ Getting Started

### Prerequisites
- Node.js (Latest LTS recommended)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/expense-tracker.git
   cd expense-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run in development mode**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

## 🏗️ Project Structure

- `src/components/`: Modular UI components (BalanceCards, Modals, Security layers).
- `src/utils/`: Core logic for analytics, currency formatting, and security state machines.
- `src/assets/style.css`: The central design system and CSS variable tokens.

---

*Designed with ❤️ for a better financial future.*
