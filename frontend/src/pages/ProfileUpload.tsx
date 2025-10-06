
import React from 'react';
import ProfileUpload from '../components/ProfileUpload';
import { motion } from 'framer-motion';
import MainLayout from '../layouts/MainLayout';

const ProfileUploadPage: React.FC = () => (
  <MainLayout>
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <ProfileUpload />
    </motion.div>
  </MainLayout>
);

export default ProfileUploadPage;
