// "use client"

// import { useState, useEffect } from "react"
// import { ArrowLeft } from "lucide-react"
// import Link from "next/link"
// import { collection, getDocs, query, where } from "firebase/firestore"
// import { db } from "@/firebase"
// import { useRouter } from 'next/navigation'

// // Sample meeting data
// const meetings = [
//   {
//     id: 1,
//     title: "Team Standup",
//     time: "09:00 AM",
//     duration: "30 min",
//     attendees: ["John", "Sarah", "Mike"],
//     location: "Conference Room A",
//     color: "#3b82f6",
//     date: new Date(2024, 11, 15), // December 15, 2024
//   },
//   {
//     id: 2,
//     title: "Product Review",
//     time: "02:00 PM",
//     duration: "1 hour",
//     attendees: ["Alice", "Bob", "Carol"],
//     location: "Virtual",
//     color: "#10b981",
//     date: new Date(2024, 11, 15),
//   },
//   {
//     id: 3,
//     title: "Client Presentation",
//     time: "10:00 AM",
//     duration: "2 hours",
//     attendees: ["David", "Emma"],
//     location: "Main Hall",
//     color: "#8b5cf6",
//     date: new Date(2024, 11, 18),
//   },
//   {
//     id: 4,
//     title: "Design Workshop",
//     time: "03:00 PM",
//     duration: "1.5 hours",
//     attendees: ["Frank", "Grace"],
//     location: "Design Studio",
//     color: "#f97316",
//     date: new Date(2024, 11, 22),
//   },
// ]

// const months = [
//   "January",
//   "February",
//   "March",
//   "April",
//   "May",
//   "June",
//   "July",
//   "August",
//   "September",
//   "October",
//   "November",
//   "December",
// ]

// const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

// const styles = {
//   container: {
//     display: "flex",
//     flexDirection: "row",
//     gap: "24px",
//     padding: "24px",
//     minHeight: "100vh",
//     backgroundColor: "#f9fafb",
//     fontFamily: "system-ui, -apple-system, sans-serif",
//   },
//   calendarSection: {
//     flex: 1,
//   },
//   card: {
//     backgroundColor: "white",
//     borderRadius: "8px",
//     boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
//     border: "1px solid #e5e7eb",
//     height: "100%",
//   },
//   header: {
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "space-between",
//     padding: "24px",
//     borderBottom: "1px solid #e5e7eb",
//   },
//   title: {
//     fontSize: "24px",
//     fontWeight: "600",
//     color: "#111827",
//     margin: 0,
//   },
//   navButtons: {
//     display: "flex",
//     alignItems: "center",
//     gap: "8px",
//   },
//   navButton: {
//     padding: "8px",
//     border: "1px solid #d1d5db",
//     borderRadius: "6px",
//     backgroundColor: "white",
//     cursor: "pointer",
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   newMeetingButton: {
//     marginLeft: "8px",
//     padding: "8px 16px",
//     backgroundColor: "#3b82f6",
//     color: "white",
//     border: "none",
//     borderRadius: "6px",
//     cursor: "pointer",
//     fontSize: "14px",
//     fontWeight: "500",
//   },
//   calendarContent: {
//     padding: "24px",
//   },
//   daysHeader: {
//     display: "grid",
//     gridTemplateColumns: "repeat(7, 1fr)",
//     gap: "4px",
//     marginBottom: "8px",
//   },
//   dayHeader: {
//     padding: "8px",
//     textAlign: "center",
//     fontSize: "14px",
//     fontWeight: "500",
//     color: "#6b7280",
//   },
//   calendarGrid: {
//     display: "grid",
//     gridTemplateColumns: "repeat(7, 1fr)",
//     gap: "4px",
//   },
//   calendarDay: {
//     minHeight: "80px",
//     padding: "4px",
//     border: "1px solid #f3f4f6",
//     borderRadius: "8px",
//     cursor: "pointer",
//     transition: "background-color 0.2s",
//   },
//   calendarDayHover: {
//     backgroundColor: "#f9fafb",
//   },
//   calendarDayToday: {
//     backgroundColor: "#eff6ff",
//     borderColor: "#bfdbfe",
//   },
//   calendarDaySelected: {
//     backgroundColor: "#dbeafe",
//     borderColor: "#93c5fd",
//   },
//   dayNumber: {
//     fontSize: "14px",
//     fontWeight: "500",
//     marginBottom: "4px",
//   },
//   dayNumberToday: {
//     color: "#2563eb",
//   },
//   meetingBlock: {
//     fontSize: "12px",
//     padding: "2px 4px",
//     borderRadius: "4px",
//     color: "white",
//     marginBottom: "2px",
//     overflow: "hidden",
//     textOverflow: "ellipsis",
//     whiteSpace: "nowrap",
//   },
//   moreText: {
//     fontSize: "12px",
//     color: "#6b7280",
//     padding: "0 4px",
//   },
//   sidebar: {
//     width: "320px",
//   },
//   sidebarHeader: {
//     padding: "24px",
//     borderBottom: "1px solid #e5e7eb",
//   },
//   sidebarTitle: {
//     fontSize: "18px",
//     fontWeight: "600",
//     color: "#111827",
//     margin: 0,
//   },
//   sidebarContent: {
//     padding: "24px",
//   },
//   emptyState: {
//     textAlign: "center",
//     padding: "32px 0",
//     color: "#6b7280",
//   },
//   emptyIcon: {
//     width: "48px",
//     height: "48px",
//     margin: "0 auto 12px",
//     color: "#d1d5db",
//   },
//   addMeetingButton: {
//     marginTop: "12px",
//     padding: "8px 16px",
//     border: "1px solid #d1d5db",
//     borderRadius: "6px",
//     backgroundColor: "white",
//     cursor: "pointer",
//     fontSize: "14px",
//   },
//   meetingCard: {
//     border: "1px solid #e5e7eb",
//     borderRadius: "8px",
//     marginBottom: "16px",
//     borderLeftWidth: "4px",
//   },
//   meetingCardContent: {
//     padding: "16px",
//   },
//   meetingTitle: {
//     fontSize: "16px",
//     fontWeight: "600",
//     color: "#111827",
//     margin: "0 0 8px 0",
//   },
//   meetingDetails: {
//     display: "flex",
//     alignItems: "center",
//     gap: "16px",
//     marginBottom: "12px",
//     fontSize: "14px",
//     color: "#6b7280",
//   },
//   meetingTime: {
//     display: "flex",
//     alignItems: "center",
//     gap: "4px",
//   },
//   badge: {
//     padding: "4px 8px",
//     backgroundColor: "#f3f4f6",
//     color: "#374151",
//     borderRadius: "12px",
//     fontSize: "12px",
//     fontWeight: "500",
//   },
//   locationRow: {
//     display: "flex",
//     alignItems: "center",
//     gap: "4px",
//     fontSize: "14px",
//     color: "#6b7280",
//     marginBottom: "12px",
//   },
//   attendeesRow: {
//     display: "flex",
//     alignItems: "center",
//     gap: "4px",
//     fontSize: "14px",
//     color: "#6b7280",
//     marginBottom: "8px",
//   },
//   avatarGroup: {
//     display: "flex",
//     marginLeft: "-8px",
//   },
//   avatar: {
//     width: "24px",
//     height: "24px",
//     borderRadius: "50%",
//     backgroundColor: "#d1d5db",
//     border: "2px solid white",
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "center",
//     fontSize: "12px",
//     fontWeight: "500",
//     color: "#374151",
//     marginLeft: "-8px",
//   },
//   backButton: {
//     display: "flex",
//     alignItems: "center",
//     gap: "8px",
//     border: "none",
//     backgroundColor: "transparent",
//     cursor: "pointer",
//     fontSize: "14px",
//     fontWeight: "500",
//     color: "#374151",
//     padding: "4px",
//   },
// }

// export default function CalendarPage() {
//   const [currentDate, setCurrentDate] = useState(new Date())
//   const [selectedDate, setSelectedDate] = useState(new Date())
//   const [meetings, setMeetings] = useState([])
//   const [loading, setLoading] = useState(true)
//   const router = useRouter()

//   const year = currentDate.getFullYear()
//   const month = currentDate.getMonth()

//   // Get first day of the month and number of days
//   const firstDayOfMonth = new Date(year, month, 1)
//   const lastDayOfMonth = new Date(year, month + 1, 0)
//   const firstDayWeekday = firstDayOfMonth.getDay()
//   const daysInMonth = lastDayOfMonth.getDate()

//   // Generate calendar days
//   const calendarDays = []

//   // Add empty cells for days before the first day of the month
//   for (let i = 0; i < firstDayWeekday; i++) {
//     calendarDays.push(null)
//   }

//   // Add days of the month
//   for (let day = 1; day <= daysInMonth; day++) {
//     calendarDays.push(day)
//   }

//   const navigateMonth = (direction) => {
//     setCurrentDate((prev) => {
//       const newDate = new Date(prev)
//       if (direction === "prev") {
//         newDate.setMonth(prev.getMonth() - 1)
//       } else {
//         newDate.setMonth(prev.getMonth() + 1)
//       }
//       return newDate
//     })
//   }

//   const getMeetingsForDate = (day) => {
//     const dateToCheck = new Date(year, month, day)
//     return meetings.filter((meeting) => meeting.date.toDateString() === dateToCheck.toDateString())
//   }

//   const getSelectedDateMeetings = () => {
//     return meetings.filter((meeting) => meeting.date.toDateString() === selectedDate.toDateString())
//   }

//   const isToday = (day) => {
//     const today = new Date()
//     const dateToCheck = new Date(year, month, day)
//     return dateToCheck.toDateString() === today.toDateString()
//   }

//   const isSelected = (day) => {
//     const dateToCheck = new Date(year, month, day)
//     return dateToCheck.toDateString() === selectedDate.toDateString()
//   }

//   useEffect(() => {
//     fetchMeetings()
//   }, [])

//   const fetchMeetings = async () => {
//     const q = query(collection(db, "formSubmissions"), where("status", "==", "pending"));
//     const querySnapshot = await getDocs(q);
//     const meetingsList = querySnapshot.docs.map(doc => {
//       const data = doc.data();
//       return {
//         id: doc.id,
//         meetingId: data.meetingId,
//         title: `${data.step1?.firstName || ""} ${data.step1?.lastName || ""}`.trim() || "User Meeting",
//         time: data.meetingTime || '10:00 AM',
//         duration: '30 min',
//         attendees: [data.step1?.firstName || 'User'],
//         location: 'Virtual',
//         color: '#3b82f6',
//         date: data.meetingDate ? new Date(data.meetingDate) : new Date(),
//         status: data.status || 'pending'
//       };
//     });
//     setMeetings(meetingsList);
//     setLoading(false);
//   }

//   return (
//     <div style={styles.container}>
//       {/* Calendar Section */}
//       <div style={styles.calendarSection}>
//         <div style={styles.card}>
//           {/* Calendar Header */}
//           <div style={styles.header}>
//             <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
//               <button onClick={() => router.push('/dashboard')} style={styles.backButton}>
//                 <ArrowLeft size={23} />              
//               </button>

//               <h1 style={styles.title}>
//                 {months[month]} {year}
//               </h1>
            
//               <div style={styles.navButtons}>
//                 <button onClick={() => navigateMonth("prev")} style={styles.navButton}>
//                   <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
//                   </svg>
//                 </button>

//                 <button onClick={() => navigateMonth("next")} style={styles.navButton}>
//                   <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
//                   </svg>
//                 </button>

//                 <Link href="/video-call?from=calendar">
//                   <button style={styles.newMeetingButton}>
//                     <svg
//                       width="16"
//                       height="16"
//                       fill="none"
//                       stroke="currentColor"
//                       viewBox="0 0 24 24"
//                       style={{ marginRight: "4px" }}
//                     >
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
//                     </svg>
//                     New Meeting
//                   </button>
//                 </Link>
//               </div>
//             </div>
//           </div>

//           <div style={styles.calendarContent}>
//             {/* Days of week header */}
//             <div style={styles.daysHeader}>
//               {daysOfWeek.map((day) => (
//                 <div key={day} style={styles.dayHeader}>
//                   {day}
//                 </div>
//               ))}
//             </div>

//             {/* Calendar grid */}
//             <div style={styles.calendarGrid}>
//               {calendarDays.map((day, index) => {
//                 const dayStyle = {
//                   ...styles.calendarDay,
//                   ...(day && isToday(day) ? styles.calendarDayToday : {}),
//                   ...(day && isSelected(day) ? styles.calendarDaySelected : {}),
//                 }

//                 return (
//                   <div
//                     key={index}
//                     style={dayStyle}
//                     onClick={() => day && setSelectedDate(new Date(year, month, day))}
//                     onMouseEnter={(e) => day && (e.target.style.backgroundColor = "#f9fafb")}
//                     onMouseLeave={(e) => {
//                       if (day && isToday(day)) {
//                         e.target.style.backgroundColor = "#eff6ff"
//                       } else if (day && isSelected(day)) {
//                         e.target.style.backgroundColor = "#dbeafe"
//                       } else {
//                         e.target.style.backgroundColor = "transparent"
//                       }
//                     }}
//                   >
//                     {day && (
//                       <>
//                         <div
//                           style={{
//                             ...styles.dayNumber,
//                             ...(isToday(day) ? styles.dayNumberToday : {}),
//                           }}
//                         >
//                           {day}
//                         </div>
//                         <div>
//                           {getMeetingsForDate(day)
//                             .slice(0, 2)
//                             .map((meeting) => (
//                               <div
//                                 key={meeting.id}
//                                 style={{
//                                   ...styles.meetingBlock,
//                                   backgroundColor: meeting.color,
//                                 }}
//                               >
//                                 {meeting.title}
//                               </div>
//                             ))}
//                           {getMeetingsForDate(day).length > 2 && (
//                             <div style={styles.moreText}>+{getMeetingsForDate(day).length - 2} more</div>
//                           )}
//                         </div>
//                       </>
//                     )}
//                   </div>
//                 )
//               })}
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Meeting Details Sidebar */}
//       <div style={styles.sidebar}>
//         <div style={styles.card}>
//           <div style={styles.sidebarHeader}>
//             <h2 style={styles.sidebarTitle}>
//               {selectedDate.toLocaleDateString("en-US", {
//                 weekday: "long",
//                 month: "long",
//                 day: "numeric",
//               })}
//             </h2>
//           </div>

//           <div style={styles.sidebarContent}>
//             {loading ? (
//               <div style={styles.emptyState}>
//                 <p>Loading meetings...</p>
//               </div>
//             ) : getSelectedDateMeetings().length === 0 ? (
//               <div style={styles.emptyState}>
//                 <svg style={styles.emptyIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     strokeWidth={2}
//                     d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
//                   />
//                 </svg>
//                 <p>No meetings scheduled</p>
//                 <Link href="/video-call?from=calendar">
//                   <button style={styles.addMeetingButton}>
//                     <svg
//                       width="16"
//                       height="16"
//                       fill="none"
//                       stroke="currentColor"
//                       viewBox="0 0 24 24"
//                       style={{ marginRight: "4px", verticalAlign: "middle" }}
//                     >
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
//                     </svg>
//                     Schedule Meeting
//                   </button>
//                 </Link>
//               </div>
//             ) : (
//               getSelectedDateMeetings().map((meeting) => (
//                 <div
//                   key={meeting.id}
//                   style={{
//                     ...styles.meetingCard,
//                     borderLeftColor: meeting.color,
//                   }}
//                 >
//                   <div style={styles.meetingCardContent}>
//                     <h3 style={styles.meetingTitle}>{meeting.title}</h3>
//                     <div style={styles.meetingDetails}>
//                       <div style={styles.meetingTime}>
//                         <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                           <path
//                             strokeLinecap="round"
//                             strokeLinejoin="round"
//                             strokeWidth={2}
//                             d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
//                           />
//                         </svg>
//                         {meeting.time}
//                       </div>
//                       <span style={styles.badge}>{meeting.duration}</span>
//                       <span style={{...styles.badge, backgroundColor: meeting.status === 'approved' ? '#dcfce7' : '#fef3c7', color: meeting.status === 'approved' ? '#166534' : '#d97706'}}>
//                         {meeting.status}
//                       </span>
//                     </div>

//                     <div style={styles.locationRow}>
//                       <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                         <path
//                           strokeLinecap="round"
//                           strokeLinejoin="round"
//                           strokeWidth={2}
//                           d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
//                         />
//                         <path
//                           strokeLinecap="round"
//                           strokeLinejoin="round"
//                           strokeWidth={2}
//                           d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
//                         />
//                       </svg>
//                       {meeting.location}
//                     </div>

//                     <div>
//                       <div style={styles.attendeesRow}>
//                         <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                           <path
//                             strokeLinecap="round"
//                             strokeLinejoin="round"
//                             strokeWidth={2}
//                             d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
//                           />
//                         </svg>
//                         {meeting.attendees.length} attendees
//                       </div>
//                       <div style={styles.avatarGroup}>
//                         {meeting.attendees.slice(0, 3).map((attendee, index) => (
//                           <div key={index} style={styles.avatar}>
//                             {attendee.charAt(0)}
//                           </div>
//                         ))}
//                         {meeting.attendees.length > 3 && (
//                           <div style={{ ...styles.avatar, backgroundColor: "#e5e7eb" }}>
//                             +{meeting.attendees.length - 3}
//                           </div>
//                         )}
//                       </div>
//                     </div>

//                     {meeting.meetingId && (
//                       <Link href={`/video-call?meetingId=${meeting.meetingId}`}>
//                         <button
//                           style={{
//                             marginTop: "12px",
//                             padding: "8px 16px",
//                             backgroundColor: "#3b82f6",
//                             color: "white",
//                             border: "none",
//                             borderRadius: "6px",
//                             cursor: "pointer",
//                             fontSize: "14px",
//                             fontWeight: "500",
//                             width: "100%",
//                           }}
//                         >
//                           Start Meeting
//                         </button>
//                       </Link>
//                     )}
//                   </div>
//                 </div>
//               ))
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }
