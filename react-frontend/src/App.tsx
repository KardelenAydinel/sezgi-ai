import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import WelcomeScreen from './components/WelcomeScreen';
import MainScreen from './components/MainScreen';
import BusinessPanel from './components/BusinessPanel';
import ABTestSetupScreen from './components/ABTestSetupScreen';
import ABTestResultsScreen from './components/ABTestResultsScreen';
import GlobalStyles from './styles/GlobalStyles';
import { theme } from './styles/theme';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles />
      <Router>
        <Routes>
          <Route path="/" element={<WelcomeScreen />} />
          <Route path="/chat" element={<MainScreen />} />
          <Route path="/business" element={<BusinessPanel />} />
          <Route path="/ab-test-setup" element={<ABTestSetupScreen />} />
          <Route path="/ab-test-results" element={<ABTestResultsScreen />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
