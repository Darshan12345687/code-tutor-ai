import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Quiz from '../models/Quiz.js';
import Flashcard from '../models/Flashcard.js';
import Appointment from '../models/Appointment.js';
import Message from '../models/Message.js';

dotenv.config();

const sampleQuestions = [
  {
    question: "What is a variable in Python?",
    code: null,
    language: "python",
    expectedResponse: "A variable is like a labeled box where you store something. In Python: x = 5 means you put 5 into box x."
  },
  {
    question: "Explain loops in programming",
    code: null,
    language: "python",
    expectedResponse: "A loop is like checking each item on your grocery list one by one. Code repeats until done."
  },
  {
    question: "What is object-oriented programming?",
    code: null,
    language: "python",
    expectedResponse: "OOP is like a blueprint for building houses. A class is the blueprint, objects are the actual houses built from it."
  },
  {
    question: "How do I debug errors?",
    code: null,
    language: "python",
    expectedResponse: "Debugging is like being a detective. Read the error message, check the line number, and trace back to find the problem."
  },
  {
    question: "Explain recursion",
    code: null,
    language: "python",
    expectedResponse: "Recursion is like Russian dolls - a function that calls itself. It breaks big problems into smaller identical problems."
  },
  {
    question: "What are data structures?",
    code: null,
    language: "python",
    expectedResponse: "Data structures are like different containers. Lists are like shopping carts, dictionaries are like phone books with names and numbers."
  }
];

const sampleCodeExamples = [
  {
    code: `def greet(name):
    print(f"Hello, {name}!")

greet("World")`,
    language: "python",
    expectedExplanation: "This function takes a name and prints a greeting. It's like a template that personalizes messages."
  },
  {
    code: `numbers = [1, 2, 3, 4, 5]
total = sum(numbers)
print(total)`,
    language: "python",
    expectedExplanation: "This creates a list of numbers and calculates their sum. Think of it like adding up items on a receipt."
  },
  {
    code: `class Dog:
    def __init__(self, name):
        self.name = name
    
    def bark(self):
        print(f"{self.name} says woof!")

my_dog = Dog("Buddy")
my_dog.bark()`,
    language: "python",
    expectedExplanation: "This creates a Dog class with a name and bark method. It's like a template for creating dog objects."
  }
];

async function addSampleData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/codetutor');
    console.log('✅ Connected to MongoDB');

    // Find or create a test student
    let student = await User.findOne({ s0Key: 'SO1234567' });
    if (!student) {
      student = await User.create({
        s0Key: 'SO1234567',
        email: 'test@semo.edu',
        fullName: 'Test Student',
        role: 'student',
        isActive: true
      });
      console.log('✅ Created test student');
    }

    // Find or create a test tutor
    let tutor = await User.findOne({ role: 'tutor' });
    if (!tutor) {
      tutor = await User.create({
        email: 'tutor@semo.edu',
        fullName: 'Test Tutor',
        role: 'tutor',
        tutorAccessCode: 'TUTOR2024',
        isActive: true
      });
      console.log('✅ Created test tutor');
    }

    // Add sample quizzes if none exist
    const quizCount = await Quiz.countDocuments();
    if (quizCount === 0) {
      await Quiz.insertMany([
        {
          title: 'Python Basics Quiz',
          description: 'Test your Python fundamentals',
          language: 'python',
          difficulty: 'beginner',
          questions: [
            {
              type: 'multiple-choice',
              question: 'What is a variable?',
              options: ['A storage container', 'A function', 'A loop', 'A class'],
              correctAnswer: 0,
              points: 10
            }
          ],
          totalPoints: 10,
          isPublic: true
        }
      ]);
      console.log('✅ Added sample quizzes');
    }

    // Add sample flashcards if none exist
    const flashcardCount = await Flashcard.countDocuments();
    if (flashcardCount === 0) {
      await Flashcard.insertMany([
        {
          front: 'What is a variable?',
          back: 'A variable is like a labeled box where you store data.',
          language: 'python',
          difficulty: 'beginner',
          isPublic: true
        },
        {
          front: 'What is a loop?',
          back: 'A loop repeats code until a condition is met, like checking items on a list.',
          language: 'python',
          difficulty: 'beginner',
          isPublic: true
        }
      ]);
      console.log('✅ Added sample flashcards');
    }

    // Add sample appointment
    const appointmentCount = await Appointment.countDocuments({ student: student._id });
    if (appointmentCount === 0) {
      await Appointment.create({
        student: student._id,
        tutor: tutor._id,
        appointmentDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        duration: 30,
        subject: 'Python Basics',
        description: 'Need help understanding variables and loops',
        questions: ['What is the difference between a list and a dictionary?'],
        status: 'pending'
      });
      console.log('✅ Added sample appointment');
    }

    // Add sample messages
    const messageCount = await Message.countDocuments();
    if (messageCount === 0) {
      await Message.create({
        from: student._id,
        to: tutor._id,
        message: 'Hello, I need help with Python variables.',
        subject: 'Python Help',
        type: 'question',
        read: false
      });
      console.log('✅ Added sample messages');
    }

    console.log('\n✅ Sample data added successfully!');
    console.log('\n📊 Sample Data Summary:');
    console.log(`   - Test Student: ${student.s0Key}`);
    console.log(`   - Test Tutor: ${tutor.fullName}`);
    console.log(`   - Sample Questions: ${sampleQuestions.length}`);
    console.log(`   - Sample Code Examples: ${sampleCodeExamples.length}`);
    console.log('\n💡 Use these for testing AI responses:');
    sampleQuestions.forEach((q, i) => {
      console.log(`   ${i + 1}. "${q.question}"`);
    });

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error adding sample data:', error);
    process.exit(1);
  }
}

addSampleData();





