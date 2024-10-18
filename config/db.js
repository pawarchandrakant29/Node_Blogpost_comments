const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/blog-post')
    .then(() => console.log('Database Connected Sucessfully...'))
    .catch((err) => console.log('Error connecting to database:', err));
