import { Routes, Route, Navigate } from 'react-router-dom';
import AppShell from '../layouts/AppShell';
import LandingPage from '../pages/LandingPage';
import LoginPage from '../pages/auth/LoginPage';
import SignupPage from '../pages/auth/SignupPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import { ProtectedRoute, GuestRoute } from '../components/ProtectedRoute';
import { ROLES } from '../constants/roles';
import StudentDashboard from '../pages/student/StudentDashboard';
import StudentTrainingPage from '../pages/student/StudentTrainingPage';
import StudentProgressPage from '../pages/student/StudentProgressPage';
import StudentLearnPage from '../pages/student/StudentLearnPage';
import StudentTechniquesPage from '../pages/student/StudentTechniquesPage';
import StudentLessonsPage from '../pages/student/StudentLessonsPage';
import StudentExercisesPage from '../pages/student/StudentExercisesPage';
import StudentFlashcardsPage from '../pages/student/StudentFlashcardsPage';
import StudentLeaderboardPage from '../pages/student/StudentLeaderboardPage';
import ParentDashboard from '../pages/parent/ParentDashboard';
import ParentVerifyPage from '../pages/parent/ParentVerifyPage';
import ParentChildrenPage from '../pages/parent/ParentChildrenPage';
import ParentVideosPage from '../pages/parent/ParentVideosPage';
import InstructorDashboard from '../pages/instructor/InstructorDashboard';
import InstructorReviewsPage from '../pages/instructor/InstructorReviewsPage';
import InstructorCurriculumPage from '../pages/instructor/InstructorCurriculumPage';
import InstructorStudentsPage from '../pages/instructor/InstructorStudentsPage';
import InstructorReportsPage from '../pages/instructor/InstructorReportsPage';
import InstructorLeaderboardPage from '../pages/instructor/InstructorLeaderboardPage';
import ProfileSettingsPage from '../pages/shared/ProfileSettingsPage';

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/signup" element={<GuestRoute><SignupPage /></GuestRoute>} />
      <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />

      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<StudentDashboard />} />
        <Route path="training" element={<StudentTrainingPage />} />
        <Route path="training/:requirementId" element={<StudentTrainingPage />} />
        <Route path="learn" element={<StudentLearnPage />} />
        <Route path="learn/techniques" element={<StudentTechniquesPage />} />
        <Route path="learn/lessons" element={<StudentLessonsPage />} />
        <Route path="learn/exercises" element={<StudentExercisesPage />} />
        <Route path="learn/terms" element={<StudentFlashcardsPage />} />
        <Route path="progress" element={<StudentProgressPage />} />
        <Route path="leaderboard" element={<StudentLeaderboardPage />} />
        <Route path="settings" element={<ProfileSettingsPage />} />
      </Route>

      <Route
        path="/parent"
        element={
          <ProtectedRoute allowedRoles={[ROLES.PARENT]}>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<ParentDashboard />} />
        <Route path="verify" element={<ParentVerifyPage />} />
        <Route path="videos" element={<ParentVideosPage />} />
        <Route path="children" element={<ParentChildrenPage />} />
        <Route path="settings" element={<ProfileSettingsPage />} />
      </Route>

      <Route
        path="/instructor"
        element={
          <ProtectedRoute allowedRoles={[ROLES.INSTRUCTOR]}>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<InstructorDashboard />} />
        <Route path="reviews" element={<InstructorReviewsPage />} />
        <Route path="curriculum" element={<InstructorCurriculumPage />} />
        <Route path="students" element={<InstructorStudentsPage />} />
        <Route path="reports" element={<InstructorReportsPage />} />
        <Route path="leaderboard" element={<InstructorLeaderboardPage />} />
        <Route path="settings" element={<ProfileSettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
