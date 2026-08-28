const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;

// GET / route returning confirmation message
app.get('/', (req, res) => {
  res.send('TaskFlow Backend is Running');
});

// Start the Express server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
