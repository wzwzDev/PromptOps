
import React from 'react';
import JobTailorForm from '../components/career/JobTailorForm';
import { motion } from 'framer-motion';
import MainLayout from '../layouts/MainLayout';

const JobTailorFormPage: React.FC = () => (
  <MainLayout>
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <JobTailorForm />
    </motion.div>
  </MainLayout>
);

export default JobTailorFormPage;
