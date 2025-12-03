import mongoose from 'mongoose';

const flashcardProgressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  flashcard: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Flashcard',
    required: true,
    index: true
  },
  // Spaced repetition algorithm fields
  easeFactor: {
    type: Number,
    default: 2.5,
    min: 1.3
  },
  interval: {
    type: Number, // days until next review
    default: 1,
    min: 0
  },
  repetitions: {
    type: Number, // number of successful reviews
    default: 0,
    min: 0
  },
  lastReviewed: {
    type: Date,
    default: Date.now
  },
  nextReview: {
    type: Date,
    default: Date.now
  },
  // Quality of last review (0-5, based on user's self-assessment)
  lastQuality: {
    type: Number,
    min: 0,
    max: 5
  },
  // Mastery tracking
  isMastered: {
    type: Boolean,
    default: false
  },
  timesReviewed: {
    type: Number,
    default: 0,
    min: 0
  },
  timesCorrect: {
    type: Number,
    default: 0,
    min: 0
  },
  timesIncorrect: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

// Compound index for user-flashcard lookups
flashcardProgressSchema.index({ user: 1, flashcard: 1 });
flashcardProgressSchema.index({ user: 1, nextReview: 1 });
flashcardProgressSchema.index({ user: 1, isMastered: 1 });

// Method to update progress based on review quality
flashcardProgressSchema.methods.updateProgress = function(quality) {
  // Quality: 0=forgot, 1=hard, 2=medium, 3=good, 4=easy, 5=very easy
  this.lastQuality = quality;
  this.lastReviewed = new Date();
  this.timesReviewed += 1;

  if (quality >= 3) {
    this.timesCorrect += 1;
  } else {
    this.timesIncorrect += 1;
  }

  // Update ease factor
  this.easeFactor = Math.max(1.3, this.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));

  // Update interval and repetitions
  if (quality < 3) {
    // Reset if quality is low
    this.repetitions = 0;
    this.interval = 1;
  } else {
    this.repetitions += 1;
    if (this.repetitions === 1) {
      this.interval = 1;
    } else if (this.repetitions === 2) {
      this.interval = 6;
    } else {
      this.interval = Math.round(this.interval * this.easeFactor);
    }
  }

  // Update next review date
  this.nextReview = new Date();
  this.nextReview.setDate(this.nextReview.getDate() + this.interval);

  // Mark as mastered if reviewed correctly 5+ times
  if (this.timesCorrect >= 5 && this.timesIncorrect === 0) {
    this.isMastered = true;
  }
};

const FlashcardProgress = mongoose.model('FlashcardProgress', flashcardProgressSchema);

export default FlashcardProgress;





