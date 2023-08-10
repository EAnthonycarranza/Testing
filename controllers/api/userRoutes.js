const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { User } = require('../../models');
const bcrypt = require('bcrypt');
const { withAuth, isAdmin } = require('../../utils/auth');
const { PetPhoto } = require('../../models');

// Define your user routes
router.post('/login', async (req, res) => {
  try {
    // Get the email and password from the request body
    const { email, password } = req.body;

    // Find the user with the given email in the database
    const user = await User.findOne({ where: { email } });

    // If the user is not found, immediately send a response
    if (!user) {
    return res.render('login', { errorMessage: 'Incorrect email or password. Please try again!' });
  }
    // Check if the provided password matches the hashed password in the database
    const passwordMatch = await bcrypt.compare(password, user.password);

    // If the passwords do not match, respond with an error message
    if (!passwordMatch) {
      return res.render('login', { errorMessage: 'Incorrect email or password. Please try again!' });
  }

    // After verifying the password, set the user as logged in by saving the user ID in the session
    req.session.userId = user.id; // Set the userId in the session

    // Redirect to the dashboard after successful login
    res.redirect('/dashboard');

  } catch (err) {
    console.error(err);  // Log the error to console
    res.status(500).json({ message: 'Server error' });
  }
});

// Inside your route handler in userRoutes.js
router.get('/logout', (req, res) => {
  // Destroy the user session
  req.session.destroy((err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Error logging out' });
    }

    // Redirect the user to the login page after logout
    res.redirect('/login');
  });
});

// Inside the '/signup' route handler
router.post('/signup', async (req, res) => {
  try {
    // Get the user data from the request body
    const { email, username, password } = req.body;

    // Check if the user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      if (req.xhr) {  // if it's an AJAX request
        return res.status(400).json({ message: 'User with this email already exists' });
      } else {  // for normal request
        return res.render('signup', { error: 'Email already exists' });
      }
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user in the database
    const newUser = await User.create({ email, username, password: hashedPassword, is_admin: false });

    // Set the signupComplete flag to true
    req.session.signupComplete = true;

    // Redirect to the dashboard after successful signup
    // Change how to handle the response based on whether the request is AJAX
    if (req.xhr) {
      res.json({ message: 'Signup successful', redirectUrl: '/dashboard' });
    } else {
      res.redirect('/dashboard');
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Signup failed' });
  }
});

// Define your dashboard route and use the withAuth middleware
router.get('/dashboard', withAuth, async (req, res) => {
  try {
    // Retrieve the user's information from the database using the user ID stored in the session
    const user = await User.findByPk(req.session.userId);

    // Retrieve the user's pet photos from the database
    const petPhotos = await PetPhoto.findAll({ where: { user_id: user.id } });

    // Format the age of the pets
    petPhotos.forEach(pet => {
      if (pet.age !== null) {
        pet.ageFormatted = pet.age + ' years';
      } else {
        pet.ageFormatted = 'Unknown';
      }
    });

    // Pass the user's information and formatted pet photos to the template
    res.render('dashboard', { username: user.username, user, petPhotos });

    // Reset the signupComplete flag for subsequent visits
    req.session.signupComplete = false;

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin login route
router.post('/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user || !bcrypt.compareSync(password, user.password) || !user.isAdmin) {
      return res.status(401).json({ message: 'Invalid credentials or not an admin' });
    }

    // Set the user as logged in and admin in the session
    req.session.userId = user.id;
    req.session.isAdmin = user.isAdmin;

    res.json({ message: 'Admin login successful', user: user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Inside your route handler
router.get('/find-user', async (req, res) => {
  try {
    // Get the email from the query parameters (you can get this from request body as well)
    const { email } = req.query;

    // Use the custom method to find the user by email
    const user = await User.findByEmail(email);

    if (user) {
      // User found
      res.json({ message: 'User found', user });
    } else {
      // User not found
      res.json({ message: 'User not found' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Route handler for the '/your-pets' page (previously 'post' page)
router.get('/dashboard/your-pets', withAuth, (req, res) => {
  // Assuming you have a 'post' view in your views folder
  res.render('post', { title: 'Upload Your Pet Photo' });
});

// Set up Multer storage and file filter
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads'); // Store uploaded files in the 'public/uploads' folder
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname)); // Rename the file to avoid conflicts
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB file size limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Route handler for handling the photo upload
router.post('/upload', upload.single('petPhoto'), async (req, res) => {
  try {
    // Access the uploaded file using req.file
    const petPhoto = req.file;
    const userId = req.session.userId;

    // Construct the full image URL using appUrl
    const imageUrl = `${appUrl}/uploads/${petPhoto.filename}`;

    // Save the image URL to the database using the PetPhoto model
    const newPetPhoto = await PetPhoto.create({
      image_url: imageUrl,  // Store the full image URL
      user_id: userId,
    });

    // Redirect the user to a thank you page or back to the post page
    res.redirect('/post');
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error uploading photo' });
  }
});

router.delete('/delete-photo/:id', withAuth, async (req, res) => {
  console.log('Delete photo route hit');
  try {
    const { id } = req.params;
    const photo = await PetPhoto.findByPk(id);

    if (!photo) {
      return res.status(404).json({ message: 'Photo not found' });
    }

    // Make sure the photo belongs to the currently logged-in user
    if (photo.user_id !== req.session.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Delete the photo file from the server
    fs.unlinkSync(path.join(__dirname, '../../uploads', path.basename(photo.image_url)));

    // Delete the photo record from the database
    await photo.destroy();

    res.json({ success: true, message: 'Photo deleted successfully' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Route handler for the account settings page
router.get('/account', withAuth, async (req, res) => {
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

// Route handler for updating the password
router.post('/update-password', withAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.session.userId;

    // Find the user in the database by ID
    const user = await User.findByPk(userId);

    // Check if the provided current password matches the hashed password in the database
    const passwordMatch = await bcrypt.compare(currentPassword, user.password);

// If the current password is incorrect, respond with an error message
if (!passwordMatch) {
  return res.render('account-settings', { user: user, errorMessage: 'Incorrect password' });
}

    // Hash the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password in the database
    await User.update({ password: hashedNewPassword }, { where: { id: userId } });

    // Redirect to the dashboard after updating the password
    res.redirect('/dashboard');

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Route handler for deleting the account
router.post('/delete-account', withAuth, async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const userId = req.session.userId;

    // Find the user in the database by ID
    const user = await User.findByPk(userId);

// If the provided username, email, and password do not match, respond with an error message
if (user.username !== username || user.email !== email || !(await bcrypt.compare(password, user.password))) {
  return res.render('account-settings', { user: user, deleteErrorMessage: 'Invalid username, email, or password' });
}

    // Delete the user's account from the database
    await User.destroy({ where: { id: userId } });

    // Destroy the user session
    req.session.destroy((err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Error logging out' });
      }

      // Redirect the user to the login page after deleting the account
      res.redirect('/login');
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Example route that requires admin authentication
router.get('/admin/dashboard', isAdmin, (req, res) => {  // Corrected middleware usage
  // You can access the user's data from the session
  const userId = req.session.userId;
  const isAdmin = req.session.isAdmin;
  
  // Your logic for the admin dashboard
  // Return the admin dashboard view or JSON data as needed
  res.json({ userId, isAdmin });
});

// Add more user routes as needed

module.exports = router;
