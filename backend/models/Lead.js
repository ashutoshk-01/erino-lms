const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    company: {
        type: String,
        required: true,
        trim: true
    },
    city: {
        type: String,
        required: true,
        trim: true
    },
    state: {
        type: String,
        required: true,
        trim: true
    },
    source: {
        type: String,
        required: true,
        enum: ['website', 'facebook_ads', 'google_ads', 'referral', 'events', 'other'],
        default: 'website'
    },
    status: {
        type: String,
        required: true,
        enum: ['new', 'contacted', 'qualified', 'lost', 'won'],
        default: 'new'
    },
    score: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    lastActivity: {
        type: Date,
        default: null
    },
    isQualified: {
        type: Boolean,
        default: false
    }
},
    {
        timestamps: true
    });

leadSchema.index({userId: 1 , status: 1});
leadSchema.index({userId: 1 , source: 1});
leadSchema.index({userId: 1 , createdAt: -1});
leadSchema.index({userId: 1 , email: 1} , {unique: true});

leadSchema.methods.toJSON = function(){
    const lead = this.toObject();
    lead.id = lead._id;
    delete lead._id;
    delete lead.__v;
    return lead;
};

module.exports = mongoose.model("Lead", leadSchema);