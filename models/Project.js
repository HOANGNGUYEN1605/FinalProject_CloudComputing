const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên dự án không được để trống'],
      trim: true
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    invitations: [
      {
        email: {
          type: String,
          required: true,
          lowercase: true,
          trim: true
        },
        invitedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        status: {
          type: String,
          enum: ['PENDING', 'ACCEPTED', 'DECLINED'],
          default: 'PENDING'
        },
        invitedAt: {
          type: Date,
          default: Date.now
        }
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Project', projectSchema);
