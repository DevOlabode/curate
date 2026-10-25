// models/collection.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const collectionSchema = new Schema({
  name: { 
    type: String, 
    required: true 
  },
  description: {
    type : String,
    required : false
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bookmarks: [
    { 
      type: Schema.Types.ObjectId, 
      ref: 'Bookmark' 
    }
  ],
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  user : {
    type: Schema.Types.ObjectId,
    ref: 'User'     
  }
}, {
  suppressReservedKeysWarning: true 
});

collectionSchema.index({ owner: 1 });

module.exports = mongoose.model('Collection', collectionSchema);