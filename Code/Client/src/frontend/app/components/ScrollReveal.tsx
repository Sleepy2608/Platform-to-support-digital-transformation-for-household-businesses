'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  delay?: number;
}

export default function ScrollReveal({ children, delay = 0 }: Props) {
  const shouldReduce = useReducedMotion();

  if (shouldReduce) {
    return <>{children}</>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }} // Trạng thái ban đầu: mờ & thụt xuống
      whileInView={{ opacity: 1, y: 0 }} // Trạng thái khi hiện trong màn hình
      viewport={{ once: true, margin: '-50px' }} // once: true — animation chỉ chạy 1 lần, không lặp lại khi scroll
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}