const mongoose = require("mongoose");

// Adoption model
const adoptionSchema = new mongoose.Schema(
    {
        dog: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Dog',
            required: true
        },
        adopter: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        }, 
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        thankYouMessage: { type: String },
        adoptedAt: { type: Date, default: Date.now },
    }
)

const Adoption = mongoose.model('Adoption', adoptionSchema);

module.exports = Adoption;