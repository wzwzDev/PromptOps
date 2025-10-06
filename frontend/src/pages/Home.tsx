
import React from 'react';
import { motion } from 'framer-motion';
import MainLayout from '../layouts/MainLayout';

const Home: React.FC = () => (
  <MainLayout>
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} className="flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold mb-4 text-teal-700">Welcome to PromptOps Dashboard</h1>
      <p className="text-lg text-gray-700 mb-8">AI-powered tools for career, productivity, and more.</p>
    </motion.div>
  </MainLayout>
);

export default Home;
