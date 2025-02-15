const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema({
    phoneNumber: {
        type: String, 
        required: true 
    },
    email: {
        type: String, 
        required: true 
    },
    linkedId: { 
        type: mongoose.Schema.Types.ObjectId, 
        default: null, 
        ref: "Contact" 
    },
    linkPrecedence: { 
        type: String, 
        enum: ["primary", "secondary"], 
        required: true 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    updatedAt: { 
        type: Date, 
        default: Date.now 
    },
    deletedAt: { 
        type: Date, 
        default: null 
    }
});

// Auto-update `updatedAt` on save
contactSchema.pre("save", function (next) {
    this.updatedAt = Date.now();
    next();
});

const Contact = mongoose.model("Contact", contactSchema);
module.exports = Contact;
