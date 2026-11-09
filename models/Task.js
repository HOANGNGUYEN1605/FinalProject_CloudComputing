const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Tiêu đề công việc không được để trống'],
      trim: true
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null
    },
    status: {
      type: String,
      enum: ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'],
      default: 'TODO'
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium'
    },
    dueDate: {
      type: String,
      default: ''
    },
    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    attachments: [
      {
        fileName: String,
        fileUrl: String,
        fileSize: Number,
        fileType: String,
        uploadedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    // Tương thích ngược với hệ thống cũ
    completed: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

// Đồng bộ completed khi status thay đổi
taskSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    this.completed = this.status === 'DONE';
  } else if (this.isModified('completed')) {
    this.status = this.completed ? 'DONE' : 'TODO';
  }
  next();
});

module.exports = mongoose.model('Task', taskSchema);
