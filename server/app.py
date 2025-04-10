from flask import Flask, request, jsonify
from flask_cors import CORS
import random
import uuid
import json
import os
import openai
from datetime import datetime
from dotenv import load_dotenv
from ai_question_generator import ai_question_generator

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)
# Simulated user progress tracking
user_progress = {}

# No question templates - using AI generation exclusively

def generate_question(difficulty):
    """Generate a question based on difficulty level"""
    # Track user's previously seen questions to avoid repetition
    user_id = request.get_json().get('userId', 'default')
    
    # Initialize question history for this user if not exists
    if user_id not in user_progress:
        user_progress[user_id] = {
            'correct_answers': 0,
            'total_questions': 0,
            'streak': 0,
            'difficulty': difficulty,
            'question_history': [],
            'quiz_complete': False,
            'session_id': str(uuid.uuid4())
        }
    elif 'question_history' not in user_progress[user_id]:
        user_progress[user_id]['question_history'] = []
    
    # Always use AI-generated questions
    try:
        # Generate a question using the AI service
        question_data = ai_question_generator.generate_question(difficulty)
        
        # Add a placeholder to history to track that a question was asked
        template_id = f"ai_question_{uuid.uuid4()}"
        user_progress[user_id]['question_history'] = user_progress[user_id]['question_history'][-4:] + [template_id]
        
        return question_data
    except Exception as e:
        print(f"Error using AI question generator: {str(e)}")
        # Instead of falling back to templates, raise the error to be handled by the route
        raise ValueError(f"Failed to generate question: {str(e)}")
    
    # No template-based generation - we only use AI-generated questions now
    # If we've reached this point, it means the AI generation failed
    # Return a proper error response that will be handled by the route
    raise ValueError("Failed to generate question using AI. Please check your OpenAI API key and try again.")

def adjust_difficulty(user_id, current_difficulty, is_correct):
    """Adjust difficulty based on user performance"""
    # Initialize or reset progress for new quiz session
    if user_id not in user_progress:
        user_progress[user_id] = {
            'correct_answers': 0,
            'total_questions': 0,
            'streak': 0,
            'difficulty': 'medium',
            'question_history': [],
            'answered_questions': set(),  # Track unique questions answered
            'answered_questions_correct': set(),  # Track unique questions answered correctly
            'quiz_complete': False,
            'session_id': str(uuid.uuid4())
        }
    elif user_progress[user_id].get('quiz_complete', False):
        # Start a new session with reset counters
        user_progress[user_id] = {
            'correct_answers': 0,
            'total_questions': 0,
            'streak': 0,
            'answered_questions': set(),  # Track unique questions answered
            'answered_questions_correct': set(),  # Track unique questions answered correctly
            'quiz_complete': False,
            'session_id': str(uuid.uuid4())
        }
    
    progress = user_progress[user_id]
    
    # Get the current question template (the last one in question_history)
    current_question = None
    if 'question_history' in progress and progress['question_history']:
        current_question = str(progress['question_history'][-1])  # Convert to string for set storage
    
    # Only increment total questions if this is a new question
    if current_question and current_question not in progress.get('answered_questions', set()):
        progress['total_questions'] += 1
        progress['answered_questions'].add(current_question)
    elif current_question is None:
        # If for some reason we can't track the question, still increment
        progress['total_questions'] += 1
    
    # Then update score if correct
    if is_correct:
        # Always increment streak for correct answers
        progress['streak'] += 1
        
        # For correct answers, we need to ensure the score reflects the number of unique questions answered correctly
        # If this is a repeated question, we don't need to adjust the score
        # If it's a new question, increment the correct answers counter
        if current_question and current_question not in progress.get('answered_questions_correct', set()):
            progress['correct_answers'] += 1
            # Track this question as correctly answered
            if 'answered_questions_correct' not in progress:
                progress['answered_questions_correct'] = set()
            progress['answered_questions_correct'].add(current_question)
    else:
        progress['streak'] = 0
    
    # Calculate success rate
    success_rate = progress['correct_answers'] / progress['total_questions']
    
    # Adjust difficulty based on success rate and streak
    if current_difficulty == 'easy' and success_rate > 0.8 and progress['streak'] >= 3:
        return 'medium'
    elif current_difficulty == 'medium':
        if success_rate > 0.7 and progress['streak'] >= 3:
            return 'hard'
        elif success_rate < 0.3:
            return 'easy'
    elif current_difficulty == 'hard' and success_rate < 0.4:
        return 'medium'
    
    return current_difficulty

@app.route('/api/question', methods=['POST'])
def get_question():
    data = request.get_json()
    difficulty = data.get('difficulty', 'medium')
    user_id = data.get('userId', 'default')
    
    try:
        question = generate_question(difficulty)
        
        # Update the total questions count
        if user_id in user_progress:
            user_progress[user_id]['total_questions'] += 1
            
            # Initialize answered_questions set if it doesn't exist
            if 'answered_questions' not in user_progress[user_id]:
                user_progress[user_id]['answered_questions'] = set()
        
        return jsonify(question)
    except Exception as e:
        # Handle errors from question generation
        error_message = str(e)
        print(f"Error generating question: {error_message}")
        return jsonify({
            'error': True,
            'message': f"Failed to generate question: {error_message}"
        }), 500

@app.route('/api/answer', methods=['POST'])
def submit_answer():
    data = request.get_json()
    user_id = data.get('userId', 'default')
    current_difficulty = data.get('difficulty', 'medium')
    is_correct = data.get('isCorrect', False)
    quiz_complete = data.get('quizComplete', False)
    
    # Store the current score before potentially resetting it
    current_score = 0
    current_total = 0
    
    if user_id in user_progress:
        # For the final score, ensure we're counting unique questions only
        if 'answered_questions_correct' in user_progress[user_id]:
            # Get the number of unique questions answered correctly
            current_score = len(user_progress[user_id]['answered_questions_correct'])
        else:
            current_score = user_progress[user_id]['correct_answers']
            
        # Get the number of unique questions asked
        if 'answered_questions' in user_progress[user_id]:
            current_total = len(user_progress[user_id]['answered_questions'])
        else:
            current_total = user_progress[user_id]['total_questions']
    
    # Update difficulty and score
    new_difficulty = adjust_difficulty(user_id, current_difficulty, is_correct)
    
    if quiz_complete:
        # Mark the quiz as complete to reset progress on next session
        if user_id in user_progress:
            user_progress[user_id]['quiz_complete'] = True
    
    return jsonify({
        'newDifficulty': new_difficulty,
        'score': current_score,
        'totalQuestions': current_total
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)