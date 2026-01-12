import { Inter } from 'next/font/google';
import { AuthProvider } from '@/context/AuthContext';
import { WorkflowProvider } from '../contexts/WorkflowContext';
import Notifications from '../components/Notifications';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'WiScribble',
  description: 'Document Management System',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <WorkflowProvider>
            {children}
            <Notifications position="top-right" maxNotifications={5} />
          </WorkflowProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
