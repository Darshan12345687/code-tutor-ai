import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getApiUrl, API_ENDPOINTS } from '../../utils/apiConfig';
import './AppointmentBooking.css';

interface Appointment {
  _id: string;
  appointmentDate: string;
  duration: number;
  status: string;
  subject?: string;
  description?: string;
  questions?: string[];
  tutor?: {
    fullName: string;
    email?: string;
  };
}

const AppointmentBooking: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [formData, setFormData] = useState({
    appointmentDate: '',
    duration: 30,
    subject: '',
    description: '',
    questions: ['']
  });

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(getApiUrl(API_ENDPOINTS.APPOINTMENTS.LIST), {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const appointmentsData = response.data.appointments || [];
      
      // Normalize appointment dates - ensure they're always ISO strings
      const normalizedAppointments = appointmentsData.map((apt: any) => {
        if (apt.appointmentDate) {
          try {
            let dateValue: any = apt.appointmentDate;
            
            // Handle Date object
            if (dateValue instanceof Date) {
              apt.appointmentDate = !isNaN(dateValue.getTime()) ? dateValue.toISOString() : null;
            }
            // Handle string - validate it
            else if (typeof dateValue === 'string') {
              const date = new Date(dateValue);
              apt.appointmentDate = !isNaN(date.getTime()) ? date.toISOString() : null;
            }
            // Handle object - try multiple extraction methods
            else if (typeof dateValue === 'object' && dateValue !== null) {
              let extractedDate: Date | null = null;
              
              // Try MongoDB extended JSON format
              if (dateValue.$date) {
                extractedDate = new Date(dateValue.$date);
              }
              // Try toISOString method
              else if (typeof dateValue.toISOString === 'function') {
                extractedDate = new Date(dateValue.toISOString());
              }
              // Try common date properties
              else if (dateValue.iso || dateValue.ISOString) {
                extractedDate = new Date(dateValue.iso || dateValue.ISOString);
              }
              // Try parsing JSON string
              else {
                try {
                  const jsonStr = JSON.stringify(dateValue);
                  // Look for ISO date pattern
                  const isoMatch = jsonStr.match(/"([0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}[^"]*)"/);
                  if (isoMatch) {
                    extractedDate = new Date(isoMatch[1]);
                  } else {
                    // Try parsing the whole object as date
                    extractedDate = new Date(jsonStr);
                  }
                } catch (e) {
                  // Ignore
                }
              }
              
              apt.appointmentDate = extractedDate && !isNaN(extractedDate.getTime()) 
                ? extractedDate.toISOString() 
                : null;
            }
            // Handle number (timestamp)
            else if (typeof dateValue === 'number') {
              const date = new Date(dateValue);
              apt.appointmentDate = !isNaN(date.getTime()) ? date.toISOString() : null;
            }
            // Unknown type
            else {
              console.error('Unknown appointmentDate type:', typeof dateValue, dateValue, apt._id);
              apt.appointmentDate = null;
            }
          } catch (error) {
            console.error('Error normalizing appointment date:', error, apt._id, apt.appointmentDate);
            apt.appointmentDate = null;
          }
        } else {
          apt.appointmentDate = null;
        }
        
        return apt;
      });
      
      // Debug: Log appointment data to check date format
      console.log('Fetched appointments (normalized):', normalizedAppointments);
      normalizedAppointments.forEach((apt: any, idx: number) => {
        console.log(`Appointment ${idx + 1}:`, {
          id: apt._id,
          appointmentDate: apt.appointmentDate,
          dateType: typeof apt.appointmentDate,
          isValid: apt.appointmentDate ? !isNaN(new Date(apt.appointmentDate).getTime()) : false
        });
      });
      
      setAppointments(normalizedAppointments);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load appointments');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const questions = formData.questions.filter(q => q.trim() !== '');
      
      await axios.post(
        getApiUrl(API_ENDPOINTS.APPOINTMENTS.CREATE),
        {
          appointmentDate: formData.appointmentDate,
          duration: formData.duration,
          subject: formData.subject || undefined,
          description: formData.description || undefined,
          questions: questions.length > 0 ? questions : undefined
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Reset form and refresh appointments
      setFormData({
        appointmentDate: '',
        duration: 30,
        subject: '',
        description: '',
        questions: ['']
      });
      setShowBookingForm(false);
      fetchAppointments();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to book appointment');
    } finally {
      setLoading(false);
    }
  };

  const addQuestion = () => {
    setFormData({
      ...formData,
      questions: [...formData.questions, '']
    });
  };

  const removeQuestion = (index: number) => {
    setFormData({
      ...formData,
      questions: formData.questions.filter((_, i) => i !== index)
    });
  };

  const updateQuestion = (index: number, value: string) => {
    const newQuestions = [...formData.questions];
    newQuestions[index] = value;
    setFormData({
      ...formData,
      questions: newQuestions
    });
  };

  const formatDate = (dateInput: any) => {
    // Handle null, undefined, or empty values
    if (!dateInput) {
      return 'Date not set';
    }
    
    try {
      let date: Date;
      
      // Handle different input types
      if (dateInput instanceof Date) {
        date = dateInput;
      } else if (typeof dateInput === 'string') {
        // Try to parse the string - handle ISO strings and other formats
        const trimmedDate = dateInput.trim();
        if (!trimmedDate || trimmedDate === 'null' || trimmedDate === 'undefined') {
          return 'Date not set';
        }
        date = new Date(trimmedDate);
      } else if (typeof dateInput === 'object' && dateInput !== null) {
        // Handle object types - try multiple extraction methods
        let dateValue: any = null;
        
        // Try various ways to extract the date value
        if (dateInput instanceof Date) {
          dateValue = dateInput;
        } else if (dateInput.$date) {
          // MongoDB extended JSON format
          dateValue = dateInput.$date;
        } else if (dateInput.toISOString && typeof dateInput.toISOString === 'function') {
          // Date-like object with toISOString method
          try {
            dateValue = dateInput.toISOString();
          } catch (e) {
            // Ignore
          }
        } else if (dateInput.toString && typeof dateInput.toString === 'function') {
          // Try toString
          const str = dateInput.toString();
          if (str !== '[object Object]') {
            dateValue = str;
          }
        }
        
        // If we still don't have a value, try common date properties
        if (!dateValue) {
          dateValue = dateInput.iso || dateInput.ISOString || dateInput.date || dateInput.value;
        }
        
        // If still no value, try JSON stringify and parse
        if (!dateValue) {
          try {
            const jsonStr = JSON.stringify(dateInput);
            // Try to find date-like patterns in the JSON
            const dateMatch = jsonStr.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
            if (dateMatch) {
              dateValue = dateMatch[0];
            }
          } catch (e) {
            // Ignore
          }
        }
        
        if (dateValue) {
          date = dateValue instanceof Date ? dateValue : new Date(dateValue);
        } else {
          console.error('Could not extract date from object:', dateInput);
          return 'Invalid date format';
        }
      } else if (typeof dateInput === 'number') {
        // Handle timestamp
        date = new Date(dateInput);
      } else {
        console.error('formatDate received unexpected type:', typeof dateInput, dateInput);
        return 'Invalid date format';
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.error('Invalid date value after conversion:', dateInput, '→', date);
        return 'Invalid date';
      }
      
      // Format the date
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      console.error('Date formatting error:', error, 'Input:', dateInput);
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

  return (
    <div className="appointment-booking">
      <div className="appointment-header">
        <h2>📅 Book Appointment with Tutor</h2>
        <button
          className="btn-book-appointment"
          onClick={() => setShowBookingForm(!showBookingForm)}
        >
          {showBookingForm ? 'Cancel' : '+ Book Appointment'}
        </button>
      </div>

      {error && (
        <div className="appointment-error">
          {error}
        </div>
      )}

      {showBookingForm && (
        <div className="booking-form-container">
          <form onSubmit={handleSubmit} className="booking-form">
            <div className="form-group">
              <label htmlFor="appointmentDate">Appointment Date & Time *</label>
              <input
                type="datetime-local"
                id="appointmentDate"
                value={formData.appointmentDate}
                onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
                required
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="duration">Duration (minutes) *</label>
              <select
                id="duration"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                required
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>60 minutes</option>
                <option value={90}>90 minutes</option>
                <option value={120}>120 minutes</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="subject">Subject (Optional)</label>
              <input
                type="text"
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="e.g., Python Functions, Data Structures"
                maxLength={200}
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description (Optional)</label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what you'd like to discuss..."
                rows={4}
                maxLength={1000}
              />
            </div>

            <div className="form-group">
              <label>Questions for Tutor (Optional)</label>
              {formData.questions.map((question, index) => (
                <div key={index} className="question-input-group">
                  <input
                    type="text"
                    value={question}
                    onChange={(e) => updateQuestion(index, e.target.value)}
                    placeholder={`Question ${index + 1}`}
                    maxLength={500}
                  />
                  {formData.questions.length > 1 && (
                    <button
                      type="button"
                      className="remove-question-btn"
                      onClick={() => removeQuestion(index)}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                className="add-question-btn"
                onClick={addQuestion}
              >
                + Add Question
              </button>
            </div>

            <button
              type="submit"
              className="submit-booking-btn"
              disabled={loading || !formData.appointmentDate}
            >
              {loading ? 'Booking...' : 'Book Appointment'}
            </button>
          </form>
        </div>
      )}

      <div className="appointments-list">
        <h3>My Appointments</h3>
        {appointments.length === 0 ? (
          <div className="empty-appointments">
            <p>No appointments scheduled</p>
            <p className="hint">Click "Book Appointment" to schedule a session with your tutor</p>
          </div>
        ) : (
          <div className="appointments-grid">
            {appointments.map((appointment) => (
              <div key={appointment._id} className="appointment-card">
                <div className="appointment-card-header">
                  <div>
                    <strong>{formatDate(appointment.appointmentDate)}</strong>
                    {appointment.tutor && (
                      <p className="tutor-name">Tutor: {appointment.tutor.fullName || 'Tutor User'}</p>
                    )}
                  </div>
                  <span
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(appointment.status) }}
                  >
                    {appointment.status}
                  </span>
                </div>
                <div className="appointment-card-body">
                  <p><strong>Duration:</strong> {appointment.duration} minutes</p>
                  {appointment.subject && (
                    <p><strong>Subject:</strong> {appointment.subject}</p>
                  )}
                  {appointment.description && (
                    <p><strong>Description:</strong> {appointment.description}</p>
                  )}
                  {appointment.questions && appointment.questions.length > 0 && (
                    <div className="questions-section">
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentBooking;

