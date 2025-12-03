import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Quiz from '../models/Quiz.js';
import Flashcard from '../models/Flashcard.js';
import User from '../models/User.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/codetutor';

async function seedQuizzesAndFlashcards() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Find or create a default admin user for quizzes
    let adminUser = await User.findOne({ username: 'admin' });
    if (!adminUser) {
      // Try to find any existing user
      adminUser = await User.findOne();
      if (!adminUser) {
        console.log('⚠️  No users found. Creating a default admin user...');
        adminUser = await User.create({
          username: 'admin',
          s0Key: 'SO0000001',
          fullName: 'System Admin',
          email: 'admin@semo.edu',
          isActive: true
        });
        console.log('✅ Created default admin user');
      }
    }

    const creatorId = adminUser._id;

    // Drop existing text indexes to avoid conflicts
    try {
      await Quiz.collection.dropIndexes();
      await Flashcard.collection.dropIndexes();
      console.log('✅ Dropped existing indexes');
    } catch (err) {
      console.log('ℹ️  No indexes to drop or error dropping indexes:', err.message);
    }

    // Clear existing quizzes and flashcards (optional - comment out if you want to keep existing)
    const existingQuizzes = await Quiz.countDocuments();
    const existingFlashcards = await Flashcard.countDocuments();
    console.log(`📊 Found ${existingQuizzes} existing quizzes and ${existingFlashcards} existing flashcards`);

    // Sample Quizzes
    const quizzes = [
      {
        title: 'Python Basics - Variables and Data Types',
        description: 'Test your understanding of Python variables and basic data types',
        language: 'python',
        difficulty: 'beginner',
        questions: [
          {
            question: 'What is a variable in Python?',
            type: 'multiple-choice',
            options: [
              'A container that stores data values',
              'A function that performs calculations',
              'A loop that repeats code',
              'A conditional statement'
            ],
            correctAnswer: 0,
            explanation: 'A variable is a container that stores data values. You can think of it as a labeled box where you put information.',
            points: 1
          },
          {
            question: 'Which of the following is a valid variable name in Python?',
            type: 'multiple-choice',
            options: [
              '2my_variable',
              'my-variable',
              'my_variable',
              'my variable'
            ],
            correctAnswer: 2,
            explanation: 'Variable names in Python can contain letters, numbers, and underscores, but cannot start with a number or contain spaces or hyphens.',
            points: 1
          },
          {
            question: 'What data type is the value 3.14?',
            type: 'multiple-choice',
            options: [
              'int',
              'float',
              'string',
              'boolean'
            ],
            correctAnswer: 1,
            explanation: '3.14 is a float (floating-point number) because it contains a decimal point.',
            points: 1
          },
          {
            question: 'In Python, strings are immutable.',
            type: 'true-false',
            options: [],
            correctAnswer: true,
            explanation: 'Strings in Python are immutable, meaning once created, they cannot be changed. You must create a new string to modify it.',
            points: 1
          },
          {
            question: 'What will print(5 + "5") output?',
            type: 'multiple-choice',
            options: [
              '10',
              '55',
              'TypeError',
              'None'
            ],
            correctAnswer: 2,
            explanation: 'You cannot add an integer and a string directly in Python. This will raise a TypeError. You need to convert one type to match the other.',
            points: 2
          }
        ],
        createdBy: creatorId,
        isPublic: true,
        tags: ['python', 'variables', 'data-types', 'basics']
      },
      {
        title: 'Python Control Flow - If Statements and Loops',
        description: 'Master if statements, for loops, and while loops in Python',
        language: 'python',
        difficulty: 'beginner',
        questions: [
          {
            question: 'What keyword is used to start an if statement in Python?',
            type: 'multiple-choice',
            options: [
              'if',
              'when',
              'check',
              'condition'
            ],
            correctAnswer: 0,
            explanation: 'The "if" keyword is used to start conditional statements in Python.',
            points: 1
          },
          {
            question: 'How many times will this loop execute: for i in range(5):',
            type: 'multiple-choice',
            options: [
              '4 times',
              '5 times',
              '6 times',
              'Infinite'
            ],
            correctAnswer: 1,
            explanation: 'range(5) generates numbers from 0 to 4 (5 numbers total), so the loop executes 5 times.',
            points: 1
          },
          {
            question: 'What is the output of: print("Hello" if True else "World")',
            type: 'short-answer',
            options: [],
            correctAnswer: 'Hello',
            explanation: 'Since the condition is True, the ternary operator returns "Hello".',
            points: 2
          },
          {
            question: 'A while loop will continue as long as its condition is True.',
            type: 'true-false',
            options: [],
            correctAnswer: true,
            explanation: 'A while loop continues executing as long as its condition evaluates to True. When it becomes False, the loop stops.',
            points: 1
          },
          {
            question: 'What does the "break" keyword do in a loop?',
            type: 'multiple-choice',
            options: [
              'Skips the current iteration',
              'Exits the loop immediately',
              'Continues to the next iteration',
              'Restarts the loop'
            ],
            correctAnswer: 1,
            explanation: 'The "break" keyword immediately exits the loop, regardless of the loop condition.',
            points: 1
          }
        ],
        createdBy: creatorId,
        isPublic: true,
        tags: ['python', 'control-flow', 'if-statements', 'loops']
      },
      {
        title: 'Python Functions - Basics',
        description: 'Learn about defining and calling functions in Python',
        language: 'python',
        difficulty: 'beginner',
        questions: [
          {
            question: 'What keyword is used to define a function in Python?',
            type: 'multiple-choice',
            options: [
              'function',
              'def',
              'func',
              'define'
            ],
            correctAnswer: 1,
            explanation: 'The "def" keyword is used to define a function in Python.',
            points: 1
          },
          {
            question: 'What will this function return: def add(a, b): return a + b',
            type: 'multiple-choice',
            options: [
              'Nothing',
              'The sum of a and b',
              'An error',
              'a and b separately'
            ],
            correctAnswer: 1,
            explanation: 'The function returns the sum of parameters a and b using the return statement.',
            points: 1
          },
          {
            question: 'Functions in Python must always return a value.',
            type: 'true-false',
            options: [],
            correctAnswer: false,
            explanation: 'Functions in Python do not need to return a value. If no return statement is used, the function returns None.',
            points: 1
          },
          {
            question: 'What is a parameter in a function?',
            type: 'multiple-choice',
            options: [
              'The value passed to the function',
              'The variable in the function definition',
              'The return value',
              'The function name'
            ],
            correctAnswer: 1,
            explanation: 'A parameter is the variable listed in the function definition. The value passed to it is called an argument.',
            points: 2
          }
        ],
        createdBy: creatorId,
        isPublic: true,
        tags: ['python', 'functions', 'basics']
      },
      {
        title: 'JavaScript Basics - Variables and Types',
        description: 'Test your knowledge of JavaScript variables and data types',
        language: 'javascript',
        difficulty: 'beginner',
        questions: [
          {
            question: 'Which keyword is used to declare a variable that cannot be reassigned?',
            type: 'multiple-choice',
            options: [
              'var',
              'let',
              'const',
              'static'
            ],
            correctAnswer: 2,
            explanation: 'The "const" keyword declares a constant variable that cannot be reassigned after initialization.',
            points: 1
          },
          {
            question: 'What is the difference between == and === in JavaScript?',
            type: 'multiple-choice',
            options: [
              'No difference',
              '== compares values, === compares values and types',
              '=== is faster',
              '== is newer syntax'
            ],
            correctAnswer: 1,
            explanation: '== performs type coercion and compares values, while === compares both value and type without coercion.',
            points: 2
          },
          {
            question: 'JavaScript is a statically typed language.',
            type: 'true-false',
            options: [],
            correctAnswer: false,
            explanation: 'JavaScript is dynamically typed, meaning variable types are determined at runtime, not at compile time.',
            points: 1
          },
          {
            question: 'What will typeof null return?',
            type: 'multiple-choice',
            options: [
              '"null"',
              '"object"',
              '"undefined"',
              'null'
            ],
            correctAnswer: 1,
            explanation: 'This is a known quirk in JavaScript - typeof null returns "object" due to a historical bug.',
            points: 2
          }
        ],
        createdBy: creatorId,
        isPublic: true,
        tags: ['javascript', 'variables', 'types', 'basics']
      }
    ];

    // Sample Flashcards
    const flashcards = [
      // Python Basics
      {
        front: 'What is a variable?',
        back: 'A variable is a container that stores data values. Think of it as a labeled box where you put information. In Python: x = 5 means you put 5 into box x.',
        language: 'python',
        difficulty: 'beginner',
        createdBy: creatorId,
        isPublic: true,
        tags: ['python', 'variables', 'basics']
      },
      {
        front: 'What is a loop?',
        back: 'A loop is like checking each item on your grocery list one by one. Code repeats until done. Types: for loops (repeat a set number of times) and while loops (repeat while condition is true).',
        language: 'python',
        difficulty: 'beginner',
        createdBy: creatorId,
        isPublic: true,
        tags: ['python', 'loops', 'control-flow']
      },
      {
        front: 'What is a function?',
        back: 'A function is like a vending machine: you give input (parameters), it performs work, and you get output (return value). Functions help organize code and avoid repetition.',
        language: 'python',
        difficulty: 'beginner',
        createdBy: creatorId,
        isPublic: true,
        tags: ['python', 'functions', 'basics']
      },
      {
        front: 'What is a list in Python?',
        back: 'A list is like a shopping cart - it can hold multiple items in order. Lists are ordered, changeable, and allow duplicate values. Example: my_list = [1, 2, 3]',
        language: 'python',
        difficulty: 'beginner',
        createdBy: creatorId,
        isPublic: true,
        tags: ['python', 'lists', 'data-structures']
      },
      {
        front: 'What is a dictionary in Python?',
        back: 'A dictionary is like a real dictionary: look up a word (key) to get a meaning (value). Example: student = {"name": "John", "age": 20}',
        language: 'python',
        difficulty: 'beginner',
        createdBy: creatorId,
        isPublic: true,
        tags: ['python', 'dictionaries', 'data-structures']
      },
      {
        front: 'What is an if statement?',
        back: 'An if statement is like a decision point: "If it\'s raining, bring an umbrella." It allows code to execute only when a condition is true.',
        language: 'python',
        difficulty: 'beginner',
        createdBy: creatorId,
        isPublic: true,
        tags: ['python', 'if-statements', 'control-flow']
      },
      {
        front: 'What is a string?',
        back: 'A string is text data, like a sentence. In Python, strings are enclosed in quotes: "Hello" or \'World\'. Strings are immutable (cannot be changed once created).',
        language: 'python',
        difficulty: 'beginner',
        createdBy: creatorId,
        isPublic: true,
        tags: ['python', 'strings', 'data-types']
      },
      {
        front: 'What is an integer?',
        back: 'An integer is a whole number (no decimals). Examples: 5, -10, 0, 100. In Python, integers can be as large as memory allows.',
        language: 'python',
        difficulty: 'beginner',
        createdBy: creatorId,
        isPublic: true,
        tags: ['python', 'integers', 'data-types']
      },
      {
        front: 'What is a float?',
        back: 'A float is a number with decimals. Examples: 3.14, -0.5, 2.0. The name comes from "floating point" - the decimal point can "float" to different positions.',
        language: 'python',
        difficulty: 'beginner',
        createdBy: creatorId,
        isPublic: true,
        tags: ['python', 'floats', 'data-types']
      },
      {
        front: 'What is a boolean?',
        back: 'A boolean has only two values: True or False. It\'s like a light switch - either on (True) or off (False). Used in conditions and comparisons.',
        language: 'python',
        difficulty: 'beginner',
        createdBy: creatorId,
        isPublic: true,
        tags: ['python', 'booleans', 'data-types']
      },
      // JavaScript Basics
      {
        front: 'What is the difference between let, const, and var in JavaScript?',
        back: 'var: function-scoped, can be redeclared. let: block-scoped, can be reassigned. const: block-scoped, cannot be reassigned. Use const by default, let when you need to reassign, avoid var.',
        language: 'javascript',
        difficulty: 'beginner',
        createdBy: creatorId,
        isPublic: true,
        tags: ['javascript', 'variables', 'scope']
      },
      {
        front: 'What is an array in JavaScript?',
        back: 'An array is like a row of lockers - each has a fixed position (index) and holds one item. Arrays are ordered lists of values. Example: let fruits = ["apple", "banana", "orange"]',
        language: 'javascript',
        difficulty: 'beginner',
        createdBy: creatorId,
        isPublic: true,
        tags: ['javascript', 'arrays', 'data-structures']
      },
      {
        front: 'What is an object in JavaScript?',
        back: 'An object is like a filing cabinet with labeled drawers. It stores key-value pairs. Example: let person = {name: "John", age: 30}. Access with person.name or person["name"]',
        language: 'javascript',
        difficulty: 'beginner',
        createdBy: creatorId,
        isPublic: true,
        tags: ['javascript', 'objects', 'data-structures']
      },
      {
        front: 'What is a callback function?',
        back: 'A callback is like leaving your number so someone calls when they finish a task. It\'s a function passed as an argument to another function, executed later.',
        language: 'javascript',
        difficulty: 'beginner',
        createdBy: creatorId,
        isPublic: true,
        tags: ['javascript', 'functions', 'callbacks']
      },
      {
        front: 'What is a promise in JavaScript?',
        back: 'A promise is like ordering food delivery - you wait for it to complete later. It represents a value that may be available now, later, or never. Use .then() or async/await.',
        language: 'javascript',
        difficulty: 'beginner',
        createdBy: creatorId,
        isPublic: true,
        tags: ['javascript', 'promises', 'async']
      },
      // General Programming Concepts
      {
        front: 'What is OOP (Object-Oriented Programming)?',
        back: 'OOP is like organizing code into blueprints (classes) that create objects. Key concepts: Encapsulation (data hiding), Inheritance (child classes get parent traits), Polymorphism (same interface, different behavior).',
        language: 'general',
        difficulty: 'intermediate',
        createdBy: creatorId,
        isPublic: true,
        tags: ['oop', 'programming-concepts', 'general']
      },
      {
        front: 'What is a class?',
        back: 'A class is a blueprint for creating objects - like a cookie cutter that makes cookies. It defines properties (attributes) and methods (functions) that objects will have.',
        language: 'general',
        difficulty: 'beginner',
        createdBy: creatorId,
        isPublic: true,
        tags: ['classes', 'oop', 'programming-concepts']
      },
      {
        front: 'What is inheritance?',
        back: 'Inheritance is like a child inheriting traits from parents. A class (child) gets properties and methods from another class (parent), allowing code reuse and organization.',
        language: 'general',
        difficulty: 'beginner',
        createdBy: creatorId,
        isPublic: true,
        tags: ['inheritance', 'oop', 'programming-concepts']
      },
      {
        front: 'What is an API?',
        back: 'An API (Application Programming Interface) is like a waiter: it takes your request to the kitchen (server) and brings food (data) back. It\'s a way for programs to communicate.',
        language: 'general',
        difficulty: 'beginner',
        createdBy: creatorId,
        isPublic: true,
        tags: ['api', 'web-development', 'general']
      },
      {
        front: 'What is a database?',
        back: 'A database is like a digital filing cabinet that stores and organizes information. It allows you to save, retrieve, update, and delete data efficiently. Common types: SQL (structured) and NoSQL (flexible).',
        language: 'general',
        difficulty: 'beginner',
        createdBy: creatorId,
        isPublic: true,
        tags: ['databases', 'data-storage', 'general']
      },
      {
        front: 'What is Git?',
        back: 'Git is like a time machine for your code. It tracks changes, lets you go back to previous versions, and collaborate with others. A commit is like taking a snapshot of your project.',
        language: 'general',
        difficulty: 'beginner',
        createdBy: creatorId,
        isPublic: true,
        tags: ['git', 'version-control', 'general']
      },
      {
        front: 'What is debugging?',
        back: 'Debugging is like being a detective - finding and fixing errors (bugs) in your code. Use print statements, debuggers, and read error messages carefully to find the problem.',
        language: 'general',
        difficulty: 'beginner',
        createdBy: creatorId,
        isPublic: true,
        tags: ['debugging', 'programming-concepts', 'general']
      }
    ];

    // Insert quizzes
    console.log('\n📝 Creating quizzes...');
    const createdQuizzes = await Quiz.insertMany(quizzes);
    console.log(`✅ Created ${createdQuizzes.length} quizzes`);

    // Insert flashcards
    console.log('\n🎴 Creating flashcards...');
    const createdFlashcards = await Flashcard.insertMany(flashcards);
    console.log(`✅ Created ${createdFlashcards.length} flashcards`);

    console.log('\n🎉 Seeding completed successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`   - Quizzes: ${createdQuizzes.length}`);
    console.log(`   - Flashcards: ${createdFlashcards.length}`);
    console.log(`\n✨ Your quizzes and flashcards are now available in the app!`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedQuizzesAndFlashcards();

