
import React from 'react';
import CareerToolsLanding from '../components/career/CareerToolsLanding';
import { motion } from 'framer-motion';
import MainLayout from '../layouts/MainLayout';

const CareerTools: React.FC = () => (
  <MainLayout>
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <CareerToolsLanding />
    </motion.div>
  </MainLayout>
);

export default CareerTools;
