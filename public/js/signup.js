// In CompanionConnect/public/js/signup.js

// Prevent the default form submission behaviour
document.querySelector('form').addEventListener('submit', function(e) {
    e.preventDefault();
  
    // Get form data
    let username = document.getElementById('username').value;
    let email = document.getElementById('email').value;
    let password = document.getElementById('password').value;
  
    // Send the signup request manually
    fetch('/api/users/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: username,
        email: email,
        password: password,
      }),
    })
    .then(response => response.json())
    .then(data => {
      // If signup is successful, display the animation and redirect after 4 seconds
      if (data.message === 'Signup successful') {
        // Display the animation
        signupAnimation.style.opacity = '1';
        signupAnimation.style.visibility = 'visible';
  
        // Redirect to the dashboard after 4 seconds
        setTimeout(function() {
          window.location = data.redirectUrl;
        }, 4000);
      } else {
        // Handle signup errors
        console.error(data.message);
      }
    })
    .catch((error) => {
      console.error('Error:', error);
    });
  });
  