import { Routes, Route } from 'react-router-dom';
import PromptTools from './pages/PromptTools';
import Home from './pages/Home';
import ProfileUpload from './pages/ProfileUpload';
import CareerToolsLanding from './pages/CareerTools';
import JobTailorForm from './pages/JobTailorForm';
import InterviewPrep from './pages/InterviewPrep';
import MainLayout from './layouts/MainLayout';

export default function App() {
  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/profile" element={<ProfileUpload />} />
        <Route path="/career" element={<CareerToolsLanding />} />
        <Route path="/career/tailor" element={<JobTailorForm />} />
        <Route path="/career/interview-prep" element={<InterviewPrep />} />
                <Route path="/prompt-tools" element={<PromptTools />} />
      </Routes>
    </MainLayout>
  );
}
