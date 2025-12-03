import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    enum: ['student', 'tutor']
  },
  permissions: [{
    type: String,
    enum: [
      'read_courses',
      'write_courses',
      'delete_courses',
      'read_lessons',
      'write_lessons',
      'delete_lessons',
      'execute_code',
      'save_code',
      'view_progress',
      'manage_users',
      'manage_content',
      'use_ai_features',
      'use_voice_features',
      'use_premium_features'
    ]
  }],
  description: {
    type: String
  }
}, {
  timestamps: true
});

const Role = mongoose.model('Role', roleSchema);

// Initialize default roles
export const initializeRoles = async () => {
  const roles = [
    {
      name: 'student',
      permissions: ['read_courses', 'read_lessons', 'execute_code', 'save_code', 'view_progress', 'use_ai_features', 'book_appointments', 'send_messages'],
      description: 'Student access with learning features'
    },
    {
      name: 'tutor',
      permissions: ['read_courses', 'read_lessons', 'view_progress', 'manage_students', 'view_appointments', 'view_messages', 'use_ai_features', 'manage_demo_users'],
      description: 'Tutor with student progress tracking and appointment management'
    }
  ];

  for (const role of roles) {
    await Role.findOneAndUpdate(
      { name: role.name },
      role,
      { upsert: true, new: true }
    );
  }
};

export default Role;


