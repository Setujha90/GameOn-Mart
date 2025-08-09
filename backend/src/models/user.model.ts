import mongoose, {Schema, Document, Model} from "mongoose";

export interface IUser extends Document {
    fullName: string;
    username: string;
    email: string;
    avatar: {
        url: string;
        public_id: string;
    };
    role: 'user' | 'admin' | 'seller';
    isSeller: boolean;
    isSellerRequest: boolean;
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
        url: {
            type: String,
            required: [true, 'Avatar URL is required']
        },
        public_id: {
            type: String,
            required: [true, 'Public ID is required']
        }
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'seller'],
        default: 'user'
    },
    isSeller: {
        type: Boolean,
        default: false
    },
    isSellerRequest: {
        type: Boolean,
        default: false
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