import express, { Application } from 'express';
import "dotenv/config";
import connectDB from './config/db';
import errorHandler from './middlewares/errorHandler';
import authRouter from './routes/auth.routes';
import cookieParser from 'cookie-parser';

const app: Application = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cookieParser());
app.get('/', (req, res) => {
res.send('Welcome to the E-commerce Backend!');
});

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}).catch((error) => {
    console.error('Database connection failed:', error);
    process.exit(1);
});

app.use('/api/auth', authRouter);
app.use(errorHandler);

