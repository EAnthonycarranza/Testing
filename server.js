require('dotenv').config();  // Load environment variables first

const env = process.env.NODE_ENV || 'development';
const config = require('./config/config')[env];
const express = require('express');
const exphbs = require('express-handlebars');
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const routes = require('./controllers');
const path = require('path');
const uuid = require('uuid');
const { withAuth } = require('./utils/auth');
const User = require('./models/User');
const app = express();
const PORT = process.env.PORT || 3001;
const Sequelize = require('sequelize');
const mysql = require('mysql2');
const PetPhoto = require('./models/PetPhoto');
const sequelize = require('./config/connection');  // Make sure to provide the correct path to connection.js.
const multer = require('multer');
const Comment = require('./models/Comment');
const helpers = require('./helpers/helpers');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    // Create a unique filename using the original extension
    const ext = path.extname(file.originalname);
    const filename = `${uuid.v4()}${ext}`;
    cb(null, filename)
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024  // 1MB in bytes
  }
});

// Set up handlebars
const hbs = exphbs.create({
  defaultLayout: 'main',
  helpers: {
    extend: function (name, context) {
      const partial = hbs.getPartials()[name];
      if (!partial) return '';
      return new hbs.SafeString(partial(context));
    },
    isCommentOwner: function (commentUserId, currentUserId) {
      return commentUserId === currentUserId;
    },
    and: function () {
      return Array.prototype.every.call(arguments, Boolean);
    },
  },
  runtimeOptions: {
    allowProtoPropertiesByDefault: true,
  },
});


app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the 'public' directory without any prefix
app.use(express.static(path.join(__dirname, 'public')));

// Serve files from the 'uploads' directory with the '/uploads' prefix
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Session middleware with SequelizeStore
const sess = {
  secret: process.env.SESSION_SECRET,  // Secure your session secret
  resave: false,
  saveUninitialized: true,
  store: new SequelizeStore({
    db: sequelize,
  }),
};

app.use(session(sess));

app.use((req, res, next) => {
  res.locals.isAuthenticated = !!req.session.userId; 
  next();
});

// Routes
const homeRoutes = require('./controllers/homeRoutes');
const userRoutes = require('./controllers/api/userRoutes');

app.use('/', homeRoutes);
app.use('/api/users', userRoutes);

// Specific route for the /post page to render the 'Upload Your Pet Photo' 
app.get('/post', (req, res) => {
  res.render('post', { title: 'Upload Your Pet Photo' });
});

// Use userRoutes for /post route
app.use('/post', userRoutes);

// Route handler for the dashboard page
app.get('/dashboard', withAuth, async (req, res) => {
  try {
    // Retrieve the user's information from the database using the user ID stored in the session
    const user = await User.findByPk(req.session.userId);

    // Fetch the pet photos associated with this user
    const petPhotos = await PetPhoto.findAll({ where: { user_id: req.session.userId } });

    // Pass the user's information, pet photos, and signupComplete flag to the template
    res.render('dashboard', { title: 'Dashboard', username: user.username, petPhotos });

    // Reset the signupComplete flag for subsequent visits
    req.session.signupComplete = false;
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/upload', upload.single('petPhoto'), async (req, res, next) => {
  try {
    await PetPhoto.create({
      image_url: `/uploads/${req.file.filename}`,
      pet_name: req.body.petName,  // Grab petName from form
      message: req.body.message,  // Grab message from form
      age: req.body.age, // Get the "Age" value from the form
      location: req.body.location, // Get the "Location" value from the form
      breed: req.body.breed, // Get the "Breed" value from the form
      user_id: req.session.userId
    });
    res.redirect('/dashboard');
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
}, (error, req, res, next) => {
  // This is error handling middleware specific to this route
  if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
    // When a Multer error occurs due to file size limit
    res.status(400).send({ error: 'File size should be less than 1MB' });
  } else if (error) {
    res.status(400).send({ error: error.message });
  }
});

app.post('/submit-comment/:id', async (req, res) => {
  const petPhotoId = req.params.id;
  const content = req.body.comment;
  const userId = req.session.userId;

  try {
      await Comment.create({
          content,
          user_id: userId,
          pet_photo_id: petPhotoId
      });
      res.redirect('/view-pets');
  } catch (error) {
      console.error('Error saving comment:', error);
      res.status(500).send('Server error.');
  }
});

// Route handler to delete a comment
app.post('/delete-comment/:id', async (req, res) => {
  const commentId = req.params.id;
  const userId = req.session.userId;

  try {
    // Find the comment in the database
    const comment = await Comment.findByPk(commentId);

    // Check if the comment exists and if the current user is the owner
    if (comment && comment.user_id === userId) {
      // Delete the comment if the current user is the owner
      await comment.destroy();
      return res.redirect('/view-pets');
    } else {
      return res.status(403).send('Unauthorized to delete the comment.');
    }
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).send('Server error.');
  }
});

// Route handler for the login page
app.get('/login', (req, res) => {
  // Assuming you have a 'login' view in your views folder
  res.render('login', { title: 'Login' });
});

// Route handler for the login page
app.get('/signup', (req, res) => {
  // Assuming you have a 'login' view in your views folder
  res.render('signup', { title: 'Sign-Up' });
});

app.get('/your-pets', async (req, res) => {
  try {
    const pets = await PetPhoto.findAll({ where: { user_id: req.session.userId } });
    res.render('your-pets', { pets: pets.map(pet => pet.get()) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/view-pets', async (req, res) => {
  try {
    // Fetch all pet photos from the database
    const petPhotos = await PetPhoto.findAll({
      include: [
        {
          model: Comment,
          as: 'comments'
        }
      ]
    });
    
    // Check the age value for each pet photo
    for (const photo of petPhotos) {
      console.log('Age:', photo.age);
      if (photo.age === null) {
        photo.age = "Age not provided";
      } else {
        photo.age = `${photo.age} years`;
      }
      console.log('Age Formatted:', photo.age);
    }

    // Render the view-pets.handlebars template and pass the petPhotos data to it
    res.render('view-pets', { petPhotos });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Route handler for rendering the account settings page
app.get('/account-settings', withAuth, async (req, res) => {
  try {
    // Retrieve the user's information from the database using the user ID stored in the session
    const user = await User.findByPk(req.session.userId);

    // Render the account settings view with the user's information
    res.render('account-settings', { title: 'Account Settings', user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

if (process.env.DEBUG) {
  require('debug').enable('app:*');
}

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});


// Start the server
sequelize.sync({ force: false }).then(() => {
  app.listen(PORT, () => {
      console.log(`Server listening on http://localhost:${PORT}`);
  });
});