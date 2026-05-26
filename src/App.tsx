import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { SettingsPage } from './pages/SettingsPage';
import { ListeningPage } from './pages/ListeningPage';
import { VocabularyPage } from './pages/VocabularyPage';
import { SpeakingPage } from './pages/SpeakingPage';
import { ReadingWritingPage } from './pages/ReadingWritingPage';
import { DailySummaryPage } from './pages/DailySummaryPage';
import { StageReviewPage } from './pages/StageReviewPage';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<DashboardPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/listening" element={<ListeningPage />} />
          <Route path="/vocabulary" element={<VocabularyPage />} />
          <Route path="/speaking" element={<SpeakingPage />} />
          <Route path="/reading-writing" element={<ReadingWritingPage />} />
          <Route path="/daily-summary" element={<DailySummaryPage />} />
          <Route path="/stage-review" element={<StageReviewPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
