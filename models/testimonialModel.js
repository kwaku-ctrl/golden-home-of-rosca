const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required']
    },
    role: {
      type: String,
      default: 'Member'
    },
    message: {
      type: String,
      required: [true, 'Testimonial message is required']
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 5
    },
    featured: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Testimonial', testimonialSchema);
