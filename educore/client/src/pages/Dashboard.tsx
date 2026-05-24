import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [studentName, setStudentName] = useState('');
  const [createdStudent, setCreatedStudent] = useState<any>(null);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  const registerStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName) return;
    setLoading(true);
    setMessage('');
    setCreatedStudent(null);
    setQrCodeData(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(`${API_URL}/api/students`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ fullName: studentName })
      });
      const student = await response.json();
      if (!response.ok) throw new Error(student.error || 'Failed to create student');

      setCreatedStudent(student);

      const qrResponse = await fetch(`${API_URL}/api/students/${student.id}/qr`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const qrData = await qrResponse.json();
      setQrCodeData(qrData.qrDataUri);
      setStudentName('');
      setMessage('Student registered successfully!');
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white shadow-sm border-b border-slate-200 px-4 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900">EduCore Dashboard</h1>
          <p className="text-xs text-slate-500">{user?.email}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/scanner')}
            className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg font-medium text-sm hover:bg-blue-100 transition-all"
          >
            Scanner
          </button>
          <button
            onClick={handleLogout}
            className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg font-medium text-sm hover:bg-slate-200 transition-all"
          >
            Log Out
          </button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Register Student</h3>
          <form onSubmit={registerStudent} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Jane Doe"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Register Student'}
            </button>
          </form>
          {message && (
            <p className="mt-4 p-3 bg-slate-100 rounded-lg text-sm text-slate-700">
              {message}
            </p>
          )}
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center min-h-[300px]">
          {qrCodeData && createdStudent ? (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-200 p-4 rounded-xl bg-slate-50">
                <img src={qrCodeData} alt="Student QR Code" className="w-48 h-48 mx-auto" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-900">{createdStudent.fullName}</h4>
                <p className="text-sm text-blue-600 font-mono font-semibold">ID: {createdStudent.studentId}</p>
              </div>
            </div>
          ) : (
            <div className="text-slate-400">
              <p className="text-sm">No student registered yet.</p>
              <p className="text-xs mt-1">QR codes will appear here.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
