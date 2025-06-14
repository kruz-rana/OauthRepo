const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');

const Post = require('./models/post');
const User = require('./models/user');

const app = express();
dotenv.config();

// Middleware
app.use(cors());
app.use(express.json());
app.use(session({ secret: 'session-secret', resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.error(err));

// Passport config
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
    let user = await User.findOne({ googleId: profile.id });
    if (!user) user = await User.create({ googleId: profile.id, name: profile.displayName });
    return done(null, user);
}));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => done(null, await User.findById(id)));

// Auth Routes
app.get('/auth/google', passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/' }), (req, res) => {
    const token = jwt.sign({ id: req.user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.redirect(`${process.env.FRONTEND_URL}/auth-success?token=${token}`);
});

// JWT middleware
function authMiddleware(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Missing token' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ message: 'Invalid token' });
    }
}

// CRUD APIs
app.get('/api/posts', authMiddleware, async (req, res) => {
    const posts = await Post.find({ userId: req.user.id });
    res.json(posts);
});

app.post('/api/posts', authMiddleware, async (req, res) => {
    const newPost = new Post({ ...req.body, userId: req.user.id });
    await newPost.save();
    res.json(newPost);
});

app.put('/api/posts/:id', authMiddleware, async (req, res) => {
    const updatedPost = await Post.findOneAndUpdate({ _id: req.params.id, userId: req.user.id }, req.body, { new: true });
    res.json(updatedPost);
});

app.delete('/api/posts/:id', authMiddleware, async (req, res) => {
    await Post.deleteOne({ _id: req.params.id, userId: req.user.id });
    res.json({ message: 'Deleted' });
});

app.listen(5000, () => console.log('Server started on port 5000'));
