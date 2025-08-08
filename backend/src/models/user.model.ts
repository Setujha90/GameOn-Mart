import mongoose, {Schema, Document, Model} from "mongoose";

export interface IUser extends Document {
    fullName: string;
    username: string;
    email: string;
    avatar: string;
    role: 'user' | 'admin';
    password: string;
    isVerified: boolean;
    refreshToken: string;
    createdAt: Date;
    updatedAt: Date;
}

const userSchema: Schema<IUser> = new Schema({
    fullName: {
        type: String,
        required: [true, 'Full name is required'],
        trim: true 
    },
    username: {
        type: String,
        required: [true, 'Username is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        trim: true,
        unique: true,
        lowercase: true 
    },
    avatar: {
        type: String,
        required: [true, 'Avatar is required'],
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters long']
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    refreshToken: {
        type: String,
        default: null
    },
}, { timestamps: true })

const User: Model<IUser> = mongoose.model('User', userSchema) 

export default User 