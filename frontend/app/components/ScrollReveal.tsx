'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  delay?: number;
}

export default function ScrollReveal({ children, delay = 0 }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }} // Trạng thái ban đầu: mờ & thụt xuống
      whileInView={{ opacity: 1, y: 0 }} // Trạng thái khi hiện trong màn hình
      viewport={{ once: false, margin: '-50px' }} // 👈 once: false giúp hiệu ứng lặp lại mỗi khi cuộn tới
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}