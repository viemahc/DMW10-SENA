import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './SenaRecordForm.css';

const SenaRecordForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    user: '',
    senaTitle: '',
    seadNumber: '',
    senaPurpose: '',
    clientFirstName: '',
    clientMiddleName: '',
    clientLastName: '',
    clientSuffix: '',
    clientAge: '',
    clientContactNumber: '',
    clientGender: '',
    clientBase: '',
    clientDeployed: '',
    clientIndigency: false,
    clientParent: false,
    clientPWD: false,
    clientStatus: 'scheduled',
    respondentStatus: 'scheduled',
    settledDate: '',
    agencyName: '',
    agencyDescription: '',
    agencyContactNumber: '',
  });

  const [users, setUsers] = useState([]);
  const [emailClients, setEmailClients] = useState([]);
  const [emailRespondents, setEmailRespondents] = useState([]);
  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading] = useState(isEditMode);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [clientEmails, setClientEmails] = useState(['']);
  const [respondentEmails, setRespondentEmails] = useState(['']);
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newRespondentEmail, setNewRespondentEmail] = useState('');
  const [appointments, setAppointments] = useState([{
    dateOfAppointment: '',
    startTime: '',
    endTime: '',
  }]);
  const [newAppointment, setNewAppointment] = useState({
    dateOfAppointment: '',
    startTime: '',
    endTime: '',
  });

  useEffect(() => {
    fetchUsers();
    fetchEmailClients();
    fetchEmailRespondents();
    fetchAgencies();
    if (isEditMode) {
      fetchRecord();
    }
  }, [id]);

  // Auto-fill agency details when agencyName matches a loaded agency
  useEffect(() => {
    if (formData.agencyName && agencies.length > 0) {
      const matchedAgency = agencies.find((agency) => agency.agencyName === formData.agencyName);
      if (matchedAgency) {
        // Auto-fill description and contact number if they exist
        setFormData((prev) => ({
          ...prev,
          agencyDescription: matchedAgency.agencyDescription || '',
          agencyContactNumber: matchedAgency.contact_number || '',
        }));
      }
    }
  }, [agencies, formData.agencyName]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://localhost:8000/auth/admin/users/', {
        withCredentials: true,
      });
      const usersList = response.data.users || response.data.results || response.data || [];
      setUsers(Array.isArray(usersList) ? usersList : []);
      
      // Set default user to current user if not already set
      if (!isEditMode && user) {
        setFormData((prev) => ({
          ...prev,
          user: user.user_id,
        }));
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const fetchEmailClients = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/sena/email-clients/', {
        withCredentials: true,
      });
      const clientsList = response.data.results || response.data || [];
      setEmailClients(Array.isArray(clientsList) ? clientsList : []);
    } catch (err) {
      console.error('Error fetching email clients:', err);
    }
  };

  const fetchEmailRespondents = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/sena/email-respondents/', {
        withCredentials: true,
      });
      const respondentsList = response.data.results || response.data || [];
      setEmailRespondents(Array.isArray(respondentsList) ? respondentsList : []);
    } catch (err) {
      console.error('Error fetching email respondents:', err);
    }
  };

  const fetchAgencies = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/sena/records/agencies/', {
        withCredentials: true,
      });
      const agenciesList = response.data || [];
      setAgencies(Array.isArray(agenciesList) ? agenciesList : []);
    } catch (err) {
      console.error('Error fetching agencies:', err);
    }
  };

  const fetchRecord = async () => {
    try {
      const response = await axios.get(`http://localhost:8000/api/sena/records/${id}/`, {
        withCredentials: true,
      });

      const data = response.data;
      setFormData({
        user: data.user || '',
        senaTitle: data.senaTitle,
        seadNumber: data.seadNumber || '',
        senaPurpose: data.senaPurpose || '',
        clientFirstName: data.clientFirstName,
        clientMiddleName: data.clientMiddleName || '',
        clientLastName: data.clientLastName,
        clientSuffix: data.clientSuffix || '',
        clientAge: data.clientAge,
        clientContactNumber: data.clientContactNumber,
        clientGender: data.clientGender || '',
        clientBase: data.clientBase || '',
        clientDeployed: data.clientDeployed || '',
        clientIndigency: data.clientIndigency || false,
        clientParent: data.clientParent || false,
        clientPWD: data.clientPWD || false,
        clientStatus: data.clientStatus || 'scheduled',
        respondentStatus: data.respondentStatus || 'scheduled',
        settledDate: data.settledDate || '',
        agencyName: data.agency_records?.[0]?.agencyName || '',
        agencyDescription: data.agency_records?.[0]?.agencyDescription || '',
        agencyContactNumber: data.agency_records?.[0]?.contact_number || '',
      });

      // Load all associated emails
      setClientEmails(data.clientEmails || ['']);
      setRespondentEmails(data.respondentEmails || ['']);
      
      // Load all associated appointments
      setAppointments(data.appointments || [{
        dateOfAppointment: '',
        startTime: '',
        endTime: '',
      }]);
    } catch (err) {
      console.error('Error fetching record:', err);
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to fetch record';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTimeForInput = (dateString) => {
    if (!dateString) return '';
    // Date field is already in YYYY-MM-DD format
    return dateString.split('T')[0];
  };

  const formatDateTimeForSubmit = (dateString) => {
    if (!dateString) return '';
    // Return date as-is for DATE field
    return dateString;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleAgencySelect = (e) => {
    const selectedName = e.target.value;
    
    if (selectedName === '' || selectedName === 'new') {
      // Clear all agency fields for new entry
      setFormData((prev) => ({
        ...prev,
        agencyName: '',
        agencyDescription: '',
        agencyContactNumber: '',
      }));
      return;
    }

    // Find the selected agency in the list
    const selectedAgency = agencies.find((agency) => agency.agencyName === selectedName);
    
    if (selectedAgency) {
      // Auto-fill the agency fields
      setFormData((prev) => ({
        ...prev,
        agencyName: selectedAgency.agencyName,
        agencyDescription: selectedAgency.agencyDescription || '',
        agencyContactNumber: selectedAgency.contact_number || '',
      }));
    }
  };

  const handleClientEmailChange = (index, value) => {
    const newEmails = [...clientEmails];
    newEmails[index] = value;
    setClientEmails(newEmails);
  };

  const handleRespondentEmailChange = (index, value) => {
    const newEmails = [...respondentEmails];
    newEmails[index] = value;
    setRespondentEmails(newEmails);
  };

  const addClientEmail = () => {
    if (newClientEmail.trim()) {
      setClientEmails([...clientEmails, newClientEmail.trim()]);
      setNewClientEmail('');
    }
  };

  const addRespondentEmail = () => {
    if (newRespondentEmail.trim()) {
      setRespondentEmails([...respondentEmails, newRespondentEmail.trim()]);
      setNewRespondentEmail('');
    }
  };

  const removeClientEmail = (index) => {
    setClientEmails(clientEmails.filter((_, i) => i !== index));
  };

  const removeRespondentEmail = (index) => {
    setRespondentEmails(respondentEmails.filter((_, i) => i !== index));
  };

  const handleAppointmentChange = (index, field, value) => {
    const newAppointments = [...appointments];
    newAppointments[index][field] = value;
    setAppointments(newAppointments);
  };

  const addAppointment = () => {
    if (newAppointment.dateOfAppointment.trim()) {
      setAppointments([...appointments, { ...newAppointment }]);
      setNewAppointment({
        dateOfAppointment: '',
        startTime: '',
        endTime: '',
      });
    }
  };

  const removeAppointment = (index) => {
    setAppointments(appointments.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      // Validate at least one email for client and respondent
      const validClientEmails = clientEmails.filter(e => e.trim());
      const validRespondentEmails = respondentEmails.filter(e => e.trim());
      const validAppointments = appointments.filter(a => a.dateOfAppointment.trim());

      if (validClientEmails.length === 0) {
        setError('At least one client email is required');
        return;
      }

      if (validRespondentEmails.length === 0) {
        setError('At least one respondent email is required');
        return;
      }

      if (validAppointments.length === 0) {
        setError('At least one appointment is required');
        return;
      }

      const url = isEditMode
        ? `http://localhost:8000/api/sena/records/${id}/`
        : 'http://localhost:8000/api/sena/records/';

      const method = isEditMode ? 'put' : 'post';

      const payload = {
        user: formData.user ? parseInt(formData.user, 10) : null,
        senaTitle: formData.senaTitle,
        seadNumber: formData.seadNumber || '',
        senaPurpose: formData.senaPurpose || '',
        clientFirstName: formData.clientFirstName,
        clientMiddleName: formData.clientMiddleName,
        clientLastName: formData.clientLastName,
        clientSuffix: formData.clientSuffix,
        clientAge: parseInt(formData.clientAge, 10),
        clientContactNumber: formData.clientContactNumber,
        clientGender: formData.clientGender || '',
        clientBase: formData.clientBase || '',
        clientDeployed: formData.clientDeployed || '',
        clientIndigency: formData.clientIndigency,
        clientParent: formData.clientParent,
        clientPWD: formData.clientPWD,
        clientEmailsInput: validClientEmails,
        respondentEmailsInput: validRespondentEmails,
        appointmentsInput: validAppointments,
        clientStatus: formData.clientStatus,
        respondentStatus: formData.respondentStatus,
        settledDate: formData.settledDate || '',
        agencyName: formData.agencyName || '',
        agencyDescription: formData.agencyDescription || '',
        agencyContactNumber: formData.agencyContactNumber || '',
      };

      console.log('Submitting payload:', payload);

      await axios({
        method,
        url,
        data: payload,
        withCredentials: true,
      });

      setSuccess(isEditMode ? 'Record updated successfully!' : 'Record created successfully!');
      setTimeout(() => {
        navigate('/sena-records');
      }, 1500);
    } catch (err) {
      console.error('Error saving record:', err);
      let errorMessage = 'Failed to save record';
      
      if (err.response?.data) {
        if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        } else if (err.response.data.detail) {
          errorMessage = err.response.data.detail;
        } else if (err.response.data.error) {
          errorMessage = err.response.data.error;
        } else if (typeof err.response.data === 'object') {
          // Check for field-specific errors
          const fieldErrors = Object.entries(err.response.data)
            .map(([field, msgs]) => {
              const messages = Array.isArray(msgs) ? msgs.join(', ') : msgs;
              return `${field}: ${messages}`;
            })
            .join('; ');
          if (fieldErrors) {
            errorMessage = fieldErrors;
          }
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    }
  };

  if (loading) {
    return <div className="sena-form container"><p>Loading...</p></div>;
  }

  return (
    <div className="sena-form container">
      <div className="form-header">
        <h1>{isEditMode ? 'Edit SENA Record' : 'Create New SENA Record'}</h1>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form onSubmit={handleSubmit} className="record-form">
        <div className="form-section">
          <h2>Program Information</h2>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="senaTitle">Program Title <span style={{color: 'red'}}>*</span></label>
              <input
                type="text"
                id="senaTitle"
                name="senaTitle"
                value={formData.senaTitle}
                onChange={handleChange}
                required
                placeholder="Enter program title"
              />
            </div>

            <div className="form-group">
              <label htmlFor="senaPurpose">Purpose of SENA</label>
              <select
                id="senaPurpose"
                name="senaPurpose"
                value={formData.senaPurpose}
                onChange={handleChange}
              >
                <option value="">Select a purpose...</option>
                <option value="recruitment_violation">Recruitment Violation</option>
                <option value="money_claims">Money Claims</option>
                <option value="daw">DAW</option>
                <option value="dae">DAE</option>
                <option value="rv_mc">RV/MC</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="seadNumber">SEAD Number (Auto-generated on Create)</label>
              <input
                type="text"
                id="seadNumber"
                name="seadNumber"
                value={formData.seadNumber}
                onChange={handleChange}
                disabled={!isEditMode}
                readOnly={!isEditMode}
                placeholder="SEAD-YYYY-MM-XXXX"
              />
            </div>

            <div className="form-group">
              <label htmlFor="user">Assigned To <span style={{color: 'red'}}>*</span></label>
              <select
                id="user"
                name="user"
                value={formData.user}
                onChange={handleChange}
                required
              >
                <option value="">Select a user...</option>
                {users.map((u) => (
                  <option key={u.user_id} value={u.user_id}>
                    {u.firstName} {u.lastName} {u.user_id === user?.user_id ? '(You)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Client Information</h2>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="clientFirstName">First Name <span style={{color: 'red'}}>*</span></label>
              <input
                type="text"
                id="clientFirstName"
                name="clientFirstName"
                value={formData.clientFirstName}
                onChange={handleChange}
                required
                placeholder="First name"
              />
            </div>
            <div className="form-group">
              <label htmlFor="clientMiddleName">Middle Name</label>
              <input
                type="text"
                id="clientMiddleName"
                name="clientMiddleName"
                value={formData.clientMiddleName}
                onChange={handleChange}
                placeholder="Middle name"
              />
            </div>
            <div className="form-group">
              <label htmlFor="clientLastName">Last Name <span style={{color: 'red'}}>*</span></label>
              <input
                type="text"
                id="clientLastName"
                name="clientLastName"
                value={formData.clientLastName}
                onChange={handleChange}
                required
                placeholder="Last name"
              />
            </div>
            <div className="form-group">
              <label htmlFor="clientSuffix">Suffix</label>
              <input
                type="text"
                id="clientSuffix"
                name="clientSuffix"
                value={formData.clientSuffix}
                onChange={handleChange}
                placeholder="Jr., Sr., III, etc."
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="clientAge">Age <span style={{color: 'red'}}>*</span></label>
              <input
                type="number"
                id="clientAge"
                name="clientAge"
                value={formData.clientAge}
                onChange={handleChange}
                required
                min="1"
                max="120"
                placeholder="Age"
              />
            </div>
            <div className="form-group">
              <label htmlFor="clientContactNumber">Contact Number <span style={{color: 'red'}}>*</span></label>
              <input
                type="tel"
                id="clientContactNumber"
                name="clientContactNumber"
                value={formData.clientContactNumber}
                onChange={handleChange}
                required
                placeholder="+63-9123456789"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Gender (Optional)</label>
              <div className="radio-group">
                <label>
                  <input
                    type="radio"
                    name="clientGender"
                    value="male"
                    checked={formData.clientGender === 'male'}
                    onChange={handleChange}
                  />
                  Male
                </label>
                <label>
                  <input
                    type="radio"
                    name="clientGender"
                    value="female"
                    checked={formData.clientGender === 'female'}
                    onChange={handleChange}
                  />
                  Female
                </label>
              </div>
            </div>

            <div className="form-group">
              <label>Base (Optional)</label>
              <div className="radio-group">
                <label>
                  <input
                    type="radio"
                    name="clientBase"
                    value="landbased"
                    checked={formData.clientBase === 'landbased'}
                    onChange={handleChange}
                  />
                  Landbased
                </label>
                <label>
                  <input
                    type="radio"
                    name="clientBase"
                    value="seabased"
                    checked={formData.clientBase === 'seabased'}
                    onChange={handleChange}
                  />
                  Seabased
                </label>
              </div>
            </div>

            <div className="form-group">
              <label>Employment Status (Optional)</label>
              <div className="radio-group">
                <label>
                  <input
                    type="radio"
                    name="clientDeployed"
                    value="deployed"
                    checked={formData.clientDeployed === 'deployed'}
                    onChange={handleChange}
                  />
                  Deployed
                </label>
                <label>
                  <input
                    type="radio"
                    name="clientDeployed"
                    value="non_deployed"
                    checked={formData.clientDeployed === 'non_deployed'}
                    onChange={handleChange}
                  />
                  Non-Deployed
                </label>
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="clientIndigency"
                  checked={formData.clientIndigency}
                  onChange={handleChange}
                />
                Indigency
              </label>
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="clientParent"
                  checked={formData.clientParent}
                  onChange={handleChange}
                />
                Parent
              </label>
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="clientPWD"
                  checked={formData.clientPWD}
                  onChange={handleChange}
                />
                PWD (Person with Disability)
              </label>
            </div>
          </div>

          <div className="form-group">
            <label>Client Email(s) <span style={{color: 'red'}}>*</span> (At least 1 required)</label>
            <div className="email-list">
              {clientEmails.map((email, index) => (
                <div key={index} className="email-item">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => handleClientEmailChange(index, e.target.value)}
                    placeholder="client@example.com"
                    required
                  />
                  {clientEmails.length > 1 && (
                    <button
                      type="button"
                      className="btn-remove-email"
                      onClick={() => removeClientEmail(index)}
                      title="Remove email"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="email-add-section">
              <input
                type="email"
                value={newClientEmail}
                onChange={(e) => setNewClientEmail(e.target.value)}
                placeholder="Add another client email..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addClientEmail())}
              />
              <button
                type="button"
                className="btn-add-email"
                onClick={addClientEmail}
              >
                + Add Email
              </button>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="clientStatus">Client Status <span style={{color: 'red'}}>*</span></label>
              <select
                id="clientStatus"
                name="clientStatus"
                value={formData.clientStatus}
                onChange={handleChange}
                required
              >
                <option value="scheduled">SCHEDULED</option>
                <option value="drop_due_to_absences">DROP DUE TO ABSENCES</option>
                <option value="drop_due_to_lack_of_interest">DROP DUE TO LACK OF INTEREST</option>
                <option value="endorse_to_adjudicator">ENDORSE TO ADJUDICATOR</option>
                <option value="nlrc">NLRC</option>
                <option value="ongoing">ONGOING</option>
                <option value="settled">SETTLED</option>
                <option value="withdrawn">WITHDRAWN</option>
              </select>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Respondent/Agency Information</h2>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="agencySelect">Select Agency or Enter New</label>
              <select
                id="agencySelect"
                value={formData.agencyName}
                onChange={handleAgencySelect}
              >
                <option value="new">Select Agency</option>
                {agencies.map((agency, index) => (
                  <option key={index} value={agency.agencyName}>
                    {agency.agencyName}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="agencyName">Agency Name <span style={{color: 'red'}}>*</span></label>
              <input
                type="text"
                id="agencyName"
                name="agencyName"
                value={formData.agencyName}
                onChange={handleChange}
                required
                placeholder="Enter agency name..."
              />
            </div>
            <div className="form-group">
              <label htmlFor="agencyDescription">Agency Description (Optional)</label>
              <input
                type="text"
                id="agencyDescription"
                name="agencyDescription"
                value={formData.agencyDescription}
                onChange={handleChange}
                placeholder="Brief description of the agency"
              />
            </div>
            <div className="form-group">
              <label htmlFor="agencyContactNumber">Agency Contact Number (Optional)</label>
              <input
                type="tel"
                id="agencyContactNumber"
                name="agencyContactNumber"
                value={formData.agencyContactNumber}
                onChange={handleChange}
                placeholder="Contact number of the agency/respondent"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Respondent Email(s) <span style={{color: 'red'}}>*</span> (At least 1 required)</label>
            <div className="email-list">
              {respondentEmails.map((email, index) => (
                <div key={index} className="email-item">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => handleRespondentEmailChange(index, e.target.value)}
                    placeholder="respondent@example.com"
                    required
                  />
                  {respondentEmails.length > 1 && (
                    <button
                      type="button"
                      className="btn-remove-email"
                      onClick={() => removeRespondentEmail(index)}
                      title="Remove email"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="email-add-section">
              <input
                type="email"
                value={newRespondentEmail}
                onChange={(e) => setNewRespondentEmail(e.target.value)}
                placeholder="Add another respondent email..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRespondentEmail())}
              />
              <button
                type="button"
                className="btn-add-email"
                onClick={addRespondentEmail}
              >
                + Add Email
              </button>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="respondentStatus">Respondent Status <span style={{color: 'red'}}>*</span></label>
              <select
                id="respondentStatus"
                name="respondentStatus"
                value={formData.respondentStatus}
                onChange={handleChange}
                required
              >
                <option value="scheduled">SCHEDULED</option>
                <option value="drop_due_to_absences">DROP DUE TO ABSENCES</option>
                <option value="drop_due_to_lack_of_interest">DROP DUE TO LACK OF INTEREST</option>
                <option value="endorse_to_adjudicator">ENDORSE TO ADJUDICATOR</option>
                <option value="nlrc">NLRC</option>
                <option value="ongoing">ONGOING</option>
                <option value="settled">SETTLED</option>
                <option value="withdrawn">WITHDRAWN</option>
              </select>
            </div>
            {(formData.clientStatus === 'settled' || formData.respondentStatus === 'settled') && (
              <div className="form-group">
                <label htmlFor="settledDate">Settled Date</label>
                <input
                  type="date"
                  id="settledDate"
                  name="settledDate"
                  value={formData.settledDate}
                  onChange={handleChange}
                  placeholder="Date when settlement was completed"
                />
              </div>
            )}
          </div>
        </div>

        <div className="form-section">
          <h2>Appointment Details</h2>
          
          <div className="appointment-list">
            {appointments.map((appointment, index) => (
              <div key={index} className="appointment-item">
                <div className="appointment-fields">
                  <div className="form-group">
                    <label>Date of Appointment <span style={{color: 'red'}}>*</span></label>
                    <input
                      type="date"
                      value={appointment.dateOfAppointment}
                      onChange={(e) => handleAppointmentChange(index, 'dateOfAppointment', e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Start Time</label>
                    <input
                      type="time"
                      value={appointment.startTime}
                      onChange={(e) => handleAppointmentChange(index, 'startTime', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>End Time</label>
                    <input
                      type="time"
                      value={appointment.endTime}
                      onChange={(e) => handleAppointmentChange(index, 'endTime', e.target.value)}
                    />
                  </div>
                </div>
                {appointments.length > 1 && (
                  <button
                    type="button"
                    className="btn-remove-appointment"
                    onClick={() => removeAppointment(index)}
                    title="Remove appointment"
                  >
                    ✕ Remove
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="appointment-add-section">
            <div className="appointment-fields">
              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  value={newAppointment.dateOfAppointment}
                  onChange={(e) => setNewAppointment({ ...newAppointment, dateOfAppointment: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Start Time</label>
                <input
                  type="time"
                  value={newAppointment.startTime}
                  onChange={(e) => setNewAppointment({ ...newAppointment, startTime: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>End Time</label>
                <input
                  type="time"
                  value={newAppointment.endTime}
                  onChange={(e) => setNewAppointment({ ...newAppointment, endTime: e.target.value })}
                />
              </div>
            </div>
            <button
              type="button"
              className="btn-add-appointment"
              onClick={addAppointment}
            >
              + Add Appointment
            </button>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            {isEditMode ? 'Update Record' : 'Create Record'}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/sena-records')}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default SenaRecordForm;
