# Updated User Flow - Power of Attorney Example

## 🚀 Complete User Journey

### **Step 1: Document Selection**
```
User visits: /dashboard
↓
Selects "Power of Attorney" document
↓
System loads: config/documentTypes.js → DOCUMENT_TYPES.POWER_OF_ATTORNEY
↓
WorkflowContext state updates:
- selectedDocumentType: 'power_of_attorney'
- documentConfig: {...sections, fields, validation...}
- currentStep: 'document_selection' → 'form_filling'
```

### **Step 2: Dynamic Form Filling**
```
User navigates to: /form-filling?docType=power_of_attorney
↓
DynamicFormRenderer loads with sections:
1. Principal Information (name, address, DOB)
2. Agent Information (name, powers granted)
3. Legal Terms & Conditions
4. Signature Requirements
↓
User fills out form step by step:
- Form data stored in WorkflowContext
- Auto-saved to localStorage every change
- Real-time validation per field
```

**Form Structure Example:**
```javascript
// What gets loaded from documentTypes.js
{
  sections: [
    {
      id: 'principal_info',
      title: 'Principal Information',
      fields: [
        { id: 'principal_name', type: 'text', label: 'Full Legal Name', required: true },
        { id: 'principal_address', type: 'textarea', label: 'Home Address' },
        { id: 'principal_dob', type: 'date', label: 'Date of Birth' },
        { id: 'principal_id', type: 'file', label: 'ID Document' }
      ]
    },
    {
      id: 'agent_info',
      title: 'Agent Information',
      fields: [
        { id: 'agent_name', type: 'text', label: 'Agent Full Name', required: true },
        { id: 'powers_granted', type: 'checkbox', options: [
          { value: 'financial', label: 'Financial Decisions' },
          { value: 'healthcare', label: 'Healthcare Decisions' },
          { value: 'legal', label: 'Legal Matters' }
        ]}
      ]
    },
    {
      id: 'signatures',
      title: 'Signatures',
      fields: [
        { id: 'principal_signature', type: 'signature', label: 'Principal Signature', required: true },
        { id: 'notary_signature', type: 'signature', label: 'Notary Signature', notaryField: true },
        { id: 'witness_signature', type: 'signature', label: 'Witness Signature' }
      ]
    }
  ]
}
```

### **Step 3: Service Selection**
```
Form completion: 85%+ filled
↓
User chooses service type:
- E-Sign: $25 (digital only)
- Notary: $50 (video verification required)
↓
WorkflowContext updates:
- selectedService: 'notary'
- isCollaborative: true (triggers real-time features)
- currentStep: 'service_selection' → 'payment'
```

### **Step 4: Payment Processing**
```
User proceeds to payment: /payment
↓
Payment details collected
↓
On successful payment:
- paymentStatus: 'completed'
- currentStep: 'payment' → 'video_call'
- Generate unique meetingId: "meeting_2024_user123_notary456"
```

### **Step 5: Video Call Setup**
```
System redirects to: /video-call?meetingId=meeting_2024_user123_notary456&documentType=power_of_attorney
↓
Video call page loads with:
- Zego Cloud integration
- Form panel (initially hidden)
- Real-time sync initialization
```

## 🎥 Form Access in Video Call - Detailed Explanation

### **How Forms Become Available in Video Call:**

#### **1. URL Parameter Loading**
```javascript
// Video call URL: /video-call?meetingId=123&documentType=power_of_attorney
const documentType = searchParams.get('documentType');

// System automatically loads form configuration
useEffect(() => {
  if (documentType && !state.selectedDocumentType) {
    const config = getDocumentConfig(documentType);
    if (config) {
      actions.setDocumentType(documentType, config);
    }
  }
}, [documentType, state.selectedDocumentType, actions]);
```

#### **2. Form Panel Toggle System**
```javascript
// User/Notary can toggle form visibility during call
<button onClick={toggleFormPanel}>
  <i className={`fa ${showFormPanel ? 'fa-eye-slash' : 'fa-file-text'}`}></i>
  {showFormPanel ? 'Hide Form' : 'Show Form'}
</button>

// Form panel appears as sidebar (col-lg-4) next to video (col-lg-8)
{showFormPanel && (
  <div className="col-lg-4">
    <DynamicFormRenderer
      documentType={state.selectedDocumentType}
      config={state.documentConfig}
      formData={state.formData}
      onFieldChange={handleFormFieldChange}  // Includes real-time sync
      onSignature={handleSignatureChange}    // Includes real-time sync
      errors={state.formErrors}
      isNotaryMode={role === 'Notary'}
      mode="video_call"    // Compact mode
      isCompact={true}
    />
  </div>
)}
```

#### **3. Real-Time Synchronization Flow**
```javascript
// When user types in a field:
const handleFormFieldChange = (fieldId, value) => {
  // 1. Update local state immediately
  actions.updateFormField(fieldId, value);
  
  // 2. Sync with other participants (debounced 500ms)
  if (isCollaborative && hasJoinedCall) {
    syncFormField(fieldId, value);
  }
};

// Real-time sync sends update via WebSocket:
{
  type: 'form_update',
  sessionId: 'meeting_123',
  fieldId: 'principal_name',
  formData: { 'principal_name': 'John Doe' },
  userId: 'user_456',
  userRole: 'client',
  timestamp: 1703123456789
}
```

#### **4. Permission-Based Field Access**
```javascript
// Field access depends on user role:
notaryEditableFields: [
  'notary_signature',
  'notary_seal', 
  'verification_date',
  'notary_commission'
]

// In FieldRenderer.jsx:
const isEditableInNotaryMode = isNotaryMode ? 
  notaryEditableFields.includes(field.id) : true;

// Notary can only edit notary-specific fields
// User can edit all other fields
// Both can see all fields in real-time
```

## 🗄️ Firestore Storage Strategy

### **Current Implementation Status:**

❌ **Not Yet Implemented in the Dynamic Form System**

The current implementation stores data in:
1. **WorkflowContext** (React state) - Runtime only
2. **localStorage** - Browser local storage for auto-save
3. **Real-time sync service** - Temporary session data

### **Recommended Firestore Integration:**

#### **1. Document Structure in Firestore**
```javascript
// Collection: 'workflow_sessions'
{
  sessionId: 'session_2024_user123_notary456',
  documentType: 'power_of_attorney',
  userId: 'user_123',
  notaryId: 'notary_456',
  status: 'in_progress', // draft, in_progress, completed, signed
  createdAt: timestamp,
  updatedAt: timestamp,
  
  // Form data
  formData: {
    principal_name: 'John Doe',
    principal_address: '123 Main St, City, State',
    agent_name: 'Jane Smith',
    powers_granted: ['financial', 'healthcare']
  },
  
  // Signatures (base64 encoded)
  signatures: {
    principal_signature: 'data:image/png;base64,iVBOR...',
    notary_signature: 'data:image/png;base64,iVBOR...',
    signedAt: timestamp
  },
  
  // File uploads
  attachments: {
    principal_id: {
      fileName: 'drivers_license.pdf',
      fileUrl: 'gs://bucket/uploads/user123/principal_id.pdf',
      fileType: 'application/pdf',
      fileSize: 1024000
    }
  },
  
  // Audit trail
  auditTrail: [
    {
      timestamp: timestamp,
      userId: 'user_123',
      action: 'field_update',
      field: 'principal_name',
      oldValue: 'J',
      newValue: 'John',
      userRole: 'client'
    },
    {
      timestamp: timestamp,
      userId: 'notary_456',
      action: 'signature_added',
      field: 'notary_signature',
      userRole: 'notary'
    }
  ],
  
  // Payment info
  payment: {
    amount: 50,
    currency: 'USD',
    status: 'completed',
    transactionId: 'txn_abc123',
    paidAt: timestamp
  }
}
```

#### **2. Real-Time Firestore Integration**
```javascript
// In RealtimeSync.js - Firestore mode
async connectFirestore() {
  const db = getFirestore();
  const sessionRef = doc(db, 'workflow_sessions', this.sessionId);
  
  // Listen for real-time updates
  this.unsubscribe = onSnapshot(sessionRef, (doc) => {
    if (doc.exists()) {
      const data = doc.data();
      this.handleIncomingUpdate({
        type: 'form_update',
        formData: data.formData,
        signatures: data.signatures,
        timestamp: data.updatedAt
      });
    }
  });
}

// Sync form data to Firestore
async syncFormData(formData, fieldId) {
  const db = getFirestore();
  const sessionRef = doc(db, 'workflow_sessions', this.sessionId);
  
  await updateDoc(sessionRef, {
    [`formData.${fieldId}`]: formData[fieldId],
    updatedAt: serverTimestamp(),
    [`auditTrail`]: arrayUnion({
      timestamp: serverTimestamp(),
      userId: this.userId,
      action: 'field_update',
      field: fieldId,
      newValue: formData[fieldId],
      userRole: this.userRole
    })
  });
}
```

#### **3. File Upload to Firebase Storage**
```javascript
// In FieldRenderer.jsx for file fields
const handleFileUpload = async (file) => {
  const storage = getStorage();
  const fileRef = ref(storage, `uploads/${userId}/${fieldId}/${file.name}`);
  
  // Upload file
  const snapshot = await uploadBytes(fileRef, file);
  const downloadURL = await getDownloadURL(snapshot.ref);
  
  // Update Firestore with file reference
  const fileData = {
    fileName: file.name,
    fileUrl: downloadURL,
    fileType: file.type,
    fileSize: file.size,
    uploadedAt: serverTimestamp()
  };
  
  onChange(fileData);
};
```

#### **4. Security Rules Example**
```javascript
// Firestore Security Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /workflow_sessions/{sessionId} {
      allow read, write: if request.auth != null && 
        (request.auth.uid == resource.data.userId || 
         request.auth.uid == resource.data.notaryId);
    }
  }
}

// Storage Security Rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /uploads/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && 
        request.auth.uid == userId;
    }
  }
}
```

### **Implementation Steps for Firestore Integration:**

1. **Update RealtimeSync.js** to support Firestore backend
2. **Modify WorkflowContext.js** to sync with Firestore
3. **Add Firebase configuration** to environment variables
4. **Implement file upload service** for attachments
5. **Add security rules** for data protection
6. **Create backup/restore functions** for data recovery

### **Data Flow with Firestore:**
```
User types in form field
↓
1. Update WorkflowContext (immediate UI update)
↓
2. Sync to Firestore (debounced, 500ms)
↓
3. Firestore triggers onSnapshot listener
↓
4. Other participants receive real-time update
↓
5. Their UI updates automatically
```

### **Benefits of Firestore Integration:**
- ✅ **Persistent Storage** - Data survives browser refresh
- ✅ **Real-time Sync** - Built-in real-time capabilities
- ✅ **Audit Trail** - Complete change history
- ✅ **File Storage** - Integrated with Firebase Storage
- ✅ **Security** - Robust security rules
- ✅ **Scalability** - Handles multiple concurrent sessions
- ✅ **Offline Support** - Works offline with sync when online
