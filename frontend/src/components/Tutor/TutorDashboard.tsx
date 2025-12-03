import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './TutorDashboard.css';

interface Student {
  _id: string;
  s0Key: string;
  email?: string;
  fullName?: string;
  lastActive: string;
  preferredLanguage: string;
  createdAt: string;
}

interface Appointment {
  _id: string;
  student: Student;
  appointmentDate: string;
  duration: number;
  status: string;
  subject?: string;
  description?: string;
  questions?: string[];
}

interface Message {
  _id: string;
  from: Student;
  message: string;
  subject?: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

interface StudentProgress {
  student: Student;
  quizProgress: number;
  quizScores: any[];
  flashcardProgress: number;
  codeSubmissions: number;
  appointments: number;
  upcomingAppointments: Appointment[];
  unreadMessages: number;
}

interface DashboardData {
  tutor: {
    _id: string;
    fullName: string;
    email?: string;
  };
  stats: {
    totalStudents: number;
    totalAppointments: number;
    upcomingAppointments: number;
    unreadMessages: number;
  };
  students: StudentProgress[];
  appointments: Appointment[];
  messages: Message[];
}

const TutorDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentProgress | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'appointments' | 'messages'>('overview');

  useEffect(() => {
    // Add a small delay to ensure token is stored after login
    const timer = setTimeout(() => {
      fetchDashboardData();
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found. Please log in again.');
        setLoading(false);
        // Redirect to login
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
        return;
      }
      
      // Verify token format
      if (token.length < 50) {
        console.error('Token appears to be invalid:', token.substring(0, 20));
        setError('Invalid token format. Please log in again.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setLoading(false);
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
        return;
      }
      
      console.log('Fetching dashboard with token:', token.substring(0, 20) + '...');
      const response = await axios.get('http://localhost:8000/api/tutor/dashboard', {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setDashboardData(response.data);
      setError(''); // Clear any previous errors
    } catch (err: any) {
      console.error('Dashboard fetch error:', err.response?.data || err.message);
      const errorMessage = err.response?.data?.error || 'Failed to load dashboard';
      const errorCode = err.response?.data?.code;
      
      // If token is invalid or expired, clear storage and prompt re-login
      if (errorCode === 'INVALID_TOKEN' || errorCode === 'INVALID_SIGNATURE' || errorCode === 'TOKEN_EXPIRED' || err.response?.status === 401) {
        console.error('Token validation failed:', errorCode, errorMessage);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setError('Your session has expired. Please log in again.');
        // Redirect to login after 2 seconds
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | Date | null | undefined) => {
    // Handle null, undefined, or empty values
    if (!dateString) {
      console.warn('formatDate received invalid date:', dateString);
      return 'Date not set';
    }
    
    try {
      let date: Date;
      
      // Handle different input types
      if (dateString instanceof Date) {
        date = dateString;
      } else if (typeof dateString === 'string') {
        // Try to parse the string - handle ISO strings and other formats
        const trimmedDate = dateString.trim();
        if (!trimmedDate) {
          return 'Date not set';
        }
        date = new Date(trimmedDate);
      } else {
        console.warn('formatDate received unexpected type:', typeof dateString, dateString);
        return 'Invalid date format';
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.error('Invalid date value:', dateString);
        return 'Invalid date';
      }
      
      // Format the date
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'America/Chicago' // Adjust to your timezone
      });
    } catch (error) {
      console.error('Date formatting error:', error, 'Input:', dateString);
      return 'Date formatting error';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return '#28a745';
      case 'pending': return '#ffc107';
      case 'completed': return '#6c757d';
      case 'cancelled': return '#dc3545';
      default: return '#666';
    }
  };

  if (loading) {
    return (
      <div className="tutor-dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tutor-dashboard-error">
        <p>❌ {error}</p>
        <button onClick={fetchDashboardData}>Retry</button>
      </div>
    );
  }

  if (!dashboardData) {
    return <div className="tutor-dashboard-error">No data available</div>;
  }

  return (
    <div className="tutor-dashboard">
      <div className="tutor-dashboard-header">
        <h1>👨‍🏫 Tutor Dashboard</h1>
        <div className="tutor-info">
          <p>Welcome, {dashboardData.tutor.fullName}</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-value">{dashboardData.stats.totalStudents}</div>
          <div className="stat-label">Total Students</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-value">{dashboardData.stats.upcomingAppointments}</div>
          <div className="stat-label">Upcoming Appointments</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💬</div>
          <div className="stat-value">{dashboardData.stats.unreadMessages}</div>
          <div className="stat-label">Unread Messages</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-value">{dashboardData.stats.totalAppointments}</div>
          <div className="stat-label">Total Appointments</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="dashboard-tabs">
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button
          className={`tab-btn ${activeTab === 'students' ? 'active' : ''}`}
          onClick={() => setActiveTab('students')}
        >
          👥 Students
        </button>
        <button
          className={`tab-btn ${activeTab === 'appointments' ? 'active' : ''}`}
          onClick={() => setActiveTab('appointments')}
        >
          📅 Appointments
        </button>
        <button
          className={`tab-btn ${activeTab === 'messages' ? 'active' : ''}`}
          onClick={() => setActiveTab('messages')}
        >
          💬 Messages
        </button>
      </div>

      {/* Tab Content */}
      <div className="dashboard-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <h2>Recent Activity</h2>
            <div className="recent-students">
              <h3>Recently Active Students</h3>
              {dashboardData.students.slice(0, 5).map((studentProgress) => (
                <div key={studentProgress.student._id} className="student-card">
                  <div className="student-info">
                    <strong>{studentProgress.student.fullName || studentProgress.student.s0Key}</strong>
                    <span className="student-s0key">{studentProgress.student.s0Key}</span>
                  </div>
                  <div className="student-stats">
                    <span>📝 {studentProgress.quizProgress} quizzes</span>
                    <span>🎴 {studentProgress.flashcardProgress} flashcards</span>
                    <span>💻 {studentProgress.codeSubmissions} submissions</span>
                    {studentProgress.unreadMessages > 0 && (
                      <span className="unread-badge">{studentProgress.unreadMessages} unread</span>
                    )}
                  </div>
                  <div className="last-active">
                    Last active: {formatDate(studentProgress.student.lastActive)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'students' && (
          <div className="students-tab">
            <h2>All Students</h2>
            <div className="students-list">
              {dashboardData.students.map((studentProgress) => (
                <div
                  key={studentProgress.student._id}
                  className={`student-card ${selectedStudent?.student._id === studentProgress.student._id ? 'selected' : ''}`}
                  onClick={() => setSelectedStudent(studentProgress)}
                >
                  <div className="student-header">
                    <div>
                      <strong>{studentProgress.student.fullName || 'Student'}</strong>
                      <span className="student-s0key">{studentProgress.student.s0Key}</span>
                    </div>
                    {studentProgress.unreadMessages > 0 && (
                      <span className="unread-badge">{studentProgress.unreadMessages}</span>
                    )}
                  </div>
                  <div className="student-progress">
                    <div className="progress-item">
                      <span className="progress-label">Quizzes:</span>
                      <span className="progress-value">{studentProgress.quizProgress}</span>
                    </div>
                    <div className="progress-item">
                      <span className="progress-label">Flashcards:</span>
                      <span className="progress-value">{studentProgress.flashcardProgress}</span>
                    </div>
                    <div className="progress-item">
                      <span className="progress-label">Code Submissions:</span>
                      <span className="progress-value">{studentProgress.codeSubmissions}</span>
                    </div>
                    <div className="progress-item">
                      <span className="progress-label">Appointments:</span>
                      <span className="progress-value">{studentProgress.appointments}</span>
                    </div>
                  </div>
                  <div className="student-meta">
                    <span>Language: {studentProgress.student.preferredLanguage}</span>
                    <span>Last active: {formatDate(studentProgress.student.lastActive)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'appointments' && (
          <div className="appointments-tab">
            <h2>Appointments</h2>
            <div className="appointments-list">
              {dashboardData.appointments.length === 0 ? (
                <p className="empty-state">No appointments scheduled</p>
              ) : (
                dashboardData.appointments.map((appointment) => (
                  <div key={appointment._id} className="appointment-card">
                    <div className="appointment-header">
                      <div>
                        <strong>{appointment.student.fullName || appointment.student.s0Key}</strong>
                        <span className="student-s0key">{appointment.student.s0Key}</span>
                      </div>
                      <span
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(appointment.status) }}
                      >
                        {appointment.status}
                      </span>
                    </div>
                    <div className="appointment-details">
                      <p><strong>Date:</strong> {formatDate(appointment.appointmentDate)}</p>
                      <p><strong>Duration:</strong> {appointment.duration} minutes</p>
                      {appointment.subject && <p><strong>Subject:</strong> {appointment.subject}</p>}
                      {appointment.description && (
                        <p><strong>Description:</strong> {appointment.description}</p>
                      )}
                      {appointment.questions && appointment.questions.length > 0 && (
                        <div className="questions-list">
                          <strong>Questions:</strong>
                          <ul>
                            {appointment.questions.map((q, idx) => (
                              <li key={idx}>{q}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'messages' && (
          <div className="messages-tab">
            <h2>Messages</h2>
            <div className="messages-list">
              {dashboardData.messages.length === 0 ? (
                <p className="empty-state">No messages</p>
              ) : (
                dashboardData.messages.map((message) => (
                  <div
                    key={message._id}
                    className={`message-card ${!message.isRead ? 'unread' : ''}`}
                  >
                    <div className="message-header">
                      <div>
                        <strong>{message.from.fullName || message.from.s0Key}</strong>
                        <span className="student-s0key">{message.from.s0Key}</span>
                      </div>
                      <span className="message-date">{formatDate(message.createdAt)}</span>
                    </div>
                    {message.subject && (
                      <div className="message-subject"><strong>Subject:</strong> {message.subject}</div>
                    )}
                    <div className="message-content">{message.message}</div>
                    <div className="message-type">Type: {message.type}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TutorDashboard;

