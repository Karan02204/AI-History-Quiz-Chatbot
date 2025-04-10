import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Container, Box, Typography, LinearProgress, Select, MenuItem, FormControl, InputLabel, Button } from '@mui/material';
import { motion } from 'framer-motion';
import ChatInterface from './components/ChatInterface';
import HistoricalAvatar from './components/HistoricalAvatar';
import QuizService from './services/QuizService';

const theme = createTheme({
  palette: {
    primary: {
      main: '#8B4513',
      light: '#A0522D',
      dark: '#654321',
    },
    secondary: {
      main: '#DAA520',
      light: '#FFD700',
      dark: '#B8860B',
    },
    background: {
      default: '#FFF8DC',
      paper: '#FAEBD7',
    },
  },
  typography: {
    fontFamily: '"Crimson Text", "Times New Roman", serif',
    h1: {
      fontFamily: '"Playfair Display", serif',
    },
    h2: {
      fontFamily: '"Playfair Display", serif',
    },
  },
});

function App() {
  const [score, setScore] = useState(0);
  const [difficulty, setDifficulty] = useState('medium');
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [avatarMood, setAvatarMood] = useState('neutral');
  const [avatarMessage, setAvatarMessage] = useState('Welcome to Historical Quest! Ready to test your knowledge?');
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [targetQuestions, setTargetQuestions] = useState(5);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);

  const fetchNewQuestion = async () => {
    try {
      setIsLoading(true);
      setAvatarMood('thinking');
      setAvatarMessage('Fetching your next question...');
      const question = await QuizService.getQuestion(difficulty);
      setCurrentQuestion(question);
      setAvatarMessage(`Here's a question about ${question.text.split(' ').slice(0, 3).join(' ')}...`);
    } catch (error) {
      console.error('Error fetching question:', error);
      setAvatarMood('sad');
      setAvatarMessage('Having trouble connecting to the server. The question will load automatically when connection is restored.');
      // Retry after 3 seconds
      setTimeout(fetchNewQuestion, 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const startQuiz = () => {
    setQuizStarted(true);
    setQuestionsAnswered(0);
    setScore(0);
    setQuizComplete(false);
    fetchNewQuestion();
  };

  const handleAnswer = async (isCorrect) => {
    try {
      const newQuestionsAnswered = questionsAnswered + 1;
      const isQuizComplete = newQuestionsAnswered >= targetQuestions;
      const result = await QuizService.submitAnswer(difficulty, isCorrect, isQuizComplete);
      setScore(result.score);
      setTotalQuestions(result.totalQuestions);
      setQuestionsAnswered(newQuestionsAnswered);
      
      if (isQuizComplete) {
        setQuizComplete(true);
        setAvatarMood('happy');
        setAvatarMessage('Congratulations! You\'ve completed the quiz!');
        setQuizStarted(false);
      }
      
      if (result.newDifficulty !== difficulty) {
        setDifficulty(result.newDifficulty);
        setAvatarMood('excited');
        setAvatarMessage(`Impressive! Let's try some ${result.newDifficulty} questions!`);
      } else {
        setAvatarMood(isCorrect ? 'happy' : 'neutral');
        setAvatarMessage(isCorrect ? 'Well done! Keep it up!' : 'Don\'t worry, learning from mistakes is part of the journey!');
      }

      if (!isQuizComplete) {
        setTimeout(fetchNewQuestion, 2000);
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="md">
        {!quizStarted && !quizComplete && (
          <Box sx={{ mb: 3, mt: 3 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="question-count-label">Number of Questions</InputLabel>
              <Select
                labelId="question-count-label"
                value={targetQuestions}
                label="Number of Questions"
                onChange={(e) => setTargetQuestions(e.target.value)}
              >
                <MenuItem value={5}>5 Questions</MenuItem>
                <MenuItem value={10}>10 Questions</MenuItem>
                <MenuItem value={15}>15 Questions</MenuItem>
                <MenuItem value={20}>20 Questions</MenuItem>
              </Select>
            </FormControl>
            <Button 
              variant="contained" 
              color="primary" 
              fullWidth 
              onClick={startQuiz}
              sx={{ py: 1.5 }}
            >
              Start Quiz
            </Button>
          </Box>
        )}
        {/* Quiz completion UI is now handled in a single location below */}
        <Box
          component={motion.div}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          sx={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            padding: 3,
            backgroundColor: 'background.paper',
            borderRadius: 2,
            boxShadow: 3,
            margin: '2rem auto',
          }}
        >
          <Typography
            variant="h1"
            sx={{
              fontSize: '2.5rem',
              textAlign: 'center',
              color: 'primary.main',
              mb: 3,
              fontWeight: 'bold',
              textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            Historical Quest
          </Typography>

          {quizStarted && !quizComplete && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Progress: {Math.round((questionsAnswered / targetQuestions) * 100)}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={(questionsAnswered / targetQuestions) * 100}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: 'rgba(218,165,32,0.2)',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: 'secondary.main',
                  }
                }}
              />
            </Box>
          )}

          <HistoricalAvatar mood={avatarMood} message={avatarMessage} />

          {quizStarted ? (
            isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <LinearProgress sx={{ width: '50%' }} />
              </Box>
            ) : (
              <ChatInterface
                onAnswer={handleAnswer}
                currentQuestion={currentQuestion}
                questionsAnswered={questionsAnswered}
                targetQuestions={targetQuestions}
                quizComplete={quizComplete}
                score={score}
                difficulty={difficulty}
              />
            )
          ) : quizComplete ? (
            <Box sx={{ textAlign: 'center', my: 4 }}>
              <Typography variant="h4" color="primary" gutterBottom>
                Quiz Complete!
              </Typography>
              <Typography variant="h5" gutterBottom>
                Final Score: {score}/{questionsAnswered}
              </Typography>
              <Box sx={{ mt: 3 }}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel id="question-count-label">Number of Questions</InputLabel>
                  <Select
                    labelId="question-count-label"
                    value={targetQuestions}
                    label="Number of Questions"
                    onChange={(e) => setTargetQuestions(e.target.value)}
                  >
                    <MenuItem value={5}>5 Questions</MenuItem>
                    <MenuItem value={10}>10 Questions</MenuItem>
                    <MenuItem value={15}>15 Questions</MenuItem>
                    <MenuItem value={20}>20 Questions</MenuItem>
                  </Select>
                </FormControl>
                <Button 
                  variant="contained" 
                  color="primary" 
                  fullWidth 
                  onClick={startQuiz}
                  sx={{ py: 1.5 }}
                >
                  Start New Quiz
                </Button>
              </Box>
            </Box>
          ) : null}
          
          {/* Credits Footer */}
          <Box 
            sx={{ 
              mt: 'auto', 
              pt: 3, 
              borderTop: '1px solid', 
              borderColor: 'primary.light',
              opacity: 0.9,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', mb: 1 }}>
              Developed by:
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="primary.dark" sx={{ fontWeight: 'bold' }}>
                  Karan Attri
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Reg. No: 12309068
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="primary.dark" sx={{ fontWeight: 'bold' }}>
                  Archita Dubey
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Reg. No: 12324628
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="primary.dark" sx={{ fontWeight: 'bold' }}>
                  Kartavya Srivastav
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Reg. No: 12323198
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default App;