const express = require('express');
const router = express.Router();

// Assuming you have imported the User model for authentication
const { User } = require('../models');

// Route handler for the home page
router.get('/', (req, res) => {
    if (req.session.userId) {
      // If the user is authenticated (logged in), redirect to the dashboard
      res.redirect('/dashboard');
    } else {
      // If the user is not authenticated (not logged in), render the home view
      res.render('home', { title: 'Home' });
    }
  });
  

// Add other routes for the home page as needed

module.exports = router;
