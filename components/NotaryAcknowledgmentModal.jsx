'use client';

import React, { useState, useEffect } from 'react';
import { X, FileText, MapPin, Calendar, User, Shield, AlertCircle, Check, Lock, Eye, ExternalLink } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { getUserData } from '@/firebase';

const NotaryAcknowledgmentModal = ({ 
  isOpen, 
  onClose, 
  onSave,
  documentType,
  clientData,
  existingData = {},
  sessionData = null // Add sessionData to get identification document
}) => {
  const [acknowledgmentData, setAcknowledgmentData] = useState({
    // Location Information
    notaryState: '',
    notaryCounty: '',
    notaryCity: '',
    
    // Notary Information
    notaryName: '',
    notaryCommissionNumber: '',
    notaryCommissionExpiry: '',
    
    // Document & Client Information
    notarizationDate: new Date().toISOString().split('T')[0],
    clientFullName: '',
    documentTitle: documentType || '',
    
    // Identification Details
    identificationType: '',
    identificationNumber: '',
    identificationExpiry: '',
    
    // Acknowledgment Type
    acknowledgmentType: 'individual', // individual, corporate, attorney-in-fact
    capacity: '', // if acting in a capacity
    
    // Additional Fields for Different Document Types
    witnessName1: '',
    witnessAddress1: '',
    witnessName2: '',
    witnessAddress2: '',
    
    // Notary Notes
    notaryNotes: '',
    
    // Verification Status
    identityVerified: false,
    documentReviewed: false,
    willingnessConfirmed: false,
    noDuressConfirmed: false
  });

  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState('location');
  const [loadingNotaryData, setLoadingNotaryData] = useState(false);
  const [identificationDocUrl, setIdentificationDocUrl] = useState(null);
  
  // Get current user from auth store
  const user = useAuthStore((s) => s.user);

  // Effect to fetch notary name and jurisdiction from database
  useEffect(() => {
    const fetchNotaryData = async () => {
      if (!user?.uid) return;
      
      setLoadingNotaryData(true);
      try {
        const result = await getUserData(user.uid);
        if (result.success && result.data) {
          const userData = result.data;
          
          // Auto-populate notary name
          if (userData.name) {
            console.log('Auto-populated notary name:', userData.name);
          }
          
          // Auto-populate location from jurisdictionOfPractice
          let notaryState = '';
          let notaryCounty = '';
          
          if (userData.jurisdictionOfPractice) {
            console.log('Found jurisdiction of practice:', userData.jurisdictionOfPractice);
            
            // Map Caribbean jurisdictions to state and county
            switch (userData.jurisdictionOfPractice) {
              case 'Barbados':
                notaryState = 'Barbados';
                notaryCounty = 'Barbados';
                break;
              case 'Guyana':
                notaryState = 'Guyana';
                notaryCounty = 'Demerara-Mahaica'; // Default to Georgetown region
                break;
              case 'Jamaica':
                notaryState = 'Jamaica';
                notaryCounty = 'Kingston and St. Andrew'; // Default to capital region
                break;
              case 'Trinidad & Tobago':
                notaryState = 'Trinidad and Tobago';
                notaryCounty = 'Port of Spain'; // Default to capital region
                break;
              default:
                notaryState = userData.jurisdictionOfPractice;
                notaryCounty = userData.jurisdictionOfPractice;
            }
            
            console.log('Auto-populated location - State:', notaryState, 'County:', notaryCounty);
          }
          
          setAcknowledgmentData(prev => ({
            ...prev,
            notaryName: userData.name || '',
            notaryState: notaryState,
            notaryCounty: notaryCounty
          }));
          
          if (userData.name) {
            console.log('✅ Auto-populated notary name:', userData.name);
          }
          if (notaryState && notaryCounty) {
            console.log('✅ Auto-populated location:', notaryState, '-', notaryCounty);
          }
        } else {
          console.warn('Could not fetch notary data from database');
        }
      } catch (error) {
        console.error('Error fetching notary data:', error);
        toast.error('Could not load your notary information');
      } finally {
        setLoadingNotaryData(false);
      }
    };
    
    // Only fetch if modal is open and we have a user
    if (isOpen && user?.uid) {
      fetchNotaryData();
    }
  }, [isOpen, user?.uid]);

  useEffect(() => {
    // Pre-fill with existing data or client data
    if (existingData && Object.keys(existingData).length > 0) {
      setAcknowledgmentData(prev => ({
        ...prev,
        ...existingData
      }));
    }
    
    // Pre-fill client name if available
    if (clientData) {
      const fullName = `${clientData.firstName || ''} ${clientData.middleName || ''} ${clientData.lastName || ''}`.trim();
      setAcknowledgmentData(prev => ({
        ...prev,
        clientFullName: fullName
      }));
    }
    
    // Get identification document URL from various sources
    let identificationUrl = null;
    
    console.log('🔍 Searching for identification document URL in:');
    console.log('  sessionData:', sessionData);
    console.log('  clientData:', clientData);
    
    // Check session data first (notary session)
    if (sessionData?.step1?.identificationImageUrl) {
      identificationUrl = sessionData.step1.identificationImageUrl;
      console.log('✅ Found identification URL in sessionData.step1:', identificationUrl);
    }
    // Check client data (direct client data)
    else if (clientData?.identificationImageUrl) {
      identificationUrl = clientData.identificationImageUrl;
      console.log('✅ Found identification URL in clientData:', identificationUrl);
    }
    // Check if it's in the document forms data
    else if (sessionData?.documentForms?.identificationImageUrl) {
      identificationUrl = sessionData.documentForms.identificationImageUrl;
      console.log('✅ Found identification URL in sessionData.documentForms:', identificationUrl);
    }
    else {
      console.log('❌ No identification document URL found in any data source');
    }
    
    setIdentificationDocUrl(identificationUrl);
  }, [existingData, clientData, sessionData]);

  const handleFieldChange = (field, value) => {
    setAcknowledgmentData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Required fields validation
    if (!acknowledgmentData.notaryState) newErrors.notaryState = 'State is required';
    if (!acknowledgmentData.notaryCounty) newErrors.notaryCounty = 'County is required';
    if (!acknowledgmentData.notaryName) newErrors.notaryName = 'Notary name is required';
    if (!acknowledgmentData.notaryCommissionNumber) newErrors.notaryCommissionNumber = 'Commission number is required';
    if (!acknowledgmentData.clientFullName) newErrors.clientFullName = 'Client name is required';
    if (!acknowledgmentData.notarizationDate) newErrors.notarizationDate = 'Date is required';
    
    // Verification checklist
    if (!acknowledgmentData.identityVerified) newErrors.identityVerified = 'Identity must be verified';
    if (!acknowledgmentData.documentReviewed) newErrors.documentReviewed = 'Document must be reviewed';
    if (!acknowledgmentData.willingnessConfirmed) newErrors.willingnessConfirmed = 'Willingness must be confirmed';
    if (!acknowledgmentData.noDuressConfirmed) newErrors.noDuressConfirmed = 'No duress must be confirmed';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    // Generate acknowledgment text based on type
    const acknowledgmentText = generateAcknowledgmentText();
    
    const dataToSave = {
      ...acknowledgmentData,
      acknowledgmentText,
      timestamp: new Date().toISOString(),
      notarySignature: acknowledgmentData.notaryName // This could be replaced with actual signature
    };
    
    onSave(dataToSave);
    toast.success('Acknowledgment details saved successfully');
    onClose();
  };

  const generateAcknowledgmentText = () => {
    const { 
      notaryState, 
      notaryCounty, 
      notarizationDate, 
      notaryName, 
      clientFullName,
      acknowledgmentType,
      capacity
    } = acknowledgmentData;
    
    let text = `State of ${notaryState}\nCounty of ${notaryCounty}\n\n`;
    
    text += `On ${new Date(notarizationDate).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}, before me, ${notaryName}, a Notary Public, personally appeared ${clientFullName}, `;
    
    if (acknowledgmentType === 'individual') {
      text += `who proved to me on the basis of satisfactory evidence to be the person whose name is subscribed to the within instrument and acknowledged to me that they executed the same in their authorized capacity, and that by their signature on the instrument the person, or the entity upon behalf of which the person acted, executed the instrument.`;
    } else if (acknowledgmentType === 'corporate') {
      text += `who proved to me on the basis of satisfactory evidence to be the person who executed this instrument as ${capacity} of the entity named herein, and acknowledged that such entity executed it.`;
    } else if (acknowledgmentType === 'attorney-in-fact') {
      text += `who proved to me on the basis of satisfactory evidence to be the person whose name is subscribed as attorney-in-fact for the principal named in the within instrument and acknowledged to me that they subscribed the principal's name to the within instrument pursuant to a power of attorney and that they executed the same as the act and deed of said principal.`;
    }
    
    text += `\n\nI certify under PENALTY OF PERJURY under the laws of the State of ${notaryState} that the foregoing paragraph is true and correct.\n\nWITNESS my hand and official seal.`;
    
    return text;
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'location', label: 'Location', icon: MapPin },
    { id: 'notary', label: 'Notary Info', icon: Shield },
    { id: 'client', label: 'Client & Document', icon: User },
    { id: 'verification', label: 'Verification', icon: Check },
    { id: 'additional', label: 'Additional', icon: FileText }
  ];

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999 }}>
      <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable" style={{ maxWidth: '85%', width: '85%' }}>
        <div className="modal-content" style={{ maxHeight: '90vh', minHeight: '70vh' }}>
          <div className="modal-header" style={{ backgroundColor: '#274171', color: 'white' }}>
            <h5 className="modal-title d-flex align-items-center">
              <Shield className="me-2" size={24} />
              Notary Acknowledgment Details
            </h5>
            <button 
              type="button" 
              className="btn-close btn-close-white" 
              onClick={onClose}
              aria-label="Close"
            ></button>
          </div>
          
          <div className="modal-body" style={{ maxHeight: 'calc(90vh - 180px)', overflowY: 'auto', padding: '25px 35px' }}>
            {/* Tab Navigation */}
            <ul className="nav nav-tabs mb-3">
              {tabs.map(tab => (
                <li key={tab.id} className="nav-item">
                  <button
                    className={`nav-link ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      backgroundColor: activeTab === tab.id ? '#274171' : 'transparent',
                      color: activeTab === tab.id ? 'white' : '#6b7280',
                      border: activeTab === tab.id ? '1px solid #274171' : '1px solid #d1d5db',
                      borderBottom: activeTab === tab.id ? 'none' : '1px solid #d1d5db',
                      fontWeight: activeTab === tab.id ? '600' : '400'
                    }}
                  >
                    <tab.icon size={18} className="me-2" />
                    {tab.label}
                  </button>
                </li>
              ))}
            </ul>

            {/* Tab Content */}
            <div className="tab-content">
              {/* Location Tab */}
              {activeTab === 'location' && (
                <div className="tab-pane fade show active">
                  <h6 className="mb-3" style={{ color: '#274171', fontWeight: '600', borderBottom: '2px solid #274171', paddingBottom: '8px' }}>Notarization Location</h6>
                  <div className="row">
                    <div className="col-lg-6 col-md-12 mb-3">
                      <label className="form-label">
                        State <span className="text-danger">*</span>
                        {loadingNotaryData && <small className="text-muted ms-2">Loading...</small>}
                      </label>
                      <div className="position-relative">
                        <input
                          type="text"
                          className={`form-control ${errors.notaryState ? 'is-invalid' : ''} ${loadingNotaryData ? 'pe-5' : ''}`}
                          value={acknowledgmentData.notaryState}
                          placeholder={loadingNotaryData ? "Loading..." : "Auto-filled from your jurisdiction"}
                          readOnly
                          disabled
                          title="This value is auto-filled from your jurisdiction of practice"
                          style={{
                            backgroundColor: '#f8f9fa',
                            color: '#6c757d',
                            fontWeight: '600',
                            cursor: 'not-allowed',
                            border: '2px solid #e9ecef'
                          }}
                        />
                        {loadingNotaryData ? (
                          <div className="position-absolute top-50 end-0 translate-middle-y pe-3">
                            <div className="spinner-border spinner-border-sm text-primary" role="status">
                              <span className="visually-hidden">Loading...</span>
                            </div>
                          </div>
                        ) : (
                          <div className="position-absolute top-50 end-0 translate-middle-y pe-3">
                            <Lock size={16} className="text-muted" title="Auto-filled from your jurisdiction" />
                          </div>
                        )}
                      </div>
                      {errors.notaryState && (
                        <div className="invalid-feedback">{errors.notaryState}</div>
                      )}
                      {!loadingNotaryData && acknowledgmentData.notaryState && (
                        <small className="form-text text-success">
                          ✓ Auto-filled from your jurisdiction: {acknowledgmentData.notaryState}
                        </small>
                      )}
                    </div>
                    <div className="col-lg-6 col-md-12 mb-3">
                      <label className="form-label">
                        County/Region <span className="text-danger">*</span>
                        {loadingNotaryData && <small className="text-muted ms-2">Loading...</small>}
                      </label>
                      <div className="position-relative">
                        <input
                          type="text"
                          className={`form-control ${errors.notaryCounty ? 'is-invalid' : ''} ${loadingNotaryData ? 'pe-5' : ''}`}
                          value={acknowledgmentData.notaryCounty}
                          placeholder={loadingNotaryData ? "Loading..." : "Auto-filled from your jurisdiction"}
                          readOnly
                          disabled
                          title="This value is auto-filled from your jurisdiction of practice"
                          style={{
                            backgroundColor: '#f8f9fa',
                            color: '#6c757d',
                            fontWeight: '600',
                            cursor: 'not-allowed',
                            border: '2px solid #e9ecef'
                          }}
                        />
                        {loadingNotaryData ? (
                          <div className="position-absolute top-50 end-0 translate-middle-y pe-3">
                            <div className="spinner-border spinner-border-sm text-primary" role="status">
                              <span className="visually-hidden">Loading...</span>
                            </div>
                          </div>
                        ) : (
                          <div className="position-absolute top-50 end-0 translate-middle-y pe-3">
                            <Lock size={16} className="text-muted" title="Auto-filled from your jurisdiction" />
                          </div>
                        )}
                      </div>
                      {errors.notaryCounty && (
                        <div className="invalid-feedback">{errors.notaryCounty}</div>
                      )}
                      {!loadingNotaryData && acknowledgmentData.notaryCounty && (
                        <small className="form-text text-success">
                          ✓ Auto-filled from your jurisdiction: {acknowledgmentData.notaryCounty}
                        </small>
                      )}
                    </div>
                    <div className="col-lg-6 col-md-12 mb-3">
                      <label className="form-label">City</label>
                      <input
                        type="text"
                        className="form-control"
                        value={acknowledgmentData.notaryCity}
                        onChange={(e) => handleFieldChange('notaryCity', e.target.value)}
                        placeholder="e.g., Los Angeles"
                      />
                    </div>
                    <div className="col-lg-6 col-md-12 mb-3">
                      <label className="form-label">
                        Date of Notarization <span className="text-danger">*</span>
                      </label>
                      <input
                        type="date"
                        className={`form-control ${errors.notarizationDate ? 'is-invalid' : ''}`}
                        value={acknowledgmentData.notarizationDate}
                        onChange={(e) => handleFieldChange('notarizationDate', e.target.value)}
                      />
                      {errors.notarizationDate && (
                        <div className="invalid-feedback">{errors.notarizationDate}</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Notary Info Tab */}
              {activeTab === 'notary' && (
                <div className="tab-pane fade show active">
                  <h6 className="mb-3" style={{ color: '#274171', fontWeight: '600', borderBottom: '2px solid #274171', paddingBottom: '8px' }}>Notary Information</h6>
                  <div className="row">
                    <div className="col-12 mb-3">
                      <label className="form-label">
                        Notary Full Name <span className="text-danger">*</span>
                        {loadingNotaryData && <small className="text-muted ms-2">Loading your info...</small>}
                      </label>
                      <div className="position-relative">
                        <input
                          type="text"
                          className={`form-control ${errors.notaryName ? 'is-invalid' : ''} ${loadingNotaryData ? 'pe-5' : ''}`}
                          value={acknowledgmentData.notaryName}
                          placeholder={loadingNotaryData ? "Loading..." : "Auto-filled from your profile"}
                          readOnly
                          disabled
                          title="This value is locked to your profile"
                          style={{
                            backgroundColor: '#f8f9fa',
                            color: '#6c757d',
                            fontWeight: '600',
                            cursor: 'not-allowed',
                            border: '2px solid #e9ecef'
                          }}
                        />
                        {loadingNotaryData ? (
                          <div className="position-absolute top-50 end-0 translate-middle-y pe-3">
                            <div className="spinner-border spinner-border-sm text-primary" role="status">
                              <span className="visually-hidden">Loading...</span>
                            </div>
                          </div>
                        ) : (
                          <div className="position-absolute top-50 end-0 translate-middle-y pe-3">
                            <Lock size={16} className="text-muted" title="This field is locked to your profile" />
                          </div>
                        )}
                      </div>
                      {errors.notaryName && (
                        <div className="invalid-feedback">{errors.notaryName}</div>
                      )}
                      {!loadingNotaryData && acknowledgmentData.notaryName && (
                        <small className="form-text text-success">
                          ✓ Locked to your profile
                        </small>
                      )}
                    </div>
                    <div className="col-lg-6 col-md-12 mb-3">
                      <label className="form-label">
                        Commission Number <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className={`form-control ${errors.notaryCommissionNumber ? 'is-invalid' : ''}`}
                        value={acknowledgmentData.notaryCommissionNumber}
                        onChange={(e) => handleFieldChange('notaryCommissionNumber', e.target.value)}
                        placeholder="e.g., 12345678"
                      />
                      {errors.notaryCommissionNumber && (
                        <div className="invalid-feedback">{errors.notaryCommissionNumber}</div>
                      )}
                    </div>
                    <div className="col-lg-6 col-md-12 mb-3">
                      <label className="form-label">Commission Expiry Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={acknowledgmentData.notaryCommissionExpiry}
                        onChange={(e) => handleFieldChange('notaryCommissionExpiry', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Client & Document Tab */}
              {activeTab === 'client' && (
                <div className="tab-pane fade show active">
                  <h6 className="mb-3" style={{ color: '#274171', fontWeight: '600', borderBottom: '2px solid #274171', paddingBottom: '8px' }}>Client & Document Information</h6>
                  <div className="row">
                    <div className="col-lg-6 col-md-12 mb-3">
                      <label className="form-label">
                        Client Full Name (as appeared) <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className={`form-control ${errors.clientFullName ? 'is-invalid' : ''}`}
                        value={acknowledgmentData.clientFullName}
                        onChange={(e) => handleFieldChange('clientFullName', e.target.value)}
                        placeholder="Enter client's full legal name"
                      />
                      {errors.clientFullName && (
                        <div className="invalid-feedback">{errors.clientFullName}</div>
                      )}
                    </div>
                    <div className="col-lg-6 col-md-12 mb-3">
                      <label className="form-label">Document Title</label>
                      <input
                        type="text"
                        className="form-control"
                        value={acknowledgmentData.documentTitle}
                        onChange={(e) => handleFieldChange('documentTitle', e.target.value)}
                        placeholder="e.g., Affidavit of Identity"
                      />
                    </div>
                    <div className="col-lg-6 col-md-12 mb-3">
                      <label className="form-label">Acknowledgment Type</label>
                      <select
                        className="form-select"
                        value={acknowledgmentData.acknowledgmentType}
                        onChange={(e) => handleFieldChange('acknowledgmentType', e.target.value)}
                      >
                        <option value="individual">Individual</option>
                        <option value="corporate">Corporate Representative</option>
                        <option value="attorney-in-fact">Attorney-in-Fact</option>
                      </select>
                    </div>
                    {acknowledgmentData.acknowledgmentType !== 'individual' && (
                      <div className="col-lg-6 col-md-12 mb-3">
                        <label className="form-label">Capacity/Title</label>
                        <input
                          type="text"
                          className="form-control"
                          value={acknowledgmentData.capacity}
                          onChange={(e) => handleFieldChange('capacity', e.target.value)}
                          placeholder="e.g., CEO, Attorney-in-Fact"
                        />
                      </div>
                    )}
                    <div className="col-lg-6 col-md-12 mb-3">
                      <label className="form-label">ID Type Used</label>
                      <select
                        className="form-select"
                        value={acknowledgmentData.identificationType}
                        onChange={(e) => handleFieldChange('identificationType', e.target.value)}
                      >
                        <option value="">Select ID Type</option>
                        <option value="drivers-license">Driver's License</option>
                        <option value="passport">Passport</option>
                        <option value="state-id">State ID</option>
                        <option value="military-id">Military ID</option>
                      </select>
                    </div>
                    <div className="col-lg-6 col-md-12 mb-3">
                      <label className="form-label">ID Number</label>
                      <input
                        type="text"
                        className="form-control"
                        value={acknowledgmentData.identificationNumber}
                        onChange={(e) => handleFieldChange('identificationNumber', e.target.value)}
                        placeholder="Last 4 digits only"
                        maxLength="4"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Verification Tab */}
              {activeTab === 'verification' && (
                <div className="tab-pane fade show active">
                  <h6 className="mb-3" style={{ color: '#274171', fontWeight: '600', borderBottom: '2px solid #274171', paddingBottom: '8px' }}>Verification Checklist</h6>
                  <div className="alert alert-info mb-3">
                    <AlertCircle size={16} className="me-2" />
                    Please confirm all verification steps before proceeding
                  </div>
                  
                  <div className="list-group">
                    <div className={`list-group-item ${errors.identityVerified ? 'border-danger border-2' : ''} ${acknowledgmentData.identityVerified ? 'bg-light' : ''}`} 
                         style={{ padding: '15px', cursor: 'pointer' }}
                         onClick={() => handleFieldChange('identityVerified', !acknowledgmentData.identityVerified)}>
                      <div className="d-flex align-items-start">
                        <input
                          className="form-check-input mt-1"
                          type="checkbox"
                          checked={acknowledgmentData.identityVerified}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleFieldChange('identityVerified', e.target.checked);
                          }}
                          style={{ 
                            width: '20px', 
                            height: '20px', 
                            border: '2px solid #274171',
                            cursor: 'pointer',
                            flexShrink: 0
                          }}
                        />
                        <div className="ms-3">
                          <strong className="d-block mb-1" style={{ color: '#274171' }}>Identity Verified</strong>
                          <small className="text-muted">
                            I have verified the identity of the signer through satisfactory evidence
                          </small>
                        </div>
                      </div>
                    </div>
                    
                    <div className={`list-group-item ${errors.documentReviewed ? 'border-danger border-2' : ''} ${acknowledgmentData.documentReviewed ? 'bg-light' : ''}`}
                         style={{ padding: '15px', cursor: 'pointer' }}
                         onClick={() => handleFieldChange('documentReviewed', !acknowledgmentData.documentReviewed)}>
                      <div className="d-flex align-items-start">
                        <input
                          className="form-check-input mt-1"
                          type="checkbox"
                          checked={acknowledgmentData.documentReviewed}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleFieldChange('documentReviewed', e.target.checked);
                          }}
                          style={{ 
                            width: '20px', 
                            height: '20px', 
                            border: '2px solid #274171',
                            cursor: 'pointer',
                            flexShrink: 0
                          }}
                        />
                        <div className="ms-3">
                          <strong className="d-block mb-1" style={{ color: '#274171' }}>Document Reviewed</strong>
                          <small className="text-muted">
                            The signer understands the document content
                          </small>
                        </div>
                      </div>
                    </div>
                    
                    <div className={`list-group-item ${errors.willingnessConfirmed ? 'border-danger border-2' : ''} ${acknowledgmentData.willingnessConfirmed ? 'bg-light' : ''}`}
                         style={{ padding: '15px', cursor: 'pointer' }}
                         onClick={() => handleFieldChange('willingnessConfirmed', !acknowledgmentData.willingnessConfirmed)}>
                      <div className="d-flex align-items-start">
                        <input
                          className="form-check-input mt-1"
                          type="checkbox"
                          checked={acknowledgmentData.willingnessConfirmed}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleFieldChange('willingnessConfirmed', e.target.checked);
                          }}
                          style={{ 
                            width: '20px', 
                            height: '20px', 
                            border: '2px solid #274171',
                            cursor: 'pointer',
                            flexShrink: 0
                          }}
                        />
                        <div className="ms-3">
                          <strong className="d-block mb-1" style={{ color: '#274171' }}>Willingness Confirmed</strong>
                          <small className="text-muted">
                            The signer is willingly signing this document
                          </small>
                        </div>
                      </div>
                    </div>
                    
                    <div className={`list-group-item ${errors.noDuressConfirmed ? 'border-danger border-2' : ''} ${acknowledgmentData.noDuressConfirmed ? 'bg-light' : ''}`}
                         style={{ padding: '15px', cursor: 'pointer' }}
                         onClick={() => handleFieldChange('noDuressConfirmed', !acknowledgmentData.noDuressConfirmed)}>
                      <div className="d-flex align-items-start">
                        <input
                          className="form-check-input mt-1"
                          type="checkbox"
                          checked={acknowledgmentData.noDuressConfirmed}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleFieldChange('noDuressConfirmed', e.target.checked);
                          }}
                          style={{ 
                            width: '20px', 
                            height: '20px', 
                            border: '2px solid #274171',
                            cursor: 'pointer',
                            flexShrink: 0
                          }}
                        />
                        <div className="ms-3">
                          <strong className="d-block mb-1" style={{ color: '#274171' }}>No Duress/Coercion</strong>
                          <small className="text-muted">
                            The signer is acting of their own free will without duress
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Identification Document Preview Section */}
                  <div className="mt-4">
                    <h6 className="mb-3" style={{ color: '#274171', fontWeight: '600', borderBottom: '2px solid #274171', paddingBottom: '8px' }}>Client Identification Document</h6>
                    
                    {identificationDocUrl ? (
                      <div className="card" style={{ border: '1px solid #e9ecef' }}>
                        <div className="card-body p-3">
                          <div className="d-flex align-items-center justify-content-between">
                            <div className="d-flex align-items-center">
                              <div 
                                className="rounded-circle me-3 d-flex align-items-center justify-content-center"
                                style={{ 
                                  width: '48px', 
                                  height: '48px', 
                                  backgroundColor: '#F3F4F6',
                                  border: '2px solid #274171'
                                }}
                              >
                                <FileText size={20} style={{ color: '#274171' }} />
                              </div>
                              <div>
                                <div className="fw-bold" style={{ color: '#2D3748', fontSize: '14px' }}>
                                  Client Identification Document
                                </div>
                                <small className="text-muted">
                                  Uploaded by client during form submission
                                </small>
                              </div>
                            </div>
                            <div className="d-flex gap-2">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-primary d-flex align-items-center"
                                onClick={() => window.open(identificationDocUrl, '_blank')}
                                style={{
                                  borderColor: '#274171',
                                  color: '#274171',
                                  fontSize: '12px',
                                  padding: '6px 12px'
                                }}
                              >
                                <Eye size={14} className="me-1" />
                                Preview
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm"
                                onClick={() => window.open(identificationDocUrl, '_blank')}
                                style={{
                                  backgroundColor: '#274171',
                                  color: 'white',
                                  border: 'none',
                                  fontSize: '12px',
                                  padding: '6px 12px'
                                }}
                              >
                                <ExternalLink size={14} className="me-1" />
                                Open
                              </button>
                            </div>
                          </div>
                          
                          {/* Quick preview iframe for PDF */}
                          <div className="mt-3" style={{ borderTop: '1px solid #e9ecef', paddingTop: '12px' }}>
                            <small className="text-muted d-block mb-2">Document Preview:</small>
                            <div 
                              style={{
                                border: '1px solid #e9ecef',
                                borderRadius: '4px',
                                overflow: 'hidden',
                                height: '200px'
                              }}
                            >
                              <iframe
                                src={`${identificationDocUrl}#view=FitH`}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  border: 'none'
                                }}
                                title="Identification Document Preview"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="alert alert-warning d-flex align-items-center">
                        <AlertCircle size={16} className="me-2" />
                        <div>
                          <strong>No identification document found</strong>
                          <br />
                          <small>The client may not have uploaded their identification document yet.</small>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Additional Tab */}
              {activeTab === 'additional' && (
                <div className="tab-pane fade show active">
                  <h6 className="mb-3" style={{ color: '#274171', fontWeight: '600', borderBottom: '2px solid #274171', paddingBottom: '8px' }}>Additional Information</h6>
                  
                  {/* Witnesses Section */}
                  <div className="mb-4">
                    <h6 className="text-muted mb-3">Witnesses (if required)</h6>
                    <div className="row">
                      <div className="col-lg-6 col-md-12 mb-2">
                        <input
                          type="text"
                          className="form-control"
                          value={acknowledgmentData.witnessName1}
                          onChange={(e) => handleFieldChange('witnessName1', e.target.value)}
                          placeholder="Witness 1 Name"
                        />
                      </div>
                      <div className="col-lg-6 col-md-12 mb-2">
                        <input
                          type="text"
                          className="form-control"
                          value={acknowledgmentData.witnessAddress1}
                          onChange={(e) => handleFieldChange('witnessAddress1', e.target.value)}
                          placeholder="Witness 1 Address"
                        />
                      </div>
                      <div className="col-lg-6 col-md-12 mb-2">
                        <input
                          type="text"
                          className="form-control"
                          value={acknowledgmentData.witnessName2}
                          onChange={(e) => handleFieldChange('witnessName2', e.target.value)}
                          placeholder="Witness 2 Name"
                        />
                      </div>
                      <div className="col-lg-6 col-md-12 mb-2">
                        <input
                          type="text"
                          className="form-control"
                          value={acknowledgmentData.witnessAddress2}
                          onChange={(e) => handleFieldChange('witnessAddress2', e.target.value)}
                          placeholder="Witness 2 Address"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Notary Notes */}
                  <div className="mb-3">
                    <label className="form-label">Notary Notes</label>
                    <textarea
                      className="form-control"
                      rows="4"
                      value={acknowledgmentData.notaryNotes}
                      onChange={(e) => handleFieldChange('notaryNotes', e.target.value)}
                      placeholder="Any additional notes or observations..."
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Preview Section */}
            <div className="mt-4 p-3 rounded" style={{ backgroundColor: '#f8f9fa', border: '2px solid #274171' }}>
              <h6 className="mb-3" style={{ color: '#274171', fontWeight: '600' }}>
                <FileText className="me-2" size={18} />
                Acknowledgment Preview
              </h6>
              <div className="p-3 bg-white rounded" style={{ border: '1px solid #dee2e6' }}>
                <pre style={{ fontSize: '13px', whiteSpace: 'pre-wrap', fontFamily: 'Georgia, serif', color: '#333' }}>
                  {generateAcknowledgmentText()}
                </pre>
              </div>
            </div>
          </div>
          
          <div className="modal-footer" style={{ backgroundColor: '#f8f9fa', borderTop: '2px solid #274171' }}>
            <button 
              type="button" 
              className="btn btn-outline-secondary px-4" 
              onClick={onClose}
              style={{ borderRadius: '8px' }}
            >
              <X size={16} className="me-2" />
              Cancel
            </button>
            <button 
              type="button" 
              className="btn px-4"
              onClick={handleSave}
              style={{ 
                backgroundColor: '#274171', 
                color: 'white', 
                border: 'none', 
                borderRadius: '8px',
                fontWeight: '600'
              }}
            >
              <Check size={18} className="me-2" />
              Save & Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotaryAcknowledgmentModal;
