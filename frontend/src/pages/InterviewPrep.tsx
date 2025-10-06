
import React from 'react';
import InterviewPrep from '../components/career/InterviewPrep';
import { motion } from 'framer-motion';
import MainLayout from '../layouts/MainLayout';

const InterviewPrepPage: React.FC = () => (
  <MainLayout>
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <InterviewPrep />
    </motion.div>
  </MainLayout>
);

export default InterviewPrepPage;
