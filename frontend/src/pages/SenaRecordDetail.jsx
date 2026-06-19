import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './SenaRecordDetail.css';

const SenaRecordDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRecord();
  }, [id]);

  const fetchRecord = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:8000/api/sena/records/${id}/`, {
        withCredentials: true,
      });
      setRecord(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching record:', err);
      setError(err.response?.data?.detail || 'Failed to fetch record');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (status) => {
    const statusColors = {
      scheduled: '#0035aa',
      drop_due_to_absences: '#dc3545',
      drop_due_to_lack_of_interest: '#ff6b6b',
      endorse_to_adjudicator: '#ffc107',
      nlrc: '#fd7e14',
      ongoing: '#28a745',
      settled: '#20c997',
      withdrawn: '#6c757d',
    };
    return statusColors[status] || '#0035aa';
  };

  if (loading) {
    return (
      <div className="detail-container">
        <div className="loading">Loading record details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="detail-container">
        <div className="error-message">{error}</div>
        <button className="btn-back" onClick={() => navigate(-1)}>← Back</button>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="detail-container">
        <div className="no-record">Record not found</div>
        <button className="btn-back" onClick={() => navigate(-1)}>← Back</button>
      </div>
    );
  }

  return (
    <div className="detail-container">
      <div className="detail-header">
        <div>
          <h1>📋 SENA Record Details</h1>
          <p className="sead-number">SEAD: <strong>{record.seadNumber}</strong></p>
        </div>
        <div className="detail-header-buttons">
          <button className="btn-edit" onClick={() => navigate(`/sena-records/edit/${id}`)}>✏️ Edit</button>
          <button className="btn-back" onClick={() => navigate(-1)}>← Back</button>
        </div>
      </div>

      <div className="detail-content">
        {/* SENA Information Section */}
        <section className="detail-section">
          <h2>📌 SENA Information</h2>
          <div className="detail-grid">
            <div className="detail-item">
              <label>SENA Title</label>
              <p>{record.senaTitle || '-'}</p>
            </div>
            <div className="detail-item">
              <label>SENA Purpose</label>
              <p>{record.senaPurpose || '-'}</p>
            </div>
            <div className="detail-item">
              <label>Created Date</label>
              <p>{new Date(record.dateCreated).toLocaleDateString()}</p>
            </div>
            {record.dateUpdated && (
              <div className="detail-item">
                <label>Last Updated</label>
                <p>{new Date(record.dateUpdated).toLocaleDateString()}</p>
              </div>
            )}
          </div>
        </section>

        {/* Client Information Section */}
        <section className="detail-section">
          <h2>👤 Client Information</h2>
          <div className="detail-grid">
            <div className="detail-item">
              <label>First Name</label>
              <p>{record.clientFirstName || '-'}</p>
            </div>
            <div className="detail-item">
              <label>Last Name</label>
              <p>{record.clientLastName || '-'}</p>
            </div>
            <div className="detail-item">
              <label>Age</label>
              <p>{record.clientAge || '-'}</p>
            </div>
            <div className="detail-item">
              <label>Gender</label>
              <p>{record.clientGender || '-'}</p>
            </div>
            <div className="detail-item">
              <label>Base</label>
              <p>{record.clientBase || '-'}</p>
            </div>
            <div className="detail-item">
              <label>Deployed</label>
              <p>{record.clientDeployed || '-'}</p>
            </div>
            <div className="detail-item">
              <label>Contact Number</label>
              <p>{record.clientContactNumber || '-'}</p>
            </div>
            <div className="detail-item">
              <label>Indigency</label>
              <p>{record.clientIndigency ? 'Yes' : 'No'}</p>
            </div>
            <div className="detail-item">
              <label>Parent</label>
              <p>{record.clientParent ? 'Yes' : 'No'}</p>
            </div>
            <div className="detail-item">
              <label>PWD</label>
              <p>{record.clientPWD ? 'Yes' : 'No'}</p>
            </div>
          </div>
        </section>

        {/* Client Emails */}
        {record.clientEmails && record.clientEmails.length > 0 && (
          <section className="detail-section">
            <h2>📧 Client Emails</h2>
            <div className="emails-list">
              {record.clientEmails.map((email, idx) => (
                <div key={idx} className="email-item">{email}</div>
              ))}
            </div>
          </section>
        )}

        {/* Respondent Information Section */}
        <section className="detail-section">
          <h2>🏢 Respondent Information</h2>
          <div className="detail-grid">
            <div className="detail-item">
              <label>Respondent First Name</label>
              <p>{record.respondentFirstName || '-'}</p>
            </div>
            <div className="detail-item">
              <label>Respondent Last Name</label>
              <p>{record.respondentLastName || '-'}</p>
            </div>
            <div className="detail-item">
              <label>Respondent Position</label>
              <p>{record.respondentPosition || '-'}</p>
            </div>
            <div className="detail-item">
              <label>Respondent Contact</label>
              <p>{record.respondentContactNumber || '-'}</p>
            </div>
          </div>
        </section>

        {/* Respondent Emails */}
        {record.respondentEmails && record.respondentEmails.length > 0 && (
          <section className="detail-section">
            <h2>📧 Respondent Emails</h2>
            <div className="emails-list">
              {record.respondentEmails.map((email, idx) => (
                <div key={idx} className="email-item">{email}</div>
              ))}
            </div>
          </section>
        )}

        {/* Agency Information Section */}
        {record.agency_records && record.agency_records.length > 0 && (
          <section className="detail-section">
            <h2>🏛️ Agency Information</h2>
            {record.agency_records.map((agency, idx) => (
              <div key={idx} className="detail-grid">
                <div className="detail-item">
                  <label>Agency Name</label>
                  <p>{agency.agencyName || '-'}</p>
                </div>
                <div className="detail-item">
                  <label>Agency Contact</label>
                  <p>{agency.contact_number || '-'}</p>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Status Information Section */}
        <section className="detail-section">
          <h2>⚡ Status Information</h2>
          <div className="detail-grid">
            <div className="detail-item">
              <label>Client Status</label>
              <p>
                <span
                  className="status-badge"
                  style={{ backgroundColor: getStatusBadgeColor(record.clientStatus) }}
                >
                  {record.clientStatus?.replace(/_/g, ' ') || '-'}
                </span>
              </p>
            </div>
            <div className="detail-item">
              <label>Respondent Status</label>
              <p>
                <span
                  className="status-badge"
                  style={{ backgroundColor: getStatusBadgeColor(record.respondentStatus) }}
                >
                  {record.respondentStatus?.replace(/_/g, ' ') || '-'}
                </span>
              </p>
            </div>
            {record.settledDate && (
              <div className="detail-item">
                <label>Settled Date</label>
                <p>{new Date(record.settledDate).toLocaleDateString()}</p>
              </div>
            )}
          </div>
        </section>

        {/* Appointments Section */}
        {record.appointments && record.appointments.length > 0 && (
          <section className="detail-section">
            <h2>📅 Appointments</h2>
            <div className="appointments-list">
              {record.appointments.map((apt, idx) => (
                <div key={idx} className="appointment-item">
                  <div className="apt-date">📅 {apt.dateOfAppointment}</div>
                  <div className="apt-time">🕐 {apt.startTime} - {apt.endTime}</div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default SenaRecordDetail;
