import React, { useState, useEffect } from 'react';
import './App.css';
import LandingPage from './components/Landing/LandingPage';
import DataStructuresPanel from './components/DataStructuresPanel';
import AlgorithmsPanel from './components/Algorithms/AlgorithmsPanel';
import ResourcesPanel from './components/Resources/ResourcesPanel';
import VisualizationsPanel from './components/Visualizations/VisualizationsPanel';
import AITutor from './components/AITutor/AITutor';
import Header from './components/Header';
import Footer from './components/Footer';
import Sidebar from './components/Sidebar';
import AboutUs from './components/AboutUs';
import InteractiveTerminal, { TerminalRef } from './components/Terminal/InteractiveTerminal';
import LanguageSelector from './components/LanguageSelector';
import QuizPanel from './components/Quiz/QuizPanel';
import TutorDashboard from './components/Tutor/TutorDashboard';
import AppointmentBooking from './components/Student/AppointmentBooking';
import axios from 'axios';
import { getApiUrl, API_ENDPOINTS } from './utils/apiConfig';

// Export types for use in other components
export interface ExecutionResult {
  output: string;
  error: string | null;
  execution_time: number;
}

export interface ExplanationResult {
  explanation: string;
  concepts: string[];
  examples: string[];
  provider?: string;
  warning?: string;
  errors?: string[];
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'editor' | 'ai-tutor' | 'data-structures' | 'algorithms' | 'visualizations' | 'resources' | 'quizzes' | 'appointments' | 'about'>('editor');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('python');

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      setIsAuthenticated(true);
      // Set preferred language if available
      if (userData.preferredLanguage) {
        setSelectedLanguage(userData.preferredLanguage);
      }
      // Verify token is still valid
      verifyToken(token);
    }
  }, []);


  const verifyToken = async (token: string) => {
    try {
      const response = await axios.get(getApiUrl(API_ENDPOINTS.AUTH.ME), {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
      setIsAuthenticated(true);
    } catch (error: any) {
      // Token invalid, clear storage
      console.warn('Token verification failed:', error.response?.data?.error || error.message);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setIsAuthenticated(false);
    }
  };

  const handleLogin = async (token: string, userData: any) => {
    setUser(userData);
    setIsAuthenticated(true);
    // Set preferred language
    if (userData.preferredLanguage) {
      setSelectedLanguage(userData.preferredLanguage);
    }
  };

  const updatePreferredLanguage = async (language: string) => {
    setSelectedLanguage(language);
    const token = localStorage.getItem('token');
    if (token && user) {
      try {
        await axios.put(
          getApiUrl(API_ENDPOINTS.USERS.PREFERENCES),
          { preferredLanguage: language },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        // Update local user state
        setUser({ ...user, preferredLanguage: language });
      } catch (error) {
        console.error('Failed to update language preference:', error);
      }
    }
  };


  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  const terminalRef = React.useRef<TerminalRef>(null);


  // Show landing page if not authenticated
  if (!isAuthenticated) {
    return (
      <LandingPage onLogin={handleLogin} />
    );
  }

  // Show tutor dashboard if user is a tutor
  if (user && user.role === 'tutor') {
    return (
      <div className="App">
        <Header user={user} onLogout={handleLogout} />
        <main className="main-content tutor-main-content">
          <TutorDashboard />
        </main>
      </div>
    );
  }

  return (
    <div className="App">
      <Header user={user} onLogout={handleLogout} />
      <div className="app-container">
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab}
        />
        <main className="main-content">
          {activeTab === 'editor' && (
            <>
              <div className="editor-section">
                <div className="section-header">
                  <h2>Interactive Terminal</h2>
                </div>
                <LanguageSelector 
                  selectedLanguage={selectedLanguage} 
                  onLanguageChange={updatePreferredLanguage}
                />
                <div className="terminal-full-container">
                  <InteractiveTerminal 
                    language={selectedLanguage}
                    userId={user?.id}
                    ref={terminalRef}
                  />
                </div>
                <div className="editor-actions-footer">
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => setActiveTab('ai-tutor')}
                  >
                    🤖 Ask AI Tutor
                  </button>
                </div>
              </div>
            </>
          )}

          {activeTab === 'ai-tutor' && (
            <AITutor 
              user={user} 
              onLanguageChange={updatePreferredLanguage}
            />
          )}
          
          {activeTab === 'data-structures' && (
            <DataStructuresPanel />
          )}
          
          {activeTab === 'algorithms' && (
            <AlgorithmsPanel />
          )}
          
          {activeTab === 'visualizations' && (
            <VisualizationsPanel />
          )}
          
          {activeTab === 'resources' && (
            <ResourcesPanel />
          )}
          
          {activeTab === 'quizzes' && (
            <QuizPanel />
          )}
          
          {activeTab === 'appointments' && (
            <AppointmentBooking />
          )}
          
          {activeTab === 'about' && (
            <AboutUs />
          )}
        </main>
      </div>
      <Footer />
    </div>
  );
}

export default App;
