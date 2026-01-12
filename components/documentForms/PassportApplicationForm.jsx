'use client';
import React, { useState, useEffect, useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import FormWrapper from '../shared/FormWrapper';

const SignatureField = ({
  label,
  helperText,
  value,
  onChange,
  height = 120,
  style = {}
}) => {
  const canvasRef = useRef(null);
  const storedValueRef = useRef(value || null);
  const [isEmpty, setIsEmpty] = useState(!value);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (value && value !== storedValueRef.current) {
      try {
        canvas.fromDataURL(value);
        storedValueRef.current = value;
        setIsEmpty(false);
      } catch (error) {
        console.warn('Unable to load saved signature', error);
      }
    } else if (!value && storedValueRef.current) {
      canvas.clear();
      storedValueRef.current = null;
      setIsEmpty(true);
    } else if (!value && typeof canvas.isEmpty === 'function' && !canvas.isEmpty()) {
      canvas.clear();
      setIsEmpty(true);
    }
  }, [value]);

  const handleSignatureEnd = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (canvas.isEmpty()) {
      onChange('');
      storedValueRef.current = null;
      setIsEmpty(true);
      return;
    }

    const dataUrl = canvas.getTrimmedCanvas().toDataURL('image/png');
    storedValueRef.current = dataUrl;
    onChange(dataUrl);
    setIsEmpty(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.clear();
    storedValueRef.current = null;
    setIsEmpty(true);
    onChange('');
  };

  return (
    <div style={{ marginBottom: '20px', ...style }}>
      {label && (
        <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#000' }}>
          {label}
        </div>
      )}
      <div
        style={{
          border: '2px solid #333',
          borderRadius: '6px',
          backgroundColor: '#ffffff',
          padding: '12px',
          width: '100%'
        }}
      >
        <div style={{ position: 'relative', width: '100%', height: `${height}px` }}>
          <SignatureCanvas
            ref={canvasRef}
            penColor="#274171"
            backgroundColor="#ffffff"
            throttle={16}
            canvasProps={{
              width: 600,
              height,
              style: {
                width: '100%',
                height: '100%',
                borderRadius: '4px',
                cursor: 'crosshair'
              }
            }}
            onEnd={handleSignatureEnd}
          />
          {isEmpty && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                color: '#A0AEC0',
                pointerEvents: 'none',
                fontSize: '12px',
                textAlign: 'center'
              }}
            >
              Sign here
            </div>
          )}
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '8px'
          }}
        >
          <span style={{ fontSize: '12px', color: '#4A5568' }}>
            {helperText || 'Draw your signature inside the box'}
          </span>
          <button
            type="button"
            onClick={handleClear}
            style={{
              backgroundColor: 'transparent',
              border: '1px solid #274171',
              color: '#274171',
              padding: '4px 12px',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
};

const PassportApplicationForm = ({ formData = {}, onFormDataChange, onProceed }) => {
  const [localFormData, setLocalFormData] = useState({
    // Header Information
    surname: '',
    maidenName: '',
    firstName: '',
    secondName: '',
    thirdName: '',
    
    // FOR OFFICIAL USE ONLY
    passportNumber: '',
    applicantAge: '', // under16 or 16andAbove
    dateOfIssue: '',

    // Signatures
    applicantSignaturePrimary: '',
    guardianSignature: '',
    declarationSignature: '',
    recommenderSignature: '',
    lostPassportSignature: '',
    
    ...formData
  });
  
  const [isValid, setIsValid] = useState(false);

  useEffect(() => { 
    onFormDataChange(localFormData); 
  }, [localFormData, onFormDataChange]);
  
  useEffect(() => {
    // Basic validation for header section for now
    const requiredFields = ['surname', 'firstName', 'applicantAge'];
    const valid = requiredFields.every(field => localFormData[field]);
    setIsValid(valid);
  }, [localFormData]);

  const handleFieldChange = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    
    // Handle special logic
    if (field === 'countryOfBirth') {
      const section4Required = value !== 'Guyana' && value !== '';
      setLocalFormData(prev => ({ 
        ...prev, 
        [field]: value,
        section4Required: section4Required
      }));
    } else {
      setLocalFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleNestedFieldChange = (section, field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setLocalFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleSignatureChange = (field) => (dataUrl) => {
    setLocalFormData(prev => ({
      ...prev,
      [field]: dataUrl
    }));
  };

  const inlineInputStyle = {
    display: 'inline-block',
    width: 'auto',
    minWidth: '120px',
    padding: '6px 10px',
    margin: '0 6px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '14px'
  };
  
  const sectionStyle = {
    marginBottom: '35px',
    padding: '15px',
    border: '1px solid #e9ecef',
    borderRadius: '8px',
    backgroundColor: '#f8f9fa'
  };
  
  const sectionTitleStyle = {
    fontWeight: 'bold',
    fontSize: '18px',
    marginBottom: '20px',
    color: '#2d3748',
    textAlign: 'center',
    textTransform: 'uppercase',
    borderBottom: '2px solid #274171',
    paddingBottom: '10px'
  };

  const checkboxStyle = {
    marginRight: '8px',
    transform: 'scale(1.1)'
  };

  return (
    <FormWrapper title="Republic of Guyana - Passport Application (Form A)" onProceed={() => isValid && onProceed()} isValid={isValid}>
      
      {/* Header Section - Legacy Inline Style */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>Republic of Guyana - Application for a Guyana Passport</div>
        
        {/* Name Fields - Properly Aligned */}
        <div style={{ marginBottom: '25px' }}>
          {/* First Row: Surname and Maiden Name */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', minWidth: '300px' }}>
              <label style={{ minWidth: '90px', fontWeight: '500', marginRight: '10px' }}>Surname:</label>
              <input
                type="text"
                value={localFormData.surname}
                onChange={handleFieldChange('surname')}
                style={{ ...inlineInputStyle, width: '200px' }}
                placeholder="Last Name"
                required
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', minWidth: '300px' }}>
              <label style={{ minWidth: '110px', fontWeight: '500', marginRight: '10px' }}>Maiden Name:</label>
              <input
                type="text"
                value={localFormData.maidenName}
                onChange={handleFieldChange('maidenName')}
                style={{ ...inlineInputStyle, width: '200px' }}
                placeholder="If applicable"
              />
            </div>
          </div>
          
          {/* Second Row: First, Second, and Third Name */}
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', minWidth: '280px' }}>
              <label style={{ minWidth: '90px', fontWeight: '500', marginRight: '10px' }}>First Name:</label>
              <input
                type="text"
                value={localFormData.firstName}
                onChange={handleFieldChange('firstName')}
                style={{ ...inlineInputStyle, width: '170px' }}
                placeholder="First Name"
                required
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', minWidth: '280px' }}>
              <label style={{ minWidth: '100px', fontWeight: '500', marginRight: '10px' }}>Second Name:</label>
              <input
                type="text"
                value={localFormData.secondName}
                onChange={handleFieldChange('secondName')}
                style={{ ...inlineInputStyle, width: '170px' }}
                placeholder="Middle Name"
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', minWidth: '320px' }}>
              <label style={{ minWidth: '140px', fontWeight: '500', marginRight: '10px' }}>Third Name (if any):</label>
              <input
                type="text"
                value={localFormData.thirdName}
                onChange={handleFieldChange('thirdName')}
                style={{ ...inlineInputStyle, width: '170px' }}
                placeholder="Additional Name"
              />
            </div>
          </div>
        </div>
        
        {/* Official Use and Age Selection */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginTop: '30px', padding: '20px', backgroundColor: '#fff', borderRadius: '6px' }}>
          <div>
            <div style={{ fontWeight: 'bold', marginBottom: '15px' }}>Indicate whether applicant is:</div>
            <div style={{ lineHeight: '1.8' }}>
              <label style={{ marginRight: '25px', display: 'inline-flex', alignItems: 'center' }}>
                <input
                  type="radio"
                  name="applicantAge"
                  value="under16"
                  checked={localFormData.applicantAge === 'under16'}
                  onChange={handleFieldChange('applicantAge')}
                  style={checkboxStyle}
                  required
                />
                Under 16 years
              </label>
              <label style={{ display: 'inline-flex', alignItems: 'center' }}>
                <input
                  type="radio"
                  name="applicantAge"
                  value="16andAbove"
                  checked={localFormData.applicantAge === '16andAbove'}
                  onChange={handleFieldChange('applicantAge')}
                  style={checkboxStyle}
                  required
                />
                16 and above
              </label>
            </div>
          </div>
          
          <div style={{ backgroundColor: '#f0f0f0', padding: '15px', borderRadius: '6px', border: '1px solid #ddd' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#666' }}>FOR OFFICIAL USE ONLY</div>
            <div style={{ color: '#888', fontSize: '14px', lineHeight: '1.6' }}>
              Passport No.: ________________________<br /><br />
              Date of issue: _____________________
            </div>
          </div>
        </div>
      </div>

      {/* IMPORTANT INSTRUCTIONS SECTION */}
      <div style={sectionStyle}>
        <div style={{ ...sectionTitleStyle, backgroundColor: '#f5f5f5', padding: '15px', border: '2px solid #333', color: '#000' }}>
          IMPORTANT: READ INSTRUCTIONS CAREFULLY BEFORE COMPLETING THIS FORM
        </div>
        
        <div style={{ marginTop: '20px' }}>
          <h3 style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '20px', color: '#000', textDecoration: 'underline' }}>
            INSTRUCTIONS ON HOW TO COMPLETE FORM
          </h3>
          
          <div style={{ lineHeight: '1.7', fontSize: '14px', color: '#000' }}>
            <div style={{ marginBottom: '18px', padding: '15px', backgroundColor: '#ffffff', border: '1px solid #ddd' }}>
              <strong>(A)</strong> <strong>Males (married or single) and women who have been married (16 years of age or over).</strong> 
              Complete Sections 1, 2, 6 and 7 if appropriate to their own applications.
            </div>
            
            <div style={{ marginBottom: '18px', padding: '15px', backgroundColor: '#ffffff', border: '1px solid #ddd' }}>
              <strong>(B)</strong> <strong>Married women of any age</strong> (including widows and women whose marriage haven't been terminated) 
              are required to complete Sections 1, 2, 3, 6 and 7 and if appropriate to their own applications, section 4.
            </div>
            
            <div style={{ marginBottom: '18px', padding: '15px', backgroundColor: '#ffffff', border: '1px solid #ddd' }}>
              <strong>(C)</strong> <strong>Each person will be issued with their own passport.</strong> 
              In cases where either parent is not available an Affidavit from a Justice of Peace or Commissioner of Oaths is required. 
              The affidavit must indicate that the child/children is/are in the custody of either parent making the representation 
              to apply and uplift the passport for the child/children, or that the applicant is the guardian of the child.
            </div>
            
            <div style={{ marginBottom: '25px', padding: '15px', backgroundColor: '#ffffff', border: '1px solid #ddd' }}>
              <strong>(D) Signing the form.</strong><br /><br />
              Section 7 should be completed by the person (the recommender) verifying the declaration and who must be a 
              <strong>Member of Parliament, Mayor of City/Town, Regional/Village Chairman, Attorney-at-Law, Permanent Secretary, 
              Senior Officers of the Joint Services (below the rank of Superintendent/Lieutenant) or Headmaster/Headmistress/Principal 
              of Schools, Lecturers at Tertiary Institutions, Doctors, Justices of the Peace and Commissioners of Oaths and Affidavits, 
              Business Managers</strong> or any person of similar standing personally acquainted with the applicant.<br /><br />
              
              When a previous marriage has been dissolved, the applicant would be required to produce the final decree of divorce or annulment.<br /><br />
              
              <strong>The recommender must be a citizen of the Republic of Guyana</strong> who would have known the applicant for 
              <strong>two (2) years or more</strong>, but must not be a member of the applicant's immediate family including 
              mother, father, husband, wife, uncle, aunt, son, daughter, etc.
            </div>
          </div>
        </div>
        
        {/* DOCUMENTS TO BE PRODUCED SECTION */}
        <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#ffffff', border: '2px solid #333' }}>
          <h3 style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '20px', color: '#000', textAlign: 'center', textDecoration: 'underline' }}>
            DOCUMENTS TO BE PRODUCED
          </h3>
          
          <div style={{ backgroundColor: '#f5f5f5', padding: '15px', marginBottom: '20px', textAlign: 'center', border: '1px solid #333' }}>
            <strong>All documents must be produced in duplicate (certified copy or original and photocopy)</strong>
          </div>
          
          <div style={{ lineHeight: '1.7', fontSize: '14px', color: '#000' }}>
            <div style={{ marginBottom: '15px', padding: '12px', backgroundColor: '#ffffff', border: '1px solid #ccc' }}>
              <strong>(E) (i)</strong> <strong>Males (married or single) and women who have not been married</strong> 
              should produce birth certificates or certificates of naturalization or registration and identification cards 
              as a citizen of Guyana as the case may require.
            </div>
            
            <div style={{ marginBottom: '15px', padding: '12px', backgroundColor: '#ffffff', border: '1px solid #ccc' }}>
              <strong>(ii)</strong> <strong>Married women</strong> (including widows and women whose marriage have been terminated) 
              applying for a passport should produce documents specified in (i) above, together with marriage certificate.
            </div>
            
            <div style={{ marginBottom: '15px', padding: '12px', backgroundColor: '#ffffff', border: '1px solid #ccc' }}>
              <strong>(iii) NOTE:</strong> Where an Order has been made by the High Court or in Chambers or by a Magistrate 
              regarding the custody of a child, such Order must be produced and the nature of the Order stated.
            </div>
            
            <div style={{ marginBottom: '15px', padding: '12px', backgroundColor: '#ffffff', border: '1px solid #ccc' }}>
              <strong>(iv) Change of Name.</strong> If the applicant has changed his or her name by Deed Poll and has registered the 
              change the Deed Poll must also be submitted along with a recent Birth Certificate (within 6 months) as evidence 
              that a change of name has been effected.
            </div>
            
            <div style={{ marginBottom: '20px', padding: '12px', backgroundColor: '#ffffff', border: '1px solid #ccc' }}>
              <strong>(v)</strong> <strong>Persons born outside the Republic of Guyana</strong> as constituted on 3rd November, 1978 
              and all persons claiming Citizenship by descent, naturalization or registration, must complete Section 4B and produce 
              documentary evidence in support of the statement made therein. e.g. birth certificate of descent (Father/mother), 
              naturalization or registration document, or other evidence of citizenship.
            </div>
          </div>
        </div>
        
        {/* PHOTOGRAPHS SECTION */}
        <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#ffffff', border: '2px solid #333' }}>
          <h3 style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '20px', color: '#000', textAlign: 'center', textDecoration: 'underline' }}>
            PHOTOGRAPHS
          </h3>
          
          <div style={{ lineHeight: '1.7', fontSize: '14px', color: '#000', marginBottom: '20px' }}>
            <p style={{ marginBottom: '15px' }}>
              The colour photograph of the applicant will be taken at the booth at the Central Immigration and Passport 
              Office by a Data Entry Immigration Clerk. You must submit a photograph which must confirm to the 
              following specifications.
            </p>
            
            <div style={{ padding: '15px', backgroundColor: '#f5f5f5', border: '1px solid #333', marginBottom: '15px' }}>
              <p style={{ marginBottom: '10px' }}>
                <strong>Photograph specifications:</strong>
              </p>
              <ul style={{ marginLeft: '20px', lineHeight: '1.8' }}>
                <li>Must not be larger than <strong>45 x 35mm (1.77 x 1.38 in)</strong></li>
                <li>Must not be smaller than <strong>32 x 26mm (1.26 x 1.02 in)</strong></li>
                <li>Portraits taken with a digital camera should be at high quality and resolution</li>
                <li>Must be printed on photo quality paper</li>
              </ul>
            </div>
            
            <div style={{ padding: '15px', backgroundColor: '#ffffff', border: '1px solid #ccc' }}>
              <strong>Recommender Requirements:</strong><br /><br />
              The recommender is also required to endorse and stamp the reverse side of the copy of the photographs 
              with the words:<br /><br />
              <em>"I certify that this is a true likeness of Mr., Mrs. or Miss…………………………………………..."</em><br /><br />
              and add his or her signature.
            </div>
          </div>
        </div>
      </div>
      
      {/* FORM COMPLETION INSTRUCTIONS */}
      <div style={sectionStyle}>
        <div style={{ ...sectionTitleStyle, backgroundColor: '#f5f5f5', padding: '15px', border: '2px solid #333', color: '#000' }}>
          FORM COMPLETION REQUIREMENTS
        </div>
        
        <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#ffffff', border: '2px solid #333', lineHeight: '1.8', fontSize: '14px', color: '#000' }}>
          <div style={{ marginBottom: '15px' }}>
            <strong>To avoid delay, answers to all relevant sections should be completed in ink.</strong>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <strong>Please fill out the form in BLOCK CAPITALS</strong>
          </div>
          
          <div>
            <strong>Note: Do not sign form until you have read all the notes on page 1</strong>
          </div>
        </div>
      </div>
      
      {/* PHOTO AND SIGNATURE SECTION */}
      <div style={sectionStyle}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
          
          {/* Signature and Official Use Section */}
          <div>
            
            {/* Applicant's Signature */}
            <SignatureField
              label="Applicant's Signature (Do not exceed rectangle)"
              helperText="Use your mouse or touch to draw your signature"
              value={localFormData.applicantSignaturePrimary}
              onChange={handleSignatureChange('applicantSignaturePrimary')}
              height={120}
              style={{ marginBottom: '30px' }}
            />
            
            {/* For Official Use Only */}
            <div style={{ backgroundColor: '#f5f5f5', padding: '20px', border: '2px solid #333' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '15px', color: '#000', textAlign: 'center' }}>
                For official use only
              </div>
              
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#000' }}>
                  Passport Number:
                </label>
                <div style={{
                  width: '100%',
                  height: '40px',
                  border: '1px solid #333',
                  backgroundColor: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  paddingLeft: '10px',
                  fontSize: '14px'
                }}>
                  _________________________
                </div>
              </div>
              
              <div style={{ fontSize: '12px', color: '#666', textAlign: 'center', marginTop: '10px' }}>
                This section to be completed by immigration officer
              </div>
            </div>
            
          </div>
          
          {/* Photo Section */}
          <div>
            <div style={{ textAlign: 'center', marginBottom: '15px' }}>
              <strong style={{ fontSize: '16px', color: '#000' }}>Photo</strong>
            </div>
            
            <div style={{
              width: '150px',
              height: '200px',
              border: '2px solid #333',
              backgroundColor: '#f8f9fa',
              margin: '0 auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              color: '#666',
              textAlign: 'center',
              lineHeight: '1.4'
            }}>
              PASTE PHOTOGRAPH HERE<br/>
              (45mm x 35mm max)<br/>
              (32mm x 26mm min)
            </div>
            
            <div style={{ marginTop: '15px', textAlign: 'center', fontSize: '11px', color: '#666' }}>
              Photo must be endorsed and stamped<br/>
              by recommender on reverse side
            </div>
          </div>
          
        </div>
      </div>
      
      {/* SECTION 1 - GENERAL INFORMATION */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>1. GENERAL INFORMATION</div>
        
        {/* Name and Title Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#000' }}>
              Surname (state whether Mr., Mrs., Miss, Sn., Fr., Rev or Dr.):
            </label>
            <input
              type="text"
              style={{ width: '100%', padding: '8px', border: '1px solid #333', fontSize: '14px' }}
              placeholder="e.g., Mr. Smith"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#000' }}>Marital status:</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginTop: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center' }}>
                <input type="radio" name="maritalStatus" value="single" style={{ marginRight: '5px' }} />
                Single
              </label>
              <label style={{ display: 'flex', alignItems: 'center' }}>
                <input type="radio" name="maritalStatus" value="married" style={{ marginRight: '5px' }} />
                Married
              </label>
              <label style={{ display: 'flex', alignItems: 'center' }}>
                <input type="radio" name="maritalStatus" value="divorced" style={{ marginRight: '5px' }} />
                Divorced
              </label>
              <label style={{ display: 'flex', alignItems: 'center' }}>
                <input type="radio" name="maritalStatus" value="widowed" style={{ marginRight: '5px' }} />
                Widowed
              </label>
            </div>
          </div>
        </div>
        
        {/* First Names */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#000' }}>First names:</label>
          <input
            type="text"
            style={{ width: '100%', padding: '8px', border: '1px solid #333', fontSize: '14px' }}
            placeholder="Enter all first names"
          />
        </div>
        
        {/* Personal Description Section */}
        <div style={{ padding: '15px', backgroundColor: '#ffffff', border: '1px solid #333', marginBottom: '20px' }}>
          <h4 style={{ fontWeight: 'bold', marginBottom: '15px', color: '#000' }}>Personal Description</h4>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
            {/* Gender */}
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#000' }}>Gender:</label>
              <div style={{ display: 'flex', gap: '15px' }}>
                <label style={{ display: 'flex', alignItems: 'center' }}>
                  <input type="radio" name="gender" value="male" style={{ marginRight: '5px' }} />
                  Male
                </label>
                <label style={{ display: 'flex', alignItems: 'center' }}>
                  <input type="radio" name="gender" value="female" style={{ marginRight: '5px' }} />
                  Female
                </label>
              </div>
            </div>
            
            {/* Height */}
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#000' }}>Height:</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <input
                  type="text"
                  style={{ width: '80px', padding: '5px', border: '1px solid #333', fontSize: '14px' }}
                  placeholder="170"
                />
                <span>cm</span>
              </div>
            </div>
            
            {/* Eye Color */}
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#000' }}>Colour of eyes:</label>
              <input
                type="text"
                style={{ width: '120px', padding: '5px', border: '1px solid #333', fontSize: '14px' }}
                placeholder="Brown"
              />
            </div>
            
            {/* Hair Color */}
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#000' }}>Hair Colour:</label>
              <input
                type="text"
                style={{ width: '120px', padding: '5px', border: '1px solid #333', fontSize: '14px' }}
                placeholder="Black"
              />
            </div>
          </div>
          
          {/* Special Marks */}
          <div style={{ marginTop: '15px' }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#000' }}>Special, peculiar (visible) marks:</label>
            <input
              type="text"
              style={{ width: '100%', padding: '8px', border: '1px solid #333', fontSize: '14px' }}
              placeholder="Describe any scars, tattoos, birthmarks, etc."
            />
          </div>
        </div>
        
        {/* Name Change Section */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#000' }}>Maiden Surname: (if applicant is woman who is or has been married)</label>
            <input
              type="text"
              style={{ width: '300px', padding: '8px', border: '1px solid #333', fontSize: '14px' }}
              placeholder="Enter maiden surname if applicable"
            />
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#000' }}>Has name been changed otherwise than by marriage?</label>
            <div style={{ display: 'flex', gap: '15px' }}>
              <label style={{ display: 'flex', alignItems: 'center' }}>
                <input type="radio" name="nameChanged" value="no" style={{ marginRight: '5px' }} />
                No
              </label>
              <label style={{ display: 'flex', alignItems: 'center' }}>
                <input type="radio" name="nameChanged" value="yes" style={{ marginRight: '5px' }} />
                Yes
              </label>
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#000' }}>If so, state original name:</label>
              <input
                type="text"
                style={{ width: '100%', padding: '8px', border: '1px solid #333', fontSize: '14px' }}
                placeholder="Original name"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#000' }}>Name Change Document:</label>
              <input
                type="text"
                style={{ width: '100%', padding: '8px', border: '1px solid #333', fontSize: '14px' }}
                placeholder="Deed Poll, Court Order, etc."
              />
            </div>
          </div>
        </div>
        
        {/* Age and Birth Information */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#000' }}>Age at last birthday:</label>
            <input
              type="text"
              style={{ width: '80px', padding: '8px', border: '1px solid #333', fontSize: '14px' }}
              placeholder="25"
            />
          </div>
          
          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#000' }}>Date of birth (day/mm/yr):</label>
            <input
              type="date"
              style={{ padding: '8px', border: '1px solid #333', fontSize: '14px' }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#000' }}>Country of Birth:</label>
            <input
              type="text"
              style={{ width: '150px', padding: '8px', border: '1px solid #333', fontSize: '14px' }}
              placeholder="Guyana"
            />
          </div>
          
          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#000' }}>Place of Birth:</label>
            <input
              type="text"
              style={{ width: '200px', padding: '8px', border: '1px solid #333', fontSize: '14px' }}
              placeholder="Georgetown"
            />
          </div>
        </div>
        
        {/* Profession */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#000' }}>Profession or occupation:</label>
          <input
            type="text"
            style={{ width: '100%', padding: '8px', border: '1px solid #333', fontSize: '14px' }}
            placeholder="Enter your profession or occupation"
          />
        </div>
        
        {/* Address Information */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#000' }}>Present address:</label>
            <textarea
              style={{ width: '100%', padding: '8px', border: '1px solid #333', fontSize: '14px', minHeight: '60px', resize: 'vertical' }}
              placeholder="Enter your current residential address"
            ></textarea>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#000' }}>Usual place of residence:</label>
            <textarea
              style={{ width: '100%', padding: '8px', border: '1px solid #333', fontSize: '14px', minHeight: '60px', resize: 'vertical' }}
              placeholder="If different from present address"
            ></textarea>
          </div>
        </div>
        
        {/* Contact Information */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#000' }}>Local telephone no.:</label>
            <input
              type="tel"
              style={{ width: '100%', padding: '8px', border: '1px solid #333', fontSize: '14px' }}
              placeholder="592-XXX-XXXX"
            />
          </div>
          
          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#000' }}>Fax no.:</label>
            <input
              type="tel"
              style={{ width: '100%', padding: '8px', border: '1px solid #333', fontSize: '14px' }}
              placeholder="592-XXX-XXXX"
            />
          </div>
          
          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#000' }}>E-mail:</label>
            <input
              type="email"
              style={{ width: '100%', padding: '8px', border: '1px solid #333', fontSize: '14px' }}
              placeholder="your.email@example.com"
            />
          </div>
        </div>
      </div>
      
      {/* SECTION 2 - CITIZENSHIP */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>2. CITIZENSHIP</div>
        
        {/* Citizenship Type */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '10px', color: '#000' }}>
            State whether Citizenship of the Republic of Guyana by:
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginTop: '10px' }}>
            <label style={{ display: 'flex', alignItems: 'center' }}>
              <input type="radio" name="citizenshipType" value="birth" style={{ marginRight: '8px' }} />
              Birth
            </label>
            <label style={{ display: 'flex', alignItems: 'center' }}>
              <input type="radio" name="citizenshipType" value="naturalization" style={{ marginRight: '8px' }} />
              Naturalization
            </label>
            <label style={{ display: 'flex', alignItems: 'center' }}>
              <input type="radio" name="citizenshipType" value="descent" style={{ marginRight: '8px' }} />
              Descent
            </label>
            <label style={{ display: 'flex', alignItems: 'center' }}>
              <input type="radio" name="citizenshipType" value="adoption" style={{ marginRight: '8px' }} />
              Adoption
            </label>
            <label style={{ display: 'flex', alignItems: 'center' }}>
              <input type="radio" name="citizenshipType" value="registration" style={{ marginRight: '8px' }} />
              Registration
            </label>
          </div>
        </div>
        
        {/* Supporting Document Information */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '10px', color: '#000' }}>
            If Citizen of the Republic of Guyana by any of the above, give particulars of supporting document.
          </label>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginTop: '15px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#000' }}>Document Number:</label>
              <input
                type="text"
                style={{ width: '100%', padding: '8px', border: '1px solid #333', fontSize: '14px' }}
                placeholder="Enter document number"
              />
            </div>
            
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#000' }}>Place of Issue:</label>
              <input
                type="text"
                style={{ width: '100%', padding: '8px', border: '1px solid #333', fontSize: '14px' }}
                placeholder="Where document was issued"
              />
            </div>
            
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#000' }}>Date of Issue:</label>
              <input
                type="date"
                style={{ padding: '8px', border: '1px solid #333', fontSize: '14px' }}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* SECTION 3 - MARRIED WOMEN */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>3. MARRIED WOMEN APPLYING FOR A PASSPORT MUST COMPLETE THIS SECTION</div>
        
        {/* Husband's Information */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#000' }}>
            Husband's or former husband's surname and full First names:
          </label>
          <input
            type="text"
            style={{ width: '100%', padding: '8px', border: '1px solid #333', fontSize: '14px' }}
            placeholder="Enter husband's full name (surname and all first names)"
          />
        </div>
        
        {/* Marriage Details */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#000' }}>Place of marriage:</label>
            <input
              type="text"
              style={{ width: '100%', padding: '8px', border: '1px solid #333', fontSize: '14px' }}
              placeholder="Where the marriage took place"
            />
          </div>
          
          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#000' }}>Date of marriage (day/mm/yr):</label>
            <input
              type="date"
              style={{ padding: '8px', border: '1px solid #333', fontSize: '14px' }}
            />
          </div>
        </div>
      </div>
      
      {/* SECTION 4 - PERSONS BORN OUTSIDE GUYANA */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>4. PERSONS BORN IN (A) ANY BRITISH COMMONWEALTH COUNTRY OR IN SOUTHERN IRELAND, IN A BRITISH PROTECTORATE, PROTECTED STATE OR MANDATE OR TRUST OR (B) IN ANY FOREIGN COUNTRY MUST COMPLETE A OR B BELOW:</div>
        
        {/* Section A - Birth Registered Abroad */}
        <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#ffffff', border: '2px solid #333' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '15px', color: '#000', fontSize: '16px' }}>
            A. If applicant's birth was registered as a citizen of the Republic of Guyana abroad, state:
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#000' }}>Name of consulate:</label>
              <input
                type="text"
                style={{ width: '100%', padding: '8px', border: '1px solid #333', fontSize: '14px' }}
                placeholder="Enter consulate name"
              />
            </div>
            
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#000' }}>Date of registration:</label>
              <input
                type="date"
                style={{ padding: '8px', border: '1px solid #333', fontSize: '14px' }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#000' }}>Place and date of father's birth:</label>
              <input
                type="text"
                style={{ width: '100%', padding: '8px', border: '1px solid #333', fontSize: '14px' }}
                placeholder="Place and date of birth"
              />
            </div>
          </div>
        </div>
        
        {/* Section B - Father's Particulars */}
        <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#ffffff', border: '2px solid #333' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '15px', color: '#000', fontSize: '16px' }}>
            B. Particulars of applicant's father:
          </div>
          
          {/* If born in Guyana */}
          <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', border: '1px solid #333' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#000' }}>If born in Guyana:</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#000' }}>Place of birth:</label>
                <input
                  type="text"
                  style={{ width: '100%', padding: '8px', border: '1px solid #333', fontSize: '14px' }}
                  placeholder="Father's place of birth in Guyana"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#000' }}>Date of birth:</label>
                <input
                  type="date"
                  style={{ padding: '8px', border: '1px solid #333', fontSize: '14px' }}
                />
              </div>
            </div>
          </div>
          
          {/* If Citizen by Naturalization or Registration */}
          <div style={{ padding: '15px', backgroundColor: '#f5f5f5', border: '1px solid #333' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#000' }}>If Citizen of Guyana by Naturalization or REGISTRATION:</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#000' }}>No. of Certificate:</label>
                <input
                  type="text"
                  style={{ width: '100%', padding: '8px', border: '1px solid #333', fontSize: '14px' }}
                  placeholder="Certificate number"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#000' }}>Date and place of Issue:</label>
                <input
                  type="text"
                  style={{ width: '100%', padding: '8px', border: '1px solid #333', fontSize: '14px' }}
                  placeholder="Date and place certificate was issued"
                />
              </div>
            </div>
          </div>
        </div>
        
        
      </div>
      
      {/* GUARDIAN AUTHORIZATION SECTION */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>GUARDIAN AUTHORIZATION</div>
        
        <div style={{ padding: '25px', backgroundColor: '#ffffff', border: '2px solid #333' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '20px', color: '#000', fontSize: '16px' }}>
            To Chief Passport Officer
          </div>
          
          <div style={{ lineHeight: '1.8', fontSize: '14px', color: '#000', marginBottom: '20px' }}>
            <p style={{ marginBottom: '15px' }}>This is to certify that, I</p>
            
            <div style={{ marginBottom: '20px' }}>
              <input
                type="text"
                style={{ width: '100%', padding: '8px', border: '1px solid #333', fontSize: '14px', borderBottom: '2px solid #333', borderTop: 'none', borderLeft: 'none', borderRight: 'none', backgroundColor: 'transparent' }}
                placeholder="Enter guardian's name in full"
              />
              <div style={{ fontSize: '12px', color: '#666', textAlign: 'center', marginTop: '5px' }}>Name in full</div>
            </div>
            
            <p style={{ marginBottom: '15px' }}>am the legal guardian of</p>
            
            <div style={{ marginBottom: '20px' }}>
              <input
                type="text"
                style={{ width: '100%', padding: '8px', border: '1px solid #333', fontSize: '14px', borderBottom: '2px solid #333', borderTop: 'none', borderLeft: 'none', borderRight: 'none', backgroundColor: 'transparent' }}
                placeholder="Enter child's name in full"
              />
              <div style={{ fontSize: '12px', color: '#666', textAlign: 'center', marginTop: '5px' }}>Child's name in full</div>
            </div>
            
            <p style={{ marginBottom: '20px' }}>I hereby authorize you to issue him/her with a passport of the Republic of Guyana.</p>
          </div>
          
          {/* Signature Section */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginTop: '30px' }}>
            <SignatureField
              label="Guardian's Signature"
              helperText="Guardian or parent must sign within the box"
              value={localFormData.guardianSignature}
              onChange={handleSignatureChange('guardianSignature')}
              height={110}
              style={{ marginBottom: 0 }}
            />
            
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '10px', color: '#000' }}>Relationship of applicant to child:</label>
              <div style={{ display: 'flex', gap: '20px', marginTop: '15px' }}>
                <label style={{ display: 'flex', alignItems: 'center' }}>
                  <input type="radio" name="guardianRelationship" value="parent" style={{ marginRight: '8px' }} />
                  Parent
                </label>
                <label style={{ display: 'flex', alignItems: 'center' }}>
                  <input type="radio" name="guardianRelationship" value="guardian" style={{ marginRight: '8px' }} />
                  Guardian
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* SECTION 5 - USE OF PASSPORT */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>5. USE OF PASSPORT</div>
        
        {/* Destination and Purpose */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '10px', color: '#000' }}>
              Passport required for travelling to:
            </label>
            <input 
              type="text"
              style={{ width: '100%', padding: '8px', border: '1px solid #333', fontSize: '14px' }}
              placeholder="Enter destination countries"
            />
          </div>
          
          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '10px', color: '#000' }}>
              Purpose of travel:
            </label>
            <input 
              type="text"
              style={{ width: '100%', padding: '8px', border: '1px solid #333', fontSize: '14px' }}
              placeholder="e.g., Tourism, Business, Education, etc."
            />
          </div>
        </div>
      </div>
      
      {/* SECTION 6 - DECLARATION */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>6. DECLARATION</div>
        
        <div style={{ padding: '20px', backgroundColor: '#f5f5f5', border: '2px solid #333', marginBottom: '20px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '15px', color: '#000' }}>Please indicate by a tick in the box provided</div>
          
          <div style={{ marginBottom: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '10px' }}>
              <input type="checkbox" id="declaration_a" style={{ marginRight: '10px', marginTop: '3px' }} />
              <label htmlFor="declaration_a" style={{ color: '#000' }}>
                <strong>A</strong> – I the undersigned, hereby apply for the issue of a passport.
              </label>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '10px' }}>
              <input type="checkbox" id="declaration_b" style={{ marginRight: '10px', marginTop: '3px' }} />
              <label htmlFor="declaration_b" style={{ color: '#000' }}>
                <strong>B</strong> – I declare that the information given in this application is correct to the best of my knowledge and belief.
              </label>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '10px' }}>
              <input type="checkbox" id="declaration_c" style={{ marginRight: '10px', marginTop: '3px' }} />
              <label htmlFor="declaration_c" style={{ color: '#000' }}>
                <strong>C</strong> – That I have not lost the status of Citizen of the Republic of Guyana.
              </label>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '10px' }}>
              <input type="checkbox" id="declaration_d" style={{ marginRight: '10px', marginTop: '3px' }} />
              <label htmlFor="declaration_d" style={{ color: '#000' }}>
                <strong>D</strong> – That I have not previously held or applied for a passport of any description.
              </label>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'flex-start' }}>
              <input type="checkbox" id="declaration_e" style={{ marginRight: '10px', marginTop: '3px' }} />
              <label htmlFor="declaration_e" style={{ color: '#000' }}>
                <strong>E</strong> – That all previous passports granted to me have been surrendered, other than travel Document No.
                <input 
                  type="text"
                  style={{ width: '180px', padding: '3px 5px', margin: '0 5px', border: '1px solid #333', fontSize: '14px' }}
                  placeholder="Document number"
                />
                which is now attached and that I have made no other application for a passport since the attached passport or travel document was issued to me.
              </label>
            </div>
          </div>
          
          <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ width: '60%' }}>
              <SignatureField
                label="Signature"
                helperText="Applicant's signature"
                value={localFormData.declarationSignature}
                onChange={handleSignatureChange('declarationSignature')}
                height={110}
                style={{ marginBottom: 0 }}
              />
            </div>
            
            <div style={{ width: '35%' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#000' }}>Date:</label>
              <input
                type="date"
                style={{ width: '100%', padding: '8px', border: '1px solid #333', fontSize: '14px' }}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* SECTION 7 - REFERENCE */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>7. REFERENCE: Applies to persons applying for a passport</div>
        
        <div style={{ padding: '25px', backgroundColor: '#ffffff', border: '2px solid #333' }}>
          <div style={{ marginBottom: '25px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '15px', color: '#000' }}>Recommender:</div>
            
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <p style={{ margin: '0', marginRight: '5px' }}>I</p>
              <input 
                type="text" 
                style={{ 
                  flex: '1', 
                  padding: '8px', 
                  border: '1px solid #333', 
                  borderTop: 'none', 
                  borderLeft: 'none', 
                  borderRight: 'none', 
                  borderBottom: '2px solid #333', 
                  backgroundColor: 'transparent', 
                  fontSize: '14px' 
                }}
                placeholder="Enter recommender's full name"
              />
              <p style={{ margin: '0', marginLeft: '5px' }}>certify that the applicant has been known</p>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', marginTop: '15px', marginBottom: '20px' }}>
              <p style={{ margin: '0', marginRight: '5px' }}>personally to me for</p>
              <input 
                type="text" 
                style={{ 
                  width: '50px', 
                  padding: '8px', 
                  border: '1px solid #333', 
                  borderTop: 'none', 
                  borderLeft: 'none', 
                  borderRight: 'none', 
                  borderBottom: '2px solid #333', 
                  backgroundColor: 'transparent', 
                  fontSize: '14px',
                  textAlign: 'center'
                }}
                placeholder=""
              />
              <p style={{ margin: '0', marginLeft: '5px', marginRight: '5px' }}>years and that to the best of my knowledge and belief, the facts stated on this form are true and correct.</p>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '20px', marginTop: '30px', marginBottom: '25px' }}>
              <SignatureField
                label="Signature"
                helperText="Recommender's signature"
                value={localFormData.recommenderSignature}
                onChange={handleSignatureChange('recommenderSignature')}
                height={110}
                style={{ marginBottom: 0 }}
              />
              
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#000' }}>Date:</label>
                <input
                  type="date"
                  style={{ width: '100%', padding: '8px', border: '1px solid #333', fontSize: '14px' }}
                />
              </div>
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#000' }}>Rank or Profession:</label>
              <input
                type="text"
                style={{ width: '100%', padding: '8px', border: '1px solid #333', fontSize: '14px' }}
                placeholder="Enter recommender's rank or profession"
              />
            </div>
            
            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#000' }}>Address:</label>
              <textarea
                style={{ width: '100%', padding: '8px', border: '1px solid #333', fontSize: '14px', minHeight: '80px', resize: 'vertical' }}
                placeholder="Enter recommender's full address"
              ></textarea>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{ 
                width: '150px', 
                height: '150px', 
                border: '2px solid #333', 
                backgroundColor: '#f5f5f5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                color: '#666',
                textAlign: 'center'
              }}>
                Office Stamp<br />(if any)
              </div>
            </div>
          </div>
          
          {/* Important Warning */}
          <div style={{ padding: '15px', backgroundColor: '#f5f5f5', border: '2px solid #333', marginTop: '30px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#000' }}>IMPORTANT:</div>
            <div style={{ fontSize: '14px', lineHeight: '1.6', color: '#000' }}>
              Applicant and recommender are warned that should any statement contained in their respective declarations prove to be untrue, the consequences to them may be serious. The attention of persons who are asked to sign this declaration is specially called to the fact that it should be signed from personal knowledge of the applicant and not from information obtained from persons, and that they should know the applicant for at least two (2) years.
            </div>
          </div>
        </div>
      </div>
      
      {/* LOST OR STOLEN PASSPORT INFORMATION SHEET */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>Lost or Stolen Passport Information Sheet</div>
        
        {/* Personal Information Row 1 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#000' }}>Surname:</label>
            <input
              type="text"
              style={{ width: '100%', padding: '8px', border: '1px solid #333', fontSize: '14px' }}
              placeholder="Enter surname"
            />
          </div>
          
          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#000' }}>First Name(s):</label>
            <input
              type="text"
              style={{ width: '100%', padding: '8px', border: '1px solid #333', fontSize: '14px' }}
              placeholder="Enter first name(s)"
            />
          </div>
          
          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#000' }}>Passport number:</label>
            <input
              type="text"
              style={{ width: '100%', padding: '8px', border: '1px solid #333', fontSize: '14px' }}
              placeholder="Enter passport number"
            />
          </div>
        </div>
        
        {/* Gender and Dates Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#000' }}>Gender:</label>
            <div style={{ display: 'flex', gap: '15px', marginTop: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center' }}>
                <input type="radio" name="lostFormGender" value="male" style={{ marginRight: '5px' }} />
                Male
              </label>
              <label style={{ display: 'flex', alignItems: 'center' }}>
                <input type="radio" name="lostFormGender" value="female" style={{ marginRight: '5px' }} />
                Female
              </label>
            </div>
          </div>
          
          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#000' }}>Date of birth:</label>
            <input
              type="date"
              style={{ width: '100%', padding: '8px', border: '1px solid #333', fontSize: '14px' }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#000' }}>Date of issue:</label>
            <input
              type="date"
              style={{ width: '100%', padding: '8px', border: '1px solid #333', fontSize: '14px' }}
            />
          </div>
        </div>
        
        {/* Document Information Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#000' }}>Place of birth:</label>
            <input
              type="text"
              style={{ width: '100%', padding: '8px', border: '1px solid #333', fontSize: '14px' }}
              placeholder="Enter place of birth"
            />
          </div>
          
          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#000' }}>Document (Registration) No.:</label>
            <input
              type="text"
              style={{ width: '100%', padding: '8px', border: '1px solid #333', fontSize: '14px' }}
              placeholder="Enter document number"
            />
          </div>
          
          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#000' }}>Document Type:</label>
            <input
              type="text"
              style={{ width: '100%', padding: '8px', border: '1px solid #333', fontSize: '14px' }}
              placeholder="Enter document type"
            />
          </div>
        </div>
        
        {/* Loss Information Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#000' }}>Was police notified:</label>
            <div style={{ display: 'flex', gap: '15px', marginTop: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center' }}>
                <input type="radio" name="wasPoliceNotified" value="yes" style={{ marginRight: '5px' }} />
                Yes
              </label>
              <label style={{ display: 'flex', alignItems: 'center' }}>
                <input type="radio" name="wasPoliceNotified" value="no" style={{ marginRight: '5px' }} />
                No
              </label>
            </div>
          </div>
          
          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#000' }}>Date loss:</label>
            <input
              type="date"
              style={{ width: '100%', padding: '8px', border: '1px solid #333', fontSize: '14px' }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#000' }}>Date of recovery:</label>
            <input
              type="date"
              style={{ width: '100%', padding: '8px', border: '1px solid #333', fontSize: '14px' }}
            />
          </div>
        </div>
        
        {/* Police Information Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#000' }}>Date of police notification:</label>
            <input
              type="date"
              style={{ width: '100%', padding: '8px', border: '1px solid #333', fontSize: '14px' }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#000' }}>Police Report No.:</label>
            <input
              type="text"
              style={{ width: '100%', padding: '8px', border: '1px solid #333', fontSize: '14px' }}
              placeholder="Enter police report number"
            />
          </div>
          
          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#000' }}>Place of loss:</label>
            <input
              type="text"
              style={{ width: '100%', padding: '8px', border: '1px solid #333', fontSize: '14px' }}
              placeholder="Enter place where passport was lost"
            />
          </div>
        </div>
        
        {/* Additional Information Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#000' }}>Place of issue:</label>
            <input
              type="text"
              style={{ width: '100%', padding: '8px', border: '1px solid #333', fontSize: '14px' }}
              placeholder="Enter place where passport was issued"
            />
          </div>
          
          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#000' }}>Recovery measures:</label>
            <input
              type="text"
              style={{ width: '100%', padding: '8px', border: '1px solid #333', fontSize: '14px' }}
              placeholder="Enter recovery measures taken"
            />
          </div>
        </div>
        
        {/* Remarks */}
        <div style={{ marginBottom: '30px' }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#000' }}>Remarks/Observations:</label>
          <textarea
            style={{ width: '100%', padding: '8px', border: '1px solid #333', fontSize: '14px', minHeight: '80px', resize: 'vertical' }}
            placeholder="Enter any additional remarks or observations"
          ></textarea>
        </div>
        
        {/* Declaration */}
        <div style={{ padding: '20px', backgroundColor: '#ffffff', border: '2px solid #333', marginBottom: '25px' }}>
          <div style={{ lineHeight: '1.6', fontSize: '14px', color: '#000', marginBottom: '20px' }}>
            I hereby certify that the above particulars are correct and undertake that in the event of the passport coming again into my
            possession it will be handed over to the Passport Office or the nearest Police Station in Guyana or Guyana Consulate
            Overseas.
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginTop: '20px' }}>
            <SignatureField
              label="Signed"
              helperText="Applicant's signature"
              value={localFormData.lostPassportSignature}
              onChange={handleSignatureChange('lostPassportSignature')}
              height={110}
              style={{ marginBottom: 0 }}
            />
            
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#000' }}>Date:</label>
              <input
                type="date"
                style={{ width: '100%', padding: '8px', border: '1px solid #333', fontSize: '14px' }}
              />
            </div>
          </div>
        </div>
        
        {/* FOR OFFICIAL USE ONLY SECTION */}
        <div style={{ padding: '20px', backgroundColor: '#f5f5f5', border: '2px solid #333' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '20px', color: '#000', fontSize: '16px', textAlign: 'center' }}>
            FOR OFFICIAL USE ONLY
          </div>
          
          {/* Documents Produced */}
          <div style={{ marginBottom: '25px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '15px', color: '#000' }}>DOCUMENTS PRODUCED TO BE NOTED HERE</div>
            
            <div style={{ display: 'flex', gap: '20px', marginBottom: '15px', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center' }}>
                <input type="checkbox" style={{ marginRight: '8px' }} />
                Applicant's birth certificate
              </label>
              <label style={{ display: 'flex', alignItems: 'center' }}>
                <input type="checkbox" style={{ marginRight: '8px' }} />
                Marriage certificate
              </label>
              <label style={{ display: 'flex', alignItems: 'center' }}>
                <input type="checkbox" style={{ marginRight: '8px' }} />
                Other documents
              </label>
            </div>
          </div>
          
          {/* Fee Information */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#000' }}>Passport fee $:</label>
              <input
                type="text"
                style={{ width: '100%', padding: '8px', border: '1px solid #333', fontSize: '14px' }}
                placeholder="Enter fee amount"
              />
            </div>
            
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#000' }}>Receipt #:</label>
              <input
                type="text"
                style={{ width: '100%', padding: '8px', border: '1px solid #333', fontSize: '14px' }}
                placeholder="Enter receipt number"
              />
            </div>
          </div>
          
          {/* Official Processing */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#000' }}>Received by:</label>
              <input
                type="text"
                style={{ width: '100%', padding: '8px', border: '1px solid #333', fontSize: '14px' }}
                placeholder="Enter name of receiving officer"
              />
            </div>
            
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#000' }}>Checked by:</label>
              <input
                type="text"
                style={{ width: '100%', padding: '8px', border: '1px solid #333', fontSize: '14px' }}
                placeholder="Enter name of checking officer"
              />
            </div>
          </div>
          
          {/* Final Authorization */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#000' }}>Passport signed by:</label>
              <input
                type="text"
                style={{ width: '100%', padding: '8px', border: '1px solid #333', fontSize: '14px' }}
                placeholder="Enter name of signing authority"
              />
            </div>
            
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#000' }}>Signature:</label>
              <div style={{
                height: '60px',
                border: '2px solid #333',
                backgroundColor: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                color: '#999'
              }}>
                Official Signature
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div style={{
        marginTop: '40px',
        paddingTop: '20px',
        borderTop: '1px solid #e2e8f0',
        textAlign: 'center',
        fontSize: '12px',
        color: '#718096',
        fontStyle: 'italic'
      }}>
        This passport application form complies with the Republic of Guyana passport application requirements. 
        Ensure all sections are completed accurately and supporting documents are attached.
      </div>

    </FormWrapper>
  );
};

export default PassportApplicationForm;
