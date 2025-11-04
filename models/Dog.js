const mongoose = require("mongoose");

// Dog Model
const DOG_STATUSES = {
    AVAILABLE: 'available',
    ADOPTED: 'adopted',
    REMOVED: 'removed'
}

const dogSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true, 
            trim: true
        },
        description: {
            type: String,
            trim: true
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        status : {
            type: String,
            enum: Object.values(DOG_STATUSES),
            default: DOG_STATUSES.AVAILABLE,
        },
        adopter: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        adoptedAt: { type: Date },
        thankYouMessage: { type: String },
    }
)

dogSchema.statics.STATUSES = DOG_STATUSES;

const Dog = mongoose.model('Dog', dogSchema);

module.exports = Dog;