# Connect to Notary Flow Documentation

## Overview
The Connect to Notary feature allows clients and notaries to connect via video call for document notarization. Both parties join the same meeting using the same meeting ID but with different roles and permissions.

## Flow Architecture

### 1. Client Side (User Journey)
When a client selects "Connect to Notary" from step 3 of the form:

1. **Meeting Creation**: A unique meeting ID is generated with format: `NOTARY-{timestamp}-{randomCode}`
2. **Session Storage**: The meeting ID and form data are stored in a notary session
3. **Redirect**: Client is redirected to `/video-call?meetingId=NOTARY-xxxxx`
4. **Role Assignment**: Client automatically gets "Client" role (no authentication required)
5. **Access**: Client can:
   - View the document
   - Sign the document
   - Participate in video call
   - End session (returns to dashboard)

#### Client URL Example:
```
http://localhost:3000/en/video-call?meetingId=NOTARY-1757617353459-2K8VQ2
```

### 2. Notary Side (Notary Journey)
Notaries access the same meeting from their dashboard:

1. **Dashboard Access**: Notary logs into `/dashboard/member`
2. **View Submissions**: See all pending notarization requests
3. **Start Meeting**: Click "Start Meeting" button for a specific submission
4. **Authentication Check**: System verifies notary is logged in
5. **Redirect**: Notary is redirected to `/video-call?meetingId=NOTARY-xxxxx&from=member`
6. **Role Assignment**: Notary automatically gets "Notary" role
7. **Access**: Notary can:
   - View the document
   - Verify client identity
   - Notarize & seal the document
   - End session (returns to notary dashboard)

#### Notary URL Example:
```
http://localhost:3000/en/video-call?meetingId=NOTARY-1757617353459-2K8VQ2&from=member
```

## Role Detection Logic

```javascript
// In videoCallPage.jsx
if (from === 'member' || from === 'notary') {
  // User is a notary - must be authenticated
  if (!user) {
    // Redirect to sign in
  }
  setRole('Notary');
} else {
  // User is a client - no authentication required
  setRole('Client');
}
```

## Key Differences Between Roles

### Client Features:
- No authentication required
- Can sign document
- "End Session" button → returns to `/dashboard`
- Cannot notarize documents
- No verification panel access

### Notary Features:
- Must be authenticated
- Can verify client identity
- Can notarize & seal documents
- "End Session" button → returns to `/dashboard/member`
- Has access to verification panel
- Can apply notary stamp

## Security Measures

1. **Notary Authentication**: Notaries must be signed in to access meetings
2. **Session-based Access**: Meeting IDs are unique and session-specific
3. **Role-based Permissions**: Different UI and actions based on user role
4. **Verification Process**: Notaries must complete identity verification before notarizing

## Database Structure

### Notary Sessions Collection
```javascript
{
  id: "NOTARY-xxxxx",
  createdAt: timestamp,
  status: "pending" | "in-progress" | "completed",
  clientInfo: {
    name: string,
    email: string,
    ...
  },
  document: {
    type: string,
    originalUrl: string,
    notarizedUrl: string,
    status: string,
    ...
  },
  verificationComplete: boolean,
  verificationData: {...},
  notaryInfo: {
    id: string,
    name: string,
    commissionNumber: string,
    ...
  }
}
```

## API Endpoints

### 1. Start Notary Session
- **Endpoint**: `/api/notary/start-session`
- **Method**: POST
- **Creates**: New notary session with meeting ID

### 2. Update Notary Session
- **Endpoint**: `/api/notary/update-session`
- **Method**: POST
- **Updates**: Session data, verification status, signatures

### 3. Notary Stamp PDF
- **Endpoint**: `/api/notary-stamp-pdf`
- **Method**: POST
- **Purpose**: Apply notary seal and signatures to document

## Testing Instructions

### Test as Client:
1. Go through form steps 1-3
2. Select "Connect to Notary" option
3. You'll be redirected to video call as a client
4. Share the meeting URL with notary

### Test as Notary:
1. Sign in to the platform
2. Go to `/dashboard/member`
3. Find the pending submission
4. Click "Start Meeting"
5. You'll join the same video call as notary

## Common Issues & Solutions

### Issue 1: "joinRoom repeat" warning
**Solution**: Already implemented delay and initialization checks

### Issue 2: Notary can't access meeting
**Solution**: Ensure notary is logged in and accessing from dashboard with `from=member` parameter

### Issue 3: Roles not properly assigned
**Solution**: Check URL parameters and authentication status

## Future Enhancements

1. **Scheduling System**: Allow clients to schedule notary appointments
2. **Notary Availability**: Show notary availability status
3. **Multiple Notaries**: Support for multiple notaries in the system
4. **Notification System**: Real-time notifications when client joins
5. **Recording Option**: Option to record notarization session
6. **Document Templates**: Pre-filled templates for common documents

## Support & Maintenance

For issues or updates to the notary flow:
1. Check console logs for role assignment
2. Verify Firebase authentication status
3. Ensure meeting IDs match between client and notary
4. Check network connectivity for video calls
