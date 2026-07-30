import React, { ReactNode } from "react";
import { motion, AnimatePresence } from 'framer-motion';

interface EmptyStateAnimationProps {
  title?: string;
  description?: string | ReactNode;
  children?: ReactNode;
  show?: boolean;
}

const EmptyStateAnimation: React.FC<EmptyStateAnimationProps> = ({ 
  title = "哎呀，这里还是空的呢~",
  description,
  children,
  show = true
}) => {
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.2,
        duration: 0.8,
        type: "spring",
        bounce: 0.4
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 20 }
    }
  };

  return (
    <AnimatePresence mode="wait">
      {show ? (
        <motion.div
          key="empty"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{ height: '100%' }}
        >
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              padding: '20px',
              background: '#FFF5F5',
              borderRadius: '20px'
            }}
          >
            <motion.div variants={itemVariants}>
              <motion.svg width="200" height="200" viewBox="0 0 200 200">
                <motion.path
                  d="M40,140 Q60,120 80,140 T120,140 T160,140"
                  fill="#FFD6E7"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                />
                <motion.circle cx="80" cy="100" r="8" fill="#FF69B4" />
                <motion.circle cx="120" cy="100" r="8" fill="#FF69B4" />
                <motion.path
                  d="M70,130 Q100,150 130,130"
                  fill="none"
                  stroke="#FF69B4"
                  strokeWidth="4"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                />
              </motion.svg>
            </motion.div>
            <motion.h2
              variants={itemVariants}
              style={{ color: '#FF69B4', marginTop: 20, fontSize: '24px', fontWeight: 'bold' }}
            >
              {title}
            </motion.h2>
            {description && (
              <motion.p
                variants={itemVariants}
                style={{ color: '#FF69B4', marginTop: 10, fontSize: '16px' }}
              >
                {description}
              </motion.p>
            )}
          </motion.div>
        </motion.div>
      ) : (
        <motion.div
          key="content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EmptyStateAnimation;