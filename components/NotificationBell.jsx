import { useState } from 'react';
import { FiBell } from 'react-icons/fi';
import { useRouter } from 'next/navigation';

export default function NotificationBell({ pendingMeetings = [] }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const router = useRouter();
  const hasMeetings = pendingMeetings.length > 0;

  return (
    <div className="position-relative" style={{marginTop:'30px'}}>
      <div style={{
        height:'50px',
        width:'50px',
        borderRadius: '15px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white'
      }}>
        <FiBell 
          className="text-muted" 
          style={{ fontSize: '24px', cursor: 'pointer' }} 
          onClick={() => setShowDropdown(!showDropdown)}
        />
      </div>
      {hasMeetings && (
        <span className="position-absolute" style={{top: '5px', right: '8px', width: '11px', height: '11px', backgroundColor: '#dc3545', borderRadius: '50%', border: '2px solid white'}}>
          <span className="visually-hidden">New notifications</span>
        </span>
      )}
      {showDropdown && (
        <div className="position-absolute end-0 mt-2" style={{ width: '300px', backgroundColor: 'white', borderRadius: '10px', boxShadow: '0 0 10px rgba(0,0,0,0.1)', zIndex: 1000 }}>
          <div className="p-3 border-bottom d-flex justify-content-between align-items-center">
            <h6 className="m-0" style={{fontFamily:'Jost, sans-serif', fontSize:'17px'}} >Pending Meetings</h6>
          </div>
          <div className="notification-list" style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {hasMeetings ? (
              pendingMeetings.map((meeting, idx) => (
                <div className="p-3 border-bottom" key={idx}>
                  <p className="mb-1"><strong>{meeting.step1?.firstName || ''} {meeting.step1?.lastName || ''}</strong></p>
                  <p className="mb-1">{meeting.meetingDate ? new Date(meeting.meetingDate).toLocaleString() : ''} {meeting.meetingTime || ''}</p>
                  <button className="btn btn-primary btn-sm mt-2" onClick={() => router.push(`/video-call?meetingId=${meeting.meetingId}&from=notary`)}>
                    Join Meeting
                  </button>
                </div>
              ))
            ) : (
              <div className="p-3 text-center text-muted">No upcoming meetings</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 