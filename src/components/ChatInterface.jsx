import React, { useState, useRef, useEffect } from 'react';
import { Box, Paper, Typography, Button, CircularProgress } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';

const ChatInterface = ({ onAnswer, score, difficulty, currentQuestion, questionsAnswered, targetQuestions, quizComplete }) => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleAnswer = (answer) => {
    const isCorrect = answer === currentQuestion.correctAnswer;
    setMessages(prev => [...prev, {
      type: 'answer',
      content: answer,
      isCorrect
    }]);
    
    if (isCorrect) {
      setMessages(prev => [...prev, {
        type: 'feedback',
        content: `Correct! ${currentQuestion.explanation}`
      }]);
    } else {
      setMessages(prev => [...prev, {
        type: 'feedback',
        content: `Not quite. ${currentQuestion.explanation}`
      }]);
    }

    onAnswer(isCorrect);
  };

  const MessageBubble = ({ message, index }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Paper
        elevation={2}
        sx={{
          p: 2,
          my: 1,
          maxWidth: '80%',
          ml: message.type === 'answer' ? 'auto' : 2,
          mr: message.type === 'answer' ? 2 : 'auto',
          backgroundColor: message.type === 'answer' 
            ? (message.isCorrect ? '#c8e6c9' : '#ffcdd2')
            : '#fff',
          borderRadius: 2
        }}
      >
        <Typography variant="body1">{message.content}</Typography>
      </Paper>
    </motion.div>
  );

  const QuestionDisplay = ({ question }) => (
    <Box sx={{ my: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>{question.text}</Typography>
      <Box sx={{ display: 'grid', gap: 1 }}>
        {question.options.map((option, index) => (
          <Button
            key={index}
            variant="outlined"
            onClick={() => handleAnswer(option)}
            sx={{
              justifyContent: 'flex-start',
              textTransform: 'none',
              p: 1.5,
              '&:hover': {
                backgroundColor: 'rgba(139, 69, 19, 0.1)'
              }
            }}
          >
            {option}
          </Button>
        ))}
      </Box>
    </Box>
  );

  return (
    <Box
      sx={{
        height: '70vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
        borderRadius: 2,
        p: 2,
        overflow: 'hidden'
      }}
    >
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          mb: 2,
          '&::-webkit-scrollbar': {
            width: '8px'
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'rgba(0,0,0,0.1)',
            borderRadius: '4px'
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'primary.main',
            borderRadius: '4px'
          }
        }}
      >
        <AnimatePresence>
          {messages.map((message, index) => (
            <MessageBubble key={index} message={message} index={index} />
          ))}
        </AnimatePresence>
        {currentQuestion && !quizComplete && <QuestionDisplay question={currentQuestion} />}
        {quizComplete && (
          <Box sx={{ textAlign: 'center', my: 4 }}>
            <Typography variant="h6" color="primary.dark">
              No more questions. Quiz completed!
            </Typography>
          </Box>
        )}
        <div ref={chatEndRef} />
      </Box>
    </Box>
  );
};

export default ChatInterface;