import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

class QuizService {
  constructor() {
    this.userId = localStorage.getItem('userId') || this.generateUserId();
    localStorage.setItem('userId', this.userId);
  }

  generateUserId() {
    return 'user_' + Math.random().toString(36).substr(2, 9);
  }

  async getQuestion(difficulty, retryCount = 0) {
    try {
      const response = await axios.post(`${API_BASE_URL}/question`, {
        difficulty,
        userId: this.userId
      });
      if (!response.data || !response.data.text || !response.data.options) {
        throw new Error('Invalid question data received');
      }
      return response.data;
    } catch (error) {
      console.error('Error fetching question:', error);
      if (retryCount < 3) {
        // Wait for 1 second before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.getQuestion(difficulty, retryCount + 1);
      }
      throw new Error('Failed to load question after multiple attempts');
    }
  }

  async submitAnswer(difficulty, isCorrect, quizComplete = false) {
    try {
      const response = await axios.post(`${API_BASE_URL}/answer`, {
        userId: this.userId,
        difficulty,
        isCorrect,
        quizComplete
      });
      return response.data;
    } catch (error) {
      console.error('Error submitting answer:', error);
      throw error;
    }
  }
}

export default new QuizService();