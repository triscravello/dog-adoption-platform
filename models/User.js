const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

// User Model
const SALT_ROUNDS = 12; // set number of "salt rounds"

const userSchema = new mongoose.Schema({
    username: {
        type: String, 
        required: true,
        unique: true,
        trim: true
    },
    passwordHash: {
        type: String,
        required: true,
        minlength: 6
    },
});

// Hashing the password with validation
// Virtual for password setting
userSchema.methods.setPassword = async function (password) {
    this.passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
}

userSchema.methods.validatePassword = async function (password) {
    return bcrypt.compare(password, this.passwordHash);
}

// Hide sensitive fields when converting to JSON
userSchema.set('toJSON', {
    virtuals: true,
    transform: function (doc, ret, options) {
        // Remove the password field from the JSON output
        delete ret.password;
        return ret;
    }
})

const User = mongoose.model('User', userSchema);

module.exports = User;