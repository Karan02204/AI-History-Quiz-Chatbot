import os
import random
import json
from dotenv import load_dotenv
import requests

# Load environment variables from .env file
load_dotenv()

# Get API key from environment variables
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
HUGGINGFACE_API_KEY = os.getenv('HUGGINGFACE_API_KEY')

# Define the base prompt for generating historical questions
BASE_PROMPT = """
Generate a historical question with the following format:
- Question text should be clear and focused on historical facts
- Provide 4 possible answer options (A, B, C, D)
- Clearly mark the correct answer
- Include a brief explanation of why the correct answer is right
- The question should be at {difficulty} difficulty level

Question topic: {era} history
"""

# Historical eras for question generation
HISTORICAL_ERAS = {
    'easy': ['Ancient Egypt', 'Ancient Rome', 'Ancient Greece', 'Medieval Europe', 'Renaissance'],
    'medium': ['Industrial Revolution', 'American Revolution', 'French Revolution', 'Colonial Era', 'World War I'],
    'hard': ['World War II', 'Cold War', 'Ancient Mesopotamia', 'Byzantine Empire', 'Chinese Dynasties']
}

class AIQuestionGenerator:
    """Class to handle AI-generated historical questions"""
    
    def __init__(self, api_type='openai'):
        """Initialize the question generator with the specified API type"""
        self.api_type = api_type
        
        # Validate API keys
        if api_type == 'openai' and not OPENAI_API_KEY:
            raise ValueError("OpenAI API key is missing. Please add it to your .env file.")
        elif api_type == 'huggingface' and not HUGGINGFACE_API_KEY:
            raise ValueError("HuggingFace API key is missing. Please add it to your .env file.")
    
    def generate_question(self, difficulty='medium'):
        """Generate a historical question using AI"""
        # Select a random era appropriate for the difficulty level
        era = random.choice(HISTORICAL_ERAS.get(difficulty, HISTORICAL_ERAS['medium']))
        
        # Create the prompt for the AI
        prompt = BASE_PROMPT.format(difficulty=difficulty, era=era)
        
        # Generate the question using the OpenAI API only
        try:
            if self.api_type != 'openai':
                return self._generate_with_openai(prompt)
            
        # Generate the question using OpenAI API
        except Exception as e:
            print(f"Error generating question with OpenAI API: {str(e)}")
            print("Falling back to HuggingFace API...")
        return self._generate_with_huggingface(prompt)
    
    def _generate_with_openai(self, prompt):
        """Generate a question using OpenAI's API"""
        headers = {
            'Authorization': f'Bearer {OPENAI_API_KEY}',
            'Content-Type': 'application/json'
        }
        
        data = {
            'model': 'gpt-3.5-turbo',
            'messages': [
                {'role': 'system', 'content': 'You are a history professor creating quiz questions.'},
                {'role': 'user', 'content': prompt}
            ],
            'temperature': 0.7,
            'max_tokens': 500
        }
        
        response = requests.post(
            'https://api.openai.com/v1/chat/completions',
            headers=headers,
            json=data
        )
        
        if response.status_code != 200:
            raise Exception(f"OpenAI API error: {response.text}")
        
        # Parse the response
        ai_response = response.json()['choices'][0]['message']['content']
        return self._parse_ai_response(ai_response)
    
    def _generate_with_huggingface(self, prompt):
        """Generate a question using HuggingFace's API"""
        headers = {
            'Authorization': f'Bearer {HUGGINGFACE_API_KEY}',
            'Content-Type': 'application/json'
        }
        
        data = {
            'inputs': prompt,
            'parameters': {
                'max_new_tokens': 500,
                'temperature': 0.7,
                'return_full_text': False
            }
        }
        
        # Using a general text generation model from HuggingFace
        response = requests.post(
            'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2',
            headers=headers,
            json=data
        )
        
        if response.status_code != 200:
            raise Exception(f"HuggingFace API error: {response.text}")
        
        # Parse the response
        ai_response = response.json()[0]['generated_text']
        return self._parse_ai_response(ai_response)
    
    def _parse_ai_response(self, ai_response):
        """Parse the AI response into the expected question format"""
        try:
            # Extract question text
            question_text = ai_response.split('\n')[0].strip()
            if not question_text or question_text.startswith('Question:'):
                question_text = ai_response.split('\n')[1].strip()
            
            # Extract options
            options = []
            for line in ai_response.split('\n'):
                if line.strip().startswith(('A)', 'B)', 'C)', 'D)', 'A.', 'B.', 'C.', 'D.')):
                    option = line.strip()[2:].strip()
                    options.append(option)
            
            # Extract correct answer
            correct_answer = None
            for line in ai_response.split('\n'):
                if 'correct answer' in line.lower() or 'answer:' in line.lower():
                    if 'A' in line or 'option A' in line.lower():
                        correct_answer = options[0] if len(options) > 0 else None
                    elif 'B' in line or 'option B' in line.lower():
                        correct_answer = options[1] if len(options) > 1 else None
                    elif 'C' in line or 'option C' in line.lower():
                        correct_answer = options[2] if len(options) > 2 else None
                    elif 'D' in line or 'option D' in line.lower():
                        correct_answer = options[3] if len(options) > 3 else None
            
            # Extract explanation
            explanation = ""
            explanation_started = False
            for line in ai_response.split('\n'):
                if 'explanation' in line.lower() or 'reason' in line.lower():
                    explanation_started = True
                    explanation = line.split(':', 1)[1].strip() if ':' in line else line
                elif explanation_started and line.strip():
                    explanation += " " + line.strip()
            
            # Validate the parsed data
            if not question_text or len(options) < 2 or not correct_answer or not explanation:
                raise ValueError("Failed to parse AI response correctly")
            
            return {
                'text': question_text,
                'options': options,
                'correctAnswer': correct_answer,
                'explanation': explanation
            }
        except Exception as e:
            print(f"Error parsing AI response: {str(e)}")
            print(f"AI response: {ai_response}")
            raise ValueError("Failed to parse AI response")
    
    # Removed fallback question generation method as we're exclusively using OpenAI API

# Create a singleton instance
ai_question_generator = AIQuestionGenerator(api_type='openai')