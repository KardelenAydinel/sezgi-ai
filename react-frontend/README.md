# React Frontend - Görsel Alışveriş Asistanı

This React.js frontend has been converted from Flutter and provides a visual shopping assistant interface.

## Features

- **Welcome Screen**: Main landing page with search functionality and example queries
- **Chat Interface**: Real-time messaging with AI assistant for product recommendations
- **Business Panel**: Dashboard for sellers with A/B testing capabilities
- **A/B Testing**: Setup and view results of A/B tests for product optimization
- **Product Display**: Cards for both regular products and e-commerce products
- **Image Upload**: Support for image-based product searches
- **Responsive Design**: Mobile-friendly interface

## Technology Stack

- React.js with TypeScript
- React Router for navigation
- Styled Components for styling
- Axios for HTTP requests
- React Markdown for message formatting

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. The app will open at http://localhost:3000

### Backend Connection

Make sure the backend server is running on http://localhost:8000 for the API calls to work properly.

## Project Structure

```
src/
├── components/          # React components
│   ├── WelcomeScreen.tsx
│   ├── MainScreen.tsx
│   ├── ChatPage.tsx
│   ├── BusinessPanel.tsx
│   ├── ABTestSetupScreen.tsx
│   ├── ABTestResultsScreen.tsx
│   ├── ProductCard.tsx
│   └── EcommerceProductCard.tsx
├── services/           # API services
│   └── api.ts
├── styles/            # Styling and themes
│   ├── theme.ts
│   ├── GlobalStyles.ts
│   └── styled.d.ts
├── types/             # TypeScript interfaces
│   └── index.ts
└── App.tsx           # Main app component
```

## Available Scripts

- `npm start` - Runs the app in development mode
- `npm test` - Launches the test runner
- `npm run build` - Builds the app for production
- `npm run eject` - Ejects from Create React App (irreversible)

## Key Differences from Flutter Version

1. **State Management**: Uses React hooks instead of Flutter's setState
2. **Styling**: Styled Components instead of Flutter's widget styling
3. **Navigation**: React Router instead of Flutter's Navigator
4. **HTTP Requests**: Axios instead of Flutter's http package
5. **Image Handling**: Standard HTML img tags instead of Flutter's Image widget

## Development Notes

- The app maintains the same visual design and functionality as the original Flutter version
- All API endpoints and data models have been preserved
- The component structure mirrors the original Flutter widgets
- TypeScript provides type safety equivalent to Dart's type system