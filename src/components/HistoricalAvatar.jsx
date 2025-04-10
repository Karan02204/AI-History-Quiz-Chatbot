import React from 'react';
import { Box, Typography, Avatar } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';

const HistoricalAvatar = ({ mood = 'neutral', message }) => {
  // Avatar expressions for different moods
  const avatarExpressions = {
    neutral: '👨‍🏫',
    happy: '😊',
    thinking: '🤔',
    excited: '🎉'
  };

  const avatarAnimations = {
    neutral: {
      y: [0, -5, 0],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut'
      }
    },
    happy: {
      scale: [1, 1.1, 1],
      transition: {
        duration: 0.5
      }
    },
    thinking: {
      rotate: [0, -5, 5, -5, 0],
      transition: {
        duration: 1.5,
        repeat: Infinity
      }
    },
    excited: {
      scale: [1, 1.2, 1],
      rotate: [0, -10, 10, -10, 0],
      transition: {
        duration: 0.8
      }
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        mb: 3
      }}
    >
      <motion.div
        animate={avatarAnimations[mood]}
      >
        <Avatar
          sx={{
            width: 60,
            height: 60,
            fontSize: '2rem',
            bgcolor: 'primary.light',
            border: 3,
            borderColor: 'primary.main'
          }}
        >
          {avatarExpressions[mood]}
        </Avatar>
      </motion.div>
      
      <AnimatePresence mode='wait'>
        <motion.div
          key={message}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.3 }}
        >
          <Typography
            variant="body1"
            sx={{
              bgcolor: 'background.paper',
              p: 2,
              borderRadius: 2,
              boxShadow: 1,
              maxWidth: '300px',
              position: 'relative',
              '&:before': {
                content: '""',
                position: 'absolute',
                left: -10,
                top: '50%',
                transform: 'translateY(-50%)',
                borderWidth: 5,
                borderStyle: 'solid',
                borderColor: 'transparent #fff transparent transparent'
              }
            }}
          >
            {message}
          </Typography>
        </motion.div>
      </AnimatePresence>
    </Box>
  );
};

export default HistoricalAvatar;