const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Meeting title is required'],
      trim: true
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    roomCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true
    },
    meetingCode: {
      type: String,
      trim: true,
      uppercase: true
    },
    date: {
      type: String,
      required: [true, 'Meeting date is required'],
      trim: true
    },
    time: {
      type: String,
      required: [true, 'Meeting time is required'],
      trim: true
    },
    meetingLink: {
      type: String,
      default: '',
      trim: true
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course'
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    notes: {
      type: String,
      default: '',
      trim: true
    },
    status: {
      type: String,
      enum: ['scheduled', 'active', 'ended'],
      default: 'scheduled'
    },
    participants: [
      {
        studentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        joinedAt: {
          type: Date,
          default: Date.now
        },
        leftAt: {
          type: Date
        }
      }
    ],
    messages: [
      {
        senderId: {
          type: String,
          required: true
        },
        senderName: {
          type: String,
          required: true
        },
        senderRole: {
          type: String,
          default: 'student'
        },
        text: {
          type: String,
          required: true,
          trim: true
        },
        timestamp: {
          type: Date,
          default: Date.now
        }
      }
    ],
    startedAt: {
      type: Date
    },
    endedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Meeting', meetingSchema);
