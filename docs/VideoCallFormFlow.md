# Video Call Form Collaboration - Visual Flow

## 🎥 Video Call Interface Layout

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            WiScribble - Video Verification                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────┐  ┌─────────────────────────────────┐  │
│  │                                     │  │      Form Panel (Toggleable)   │  │
│  │         Video Call Area             │  │                                 │  │
│  │      (Zego Cloud Integration)       │  │  ┌─────────────────────────────┐ │  │
│  │                                     │  │  │ ✅ Live Collaboration      │ │  │
│  │  ┌─────────────┐  ┌─────────────┐   │  │  │    Active                   │ │  │
│  │  │             │  │             │   │  │  └─────────────────────────────┘ │  │
│  │  │    User     │  │   Notary    │   │  │                                 │  │
│  │  │   Camera    │  │   Camera    │   │  │  Active Participants:           │  │
│  │  │             │  │             │   │  │  • 🟢 Client                    │  │
│  │  └─────────────┘  └─────────────┘   │  │  • 🔵 Notary                    │  │
│  │                                     │  │                                 │  │
│  │   🎤 🎥 📞 ⚙️ Call Controls        │  │  ═══════════════════════════════ │  │
│  └─────────────────────────────────────┘  │                                 │  │
│                                           │  📋 Principal Information       │  │
│  ┌─────────────────────────────────────┐  │  ┌─────────────────────────────┐ │  │
│  │         📄 Show Form                │  │  │ Full Legal Name: John Doe   │ │  │
│  │         👁️ Hide Form                │  │  │ [User is typing...]         │ │  │
│  └─────────────────────────────────────┘  │  └─────────────────────────────┘ │  │
│                                           │                                 │  │
│  ┌─────────────────────────────────────┐  │  📋 Agent Information          │  │
│  │            Navigation               │  │  ┌─────────────────────────────┐ │  │
│  │  ⬅️ Back          Next ➡️            │  │  │ Agent Name: Jane Smith      │ │  │
│  └─────────────────────────────────────┘  │  │ Powers: ☑️ Financial        │ │  │
│                                           │  │         ☑️ Healthcare       │ │  │
│                                           │  └─────────────────────────────┘ │  │
│                                           │                                 │  │
│                                           │  📝 Signatures                  │  │
│                                           │  ┌─────────────────────────────┐ │  │
│                                           │  │ Principal: [Signature Pad] │ │  │
│                                           │  │ Notary: [Signature Pad]    │ │  │
│                                           │  │ (Only notary can edit)      │ │  │
│                                           │  └─────────────────────────────┘ │  │
│                                           └─────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 🔄 Real-Time Synchronization Flow

### **Scenario: User typing "John Doe" in Principal Name field**

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    USER     │     │  SYSTEM     │     │   SYNC      │     │   NOTARY    │
│   CLIENT    │     │ (Browser)   │     │  SERVICE    │     │   CLIENT    │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
       │                    │                    │                    │
       │ 1. Types "J"       │                    │                    │
       ├───────────────────►│                    │                    │
       │                    │ 2. Update local    │                    │
       │                    │    WorkflowContext │                    │
       │                    │                    │                    │
       │                    │ 3. Debounce 500ms  │                    │
       │                    │    (user keeps     │                    │
       │                    │     typing...)     │                    │
       │                    │                    │                    │
       │ 4. Types "John"    │                    │                    │
       ├───────────────────►│                    │                    │
       │                    │ 5. Update local    │                    │
       │                    │    state again     │                    │
       │                    │                    │                    │
       │                    │ 6. Send to sync    │                    │
       │                    │    service         │                    │
       │                    ├───────────────────►│                    │
       │                    │                    │ 7. Broadcast to    │
       │                    │                    │    other clients   │
       │                    │                    ├───────────────────►│
       │                    │                    │                    │ 8. Receive update
       │                    │                    │                    │    Update UI
       │                    │                    │                    │    Show notification
       │                    │                    │ 9. Confirmation    │
       │                    │ 10. Success        │◄───────────────────┤
       │ 11. Notification   │◄───────────────────┤                    │
       │◄───────────────────┤                    │                    │
       │ "Notary sees       │                    │                    │
       │  your changes"     │                    │                    │
```

## 🔐 Field Permission Matrix

### **Power of Attorney Example - Field Access Control**

| Field Name | Field Type | User Can Edit | Notary Can Edit | Notes |
|------------|------------|---------------|-----------------|-------|
| `principal_name` | text | ✅ | ❌ | User enters their own name |
| `principal_address` | textarea | ✅ | ❌ | User enters their address |
| `principal_dob` | date | ✅ | ❌ | User enters birth date |
| `agent_name` | text | ✅ | ❌ | User selects their agent |
| `powers_granted` | checkbox | ✅ | ❌ | User chooses powers |
| `principal_signature` | signature | ✅ | ❌ | User signs electronically |
| `notary_signature` | signature | ❌ | ✅ | Only notary can sign |
| `notary_seal` | signature | ❌ | ✅ | Notary official seal |
| `verification_date` | date | ❌ | ✅ | Notary sets date |
| `notary_commission` | text | ❌ | ✅ | Notary commission # |
| `witness_signature` | signature | ✅ | ✅ | Either party can witness |

### **Configuration in documentTypes.js:**
```javascript
POWER_OF_ATTORNEY: {
  // ... other config
  notaryEditableFields: [
    'notary_signature',
    'notary_seal',
    'verification_date',
    'notary_commission'
  ],
  signatureFields: [
    'principal_signature',
    'notary_signature',
    'witness_signature'
  ]
}
```

## 📱 Responsive Behavior

### **Desktop View (1200px+)**
```
[Video Call 70%] [Form Panel 30%]
```

### **Tablet View (768px-1199px)**
```
[Video Call 100%]
[Toggle Button: Show/Hide Form]
[Form Panel: Overlay Modal]
```

### **Mobile View (<768px)**
```
[Video Call: Full Screen]
[Form: Bottom Sheet/Modal]
```

## 🚀 Real-Time Events During Video Call

### **Form Update Events**
```javascript
// User types in field
{
  type: 'form_update',
  fieldId: 'principal_name',
  newValue: 'John Doe',
  userId: 'user_123',
  userRole: 'client',
  timestamp: 1703123456789
}

// Signature added
{
  type: 'signature_update',
  fieldId: 'notary_signature',
  signature: 'data:image/png;base64,iVBOR...',
  signedBy: 'notary_456',
  timestamp: 1703123456790
}

// User joins/leaves
{
  type: 'user_joined',
  userId: 'notary_456',
  userRole: 'notary',
  timestamp: 1703123456791
}
```

### **UI Notifications**
- 🟢 "Notary joined the session"
- 🔄 "Notary updated the form"
- ✍️ "Notary added signature"
- ⚠️ "Connection lost, attempting to reconnect..."
- ✅ "All signatures completed"

## 🔄 State Synchronization

### **Data Sources Priority:**
1. **User Input** - Immediate local update
2. **Real-time Sync** - Propagate to other users
3. **Firestore** (if implemented) - Persistent storage
4. **localStorage** - Browser backup

### **Conflict Resolution:**
- **Last Write Wins** - Most recent timestamp takes precedence
- **User Role Priority** - Notary edits override user edits for notary fields
- **Field Locking** - Prevent simultaneous edits of signature fields

## 📊 Performance Considerations

### **Optimization Strategies:**
- **Debounced Updates** - 500ms delay before sync
- **Field-Level Sync** - Only sync changed fields
- **Connection Pooling** - Reuse WebSocket connections
- **Lazy Loading** - Load form sections on demand
- **Offline Support** - Queue updates when disconnected

### **Error Handling:**
- **Auto Retry** - Up to 5 attempts with exponential backoff
- **Graceful Degradation** - Continue without real-time if sync fails
- **Data Recovery** - Restore from localStorage on reconnect
- **User Notifications** - Clear status messages for all states

This system provides seamless real-time collaboration between users and notaries during video calls, with clear permission boundaries and robust error handling.
