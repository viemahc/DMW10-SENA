import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { useAuth } from '../context/AuthContext';
import UploadMinuteModal from '../components/UploadMinuteModal';
import SendEmailModal from '../components/SendEmailModal';
import './SenaRecordsList.css';

const SenaRecordsList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [records, setRecords] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [agencyFilter, setAgencyFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'seadNumber', direction: 'desc' });
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedRecordForUpload, setSelectedRecordForUpload] = useState(null);
  const [showSendEmailModal, setShowSendEmailModal] = useState(false);
  const [selectedRecordForEmail, setSelectedRecordForEmail] = useState(null);

  useEffect(() => {
    const agencyFromUrl = searchParams.get('agency');
    if (agencyFromUrl) {
      setAgencyFilter(agencyFromUrl);
    }
  }, [searchParams]);

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'drop_due_to_absences', label: 'Drop - Absences' },
    { value: 'drop_due_to_lack_of_interest', label: 'Drop - Lack of Interest' },
    { value: 'endorse_to_adjudicator', label: 'Endorse to Adjudicator' },
    { value: 'nlrc', label: 'NLRC' },
    { value: 'ongoing', label: 'Ongoing' },
    { value: 'settled', label: 'Settled' },
    { value: 'withdrawn', label: 'Withdrawn' },
  ];

  useEffect(() => {
    fetchRecords();
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://localhost:8000/auth/admin/users/', {
        withCredentials: true,
      });
      const userData = response.data.users || [];
      setUsers(userData);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:8000/api/sena/records/', {
        withCredentials: true,
      });
      
      const data = Array.isArray(response.data) ? response.data : response.data.results || [];
      setRecords(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching records:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to fetch records');
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = records.filter(record => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      (record.seadNumber || '').toLowerCase().includes(searchLower) ||
      (record.senaTitle || '').toLowerCase().includes(searchLower) ||
      (record.clientFirstName || '').toLowerCase().includes(searchLower) ||
      (record.clientLastName || '').toLowerCase().includes(searchLower) ||
      (record.agency_records?.[0]?.agencyName || '').toLowerCase().includes(searchLower);
    
    const matchesStatus = !statusFilter || record.clientStatus === statusFilter;
    const matchesUser = !userFilter || record.user === parseInt(userFilter);
    const matchesAgency = !agencyFilter || (record.agency_records?.[0]?.agencyName === agencyFilter);
    
    // Date filter
    let matchesDate = true;
    if (dateFrom || dateTo) {
      const recordDate = new Date(record.dateCreated);
      if (dateFrom) {
        const fromDate = new Date(dateFrom);
        matchesDate = matchesDate && recordDate >= fromDate;
      }
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        matchesDate = matchesDate && recordDate <= toDate;
      }
    }
    
    return matchesSearch && matchesStatus && matchesUser && matchesAgency && matchesDate;
  });

  const sortedRecords = [...filteredRecords].sort((a, b) => {
    const aValue = a[sortConfig.key] || '';
    const bValue = b[sortConfig.key] || '';
    
    if (aValue < bValue) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const paginatedRecords = sortedRecords.slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage
  );

  const totalPages = Math.ceil(sortedRecords.length / recordsPerPage);

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc',
    });
  };

  const handleUploadMinute = (record) => {
    setSelectedRecordForUpload(record);
    setShowUploadModal(true);
  };

  const handleUploadSuccess = () => {
    // Refetch records to show the new minute
    fetchRecords();
  };

  const handleSendEmail = (record) => {
    setSelectedRecordForEmail(record);
    setShowSendEmailModal(true);
  };

  const handleSendEmailSuccess = () => {
    // Optionally refetch records or show notification
    setShowSendEmailModal(false);
  };

  const exportToXLSX = () => {
    if (sortedRecords.length === 0) {
      alert('No records to export');
      return;
    }

    const exportData = sortedRecords.map(record => ({
      'SEAD Number': record.seadNumber || '-',
      'SENA Title': record.senaTitle || '-',
      'SENA Purpose': record.senaPurpose || '-',
      'Client First Name': record.clientFirstName || '-',
      'Client Last Name': record.clientLastName || '-',
      'Client Age': record.clientAge || '-',
      'Client Gender': record.clientGender || '-',
      'Client Base': record.clientBase || '-',
      'Client Deployed': record.clientDeployed || '-',
      'Client Contact': record.clientContactNumber || '-',
      'Client Indigency': record.clientIndigency ? 'Yes' : 'No',
      'Client Parent': record.clientParent ? 'Yes' : 'No',
      'Client PWD': record.clientPWD ? 'Yes' : 'No',
      'Agency': record.agency_records?.[0]?.agencyName || '-',
      'Agency Contact': record.agency_records?.[0]?.contact_number || '-',
      'Client Status': record.clientStatus || '-',
      'Respondent Status': record.respondentStatus || '-',
      'Settled Date': record.settledDate || '-',
      'Client Emails': record.clientEmails?.join('; ') || '-',
      'Respondent Emails': record.respondentEmails?.join('; ') || '-',
      'Appointments': record.appointments?.map(a => `${a.dateOfAppointment} (${a.startTime}-${a.endTime})`).join('; ') || '-',
      'Created Date': new Date(record.dateCreated).toLocaleDateString() || '-',
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'SENA Records');

    // Adjust column widths
    const maxWidth = 30;
    const colWidths = Object.keys(exportData[0] || {}).map(() => maxWidth);
    worksheet['!cols'] = colWidths.map(w => ({ wch: w }));

    XLSX.writeFile(workbook, `SENA_Records_${new Date().toISOString().split('T')[0]}.xlsx`);
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
    return <div className="sena-list-container"><div className="loading">Loading records...</div></div>;
  }

  return (
    <div className="sena-list-container">
      <div className="sena-list-header">
        <div>
          <h1>📋 SENA Records List</h1>
          <p>View and manage all SENA records with complete details</p>
        </div>
        <button className="btn-export" onClick={exportToXLSX}>
          📥 Export to XLSX
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="sena-list-filters">
        <div className="filter-group">
          <input
            type="text"
            placeholder="🔍 Search by SEAD, Title, Client name, or Agency..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="search-input"
          />
        </div>

        <div className="filter-group">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="filter-select"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <select
            value={userFilter}
            onChange={(e) => {
              setUserFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="filter-select"
          >
            <option value="">All Users</option>
            {users.map(u => (
              <option key={u.user_id} value={u.user_id}>
                {u.firstName} {u.lastName}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <input
            type="date"
            placeholder="From Date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setCurrentPage(1);
            }}
            className="filter-select"
          />
        </div>

        <div className="filter-group">
          <input
            type="date"
            placeholder="To Date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setCurrentPage(1);
            }}
            className="filter-select"
          />
        </div>

        <div className="filter-group">
          <select
            value={recordsPerPage}
            onChange={(e) => {
              setRecordsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="filter-select"
          >
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
            <option value={sortedRecords.length}>All records</option>
          </select>
        </div>
      </div>

      <div className="records-count">
        Showing {paginatedRecords.length} of {sortedRecords.length} records
      </div>

      <div className="table-wrapper">
        <table className="sena-records-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('seadNumber')}>
                SEAD # {sortConfig.key === 'seadNumber' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('senaTitle')}>
                SENA Title {sortConfig.key === 'senaTitle' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th>SENA Purpose</th>
              <th>Client Name</th>
              <th>Agency</th>
              <th onClick={() => handleSort('clientStatus')}>
                Client Status {sortConfig.key === 'clientStatus' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th>Respondent Status</th>
              <th>Contact</th>
              <th>Appointments</th>
              <th>Minutes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRecords.length === 0 ? (
              <tr>
                <td colSpan="11" className="no-records">No records found</td>
              </tr>
            ) : (
              paginatedRecords.map(record => (
                <tr key={record.sena_id}>
                  <td className="sead-cell">
                    <strong>{record.seadNumber || '-'}</strong>
                  </td>
                  <td>{record.senaTitle || '-'}</td>
                  <td>
                    <span className="badge">{record.senaPurpose || '-'}</span>
                  </td>
                  <td>
                    <div className="client-info">
                      <div className="client-name">
                        {record.clientFirstName} {record.clientLastName}
                      </div>
                      <div className="client-detail">Age: {record.clientAge || '-'}</div>
                    </div>
                  </td>
                  <td>
                    <div className="agency-info">
                      <div>{record.agency_records?.[0]?.agencyName || '-'}</div>
                      {record.agency_records?.[0]?.contact_number && (
                        <div className="agency-contact">{record.agency_records[0].contact_number}</div>
                      )}
                    </div>
                  </td>
                  <td>
                    <span
                      className="status-badge"
                      style={{ backgroundColor: getStatusBadgeColor(record.clientStatus) }}
                    >
                      {record.clientStatus?.replace(/_/g, ' ') || '-'}
                    </span>
                  </td>
                  <td>
                    <span
                      className="status-badge"
                      style={{ backgroundColor: getStatusBadgeColor(record.respondentStatus) }}
                    >
                      {record.respondentStatus?.replace(/_/g, ' ') || '-'}
                    </span>
                  </td>
                  <td>
                    <div className="contact-info">
                      {record.clientContactNumber && (
                        <div>{record.clientContactNumber}</div>
                      )}
                      {record.clientEmails?.length > 0 && (
                        <div className="emails-count">{record.clientEmails.length} emails</div>
                      )}
                    </div>
                  </td>
                  <td>
                    {record.appointments?.length > 0 ? (
                      <div className="appointments-info">
                        <div className="count">{record.appointments.length} apt.</div>
                        <div className="dates">
                          {record.appointments.map((apt, idx) => (
                            <span key={idx}>{apt.dateOfAppointment}</span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <span>-</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      {record.minute ? (
                        <a
                          href={record.minute.minuteFile.startsWith('http') ? record.minute.minuteFile : `http://localhost:8000${record.minute.minuteFile}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-download-minutes"
                          title={record.minute.minuteTitle}
                        >
                          📄 {record.minute.minuteTitle}
                        </a>
                      ) : (
                        <span className="no-minutes">-</span>
                      )}
                      <button
                        className="btn-upload-minute"
                        onClick={() => handleUploadMinute(record)}
                        title={record.minute ? 'Update minute' : 'Upload minute'}
                      >
                        {record.minute ? '📤' : '➕'}
                      </button>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <button
                        className="btn-view"
                        onClick={() => navigate(`/sena-records-detail/${record.sena_id}`)}
                        title="View details"
                      >
                        👁️
                      </button>
                      <button
                        className="btn-send-email"
                        onClick={() => handleSendEmail(record)}
                        title="Send schedule email"
                        disabled={
                          (!record.clientEmails || record.clientEmails.length === 0) &&
                          (!record.respondentEmails || record.respondentEmails.length === 0)
                        }
                      >
                        📧
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="btn-pagination"
          >
            ← Previous
          </button>
          
          <div className="page-info">
            Page {currentPage} of {totalPages}
          </div>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="btn-pagination"
          >
            Next →
          </button>
        </div>
      )}

      <UploadMinuteModal
        isOpen={showUploadModal}
        onClose={() => {
          setShowUploadModal(false);
          setSelectedRecordForUpload(null);
        }}
        recordId={selectedRecordForUpload?.sena_id}
        senaTitle={selectedRecordForUpload?.senaTitle}
        onSuccess={handleUploadSuccess}
      />

      <SendEmailModal
        isOpen={showSendEmailModal}
        onClose={() => {
          setShowSendEmailModal(false);
          setSelectedRecordForEmail(null);
        }}
        record={selectedRecordForEmail}
        onSuccess={handleSendEmailSuccess}
      />
    </div>
  );
};

export default SenaRecordsList;
