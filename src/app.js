const express = require('express');
const session = require('express-session');
const path = require('path');
const config = require('./config');
const passport = require('./config/passport');
const indexRoutes = require('./routes/index');
const authRoutes = require('./routes/auth');
const ganttRoutes = require('./routes/gantt');

const app = express();

// Warn if using the default session secret in production
if (config.nodeEnv === 'production' && config.sessionSecret === 'dev-secret-change-in-production') {
  console.error('WARNING: Using default session secret in production. Set SESSION_SECRET environment variable.');
}

// Trust proxy for Railway (needed for secure cookies)
if (config.nodeEnv === 'production') {
  app.set('trust proxy', 1);
}

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(
  session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: config.nodeEnv === 'production',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/', indexRoutes);
app.use('/auth', authRoutes);
app.use('/gantt', ganttRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).render('error', {
    title: 'Page Not Found',
    message: 'The page you are looking for does not exist.',
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', {
    title: 'Server Error',
    message: config.nodeEnv === 'development' ? err.message : 'Something went wrong.',
  });
});

// Start server
app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
  console.log(`Environment: ${config.nodeEnv}`);
});
