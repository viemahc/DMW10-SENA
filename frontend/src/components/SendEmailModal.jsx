import React, { useState } from 'react';
import axios from 'axios';
import './SendEmailModal.css';

const SendEmailModal = ({ isOpen, onClose, record, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  if (!isOpen || !record) return null;

  const formatAppointmentDetails = () => {
    if (!record.appointments || record.appointments.length === 0) {
      return 'No appointments scheduled';
    }

    return record.appointments
      .map(apt => {
        let details = `📅 Date: ${apt.dateOfAppointment}`;
        if (apt.startTime) details += ` | ⏰ Time: ${apt.startTime}`;
        if (apt.endTime) details += ` - ${apt.endTime}`;
        return details;
      })
      .join('\n');
  };

  const composeEmail = () => {
    const appointmentDetails = formatAppointmentDetails();
    const subject = `SENA Schedule: ${record.senaTitle}`;
    const body = `Dear Recipient,

This is to inform you about your scheduled SENA meeting for "${record.senaTitle}".

APPOINTMENT DETAILS:
${appointmentDetails}

SENA Information:
- Program: ${record.senaTitle}
- SEAD Number: ${record.seadNumber}
- Purpose: ${record.senaPurpose || 'N/A'}
- Agency: ${record.agency_records?.[0]?.agencyName || 'N/A'}

Please mark your calendar and make sure to attend the appointment.

If you have any questions or need to reschedule, please contact us.

Best regards,
Department of Migrant Workers`;

    return { subject, body };
  };

  const handleSendEmail = async () => {
    if (!record.clientEmails?.length && !record.respondentEmails?.length) {
      setError('No email addresses available for this record');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const { subject, body } = composeEmail();
      
      const emailData = {
        recipient_emails: [
          ...(record.clientEmails || []),
          ...(record.respondentEmails || []),
        ],
        subject,
        message: body,
      };

      await axios.post(
        'http://localhost:8000/api/sena/records/send_email/',
        emailData,
        { withCredentials: true }
      );

      setSuccessMessage(
        `Email sent successfully to ${emailData.recipient_emails.length} recipient(s)!`
      );

      setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess();
      }, 2000);
    } catch (err) {
      console.error('Error sending email:', err);
      const errorMsg =
        err.response?.data?.detail ||
        err.response?.data?.error ||
        err.message ||
        'Failed to send email';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const { subject, body } = composeEmail();
  const totalRecipients =
    (record.clientEmails?.length || 0) + (record.respondentEmails?.length || 0);

  return (
    <div className="modal-overlay">
      <div className="modal-content send-email-modal">
        <div className="modal-header">
          <h2>📧 Send Schedule Email</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          {error && <div className="alert alert-danger">{error}</div>}
          {successMessage && (
            <div className="alert alert-success">{successMessage}</div>
          )}

          <div className="email-preview">
            <div className="preview-section">
              <h3>Record Details</h3>
              <p>
                <strong>Program:</strong> {record.senaTitle}
              </p>
              <p>
                <strong>SEAD Number:</strong> {record.seadNumber}
              </p>
              <p>
                <strong>Agency:</strong>{' '}
                {record.agency_records?.[0]?.agencyName || 'N/A'}
              </p>
            </div>

            <div className="preview-section">
              <h3>Recipients</h3>
              {record.clientEmails && record.clientEmails.length > 0 && (
                <div className="recipient-group">
                  <strong>👤 Client Emails ({record.clientEmails.length}):</strong>
                  <ul>
                    {record.clientEmails.map((email, idx) => (
                      <li key={idx}>{email}</li>
                    ))}
                  </ul>
                </div>
              )}
              {record.respondentEmails && record.respondentEmails.length > 0 && (
                <div className="recipient-group">
                  <strong>🏢 Respondent Emails ({record.respondentEmails.length}):</strong>
                  <ul>
                    {record.respondentEmails.map((email, idx) => (
                      <li key={idx}>{email}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="total-recipients">
                <strong>Total Recipients: {totalRecipients}</strong>
              </div>
            </div>

            <div className="preview-section">
              <h3>Email Preview</h3>
              <div className="email-preview-box">
                <p>
                  <strong>Subject:</strong> {subject}
                </p>
                <hr />
                <p style={{ whiteSpace: 'pre-wrap', fontSize: '0.85rem' }}>
                  {body}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button
            className="btn btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSendEmail}
            disabled={loading || totalRecipients === 0}
          >
            {loading ? '📧 Sending...' : `📧 Send to ${totalRecipients} Recipient(s)`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SendEmailModal;
