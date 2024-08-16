const express = require('express');
const multer = require('multer');
const csvParser = require('csv-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/register', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const results = [];
  const stream = req.file.buffer.toString('utf-8');

  try {
    const parser = csvParser();
    parser.on('data', (row) => {
      results.push(row);
    });
    parser.on('end', async () => {
      const password = 'maruti@123'; 
      for (const row of results) {
        const mspin = row['MSPIN / STAFF ID'];
        const region = row['Region'];
        const designation = row['Designation'];

        if (!mspin) {
          console.error('MSPIN is undefined:', row);
          continue;
        }

        try {
          let user = await User.findOne({ mspin });
          if (!user) {
            const hashedPassword = await bcrypt.hash(password, 10);
            user = new User({ mspin, password: hashedPassword, region, designation });
            await user.save();
            console.log(`User registered with MSPIN: ${mspin}`);
          } else {
            console.log(`User with MSPIN ${mspin} already exists`);
          }
        } catch (err) {
          console.error(`Error registering user with MSPIN ${mspin}:`, err.message);
        }
      }
      res.status(201).json({ message: 'Users registered successfully' });
    });
    parser.write(stream);
    parser.end();
  } catch (err) {
    console.error('Error processing CSV:', err.message);
    res.status(500).send('Server error');
  }
});

router.post('/login', async (req, res) => {
  const { mspin, password } = req.body;

  try {
    let user = await User.findOne({ mspin });
    if (!user) {
        return res.status(404).json({
            status: 404,
            message: 'user not found',
            data:{
                
            }
          });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

   return res.status(200).json({
        status: 200,
        message: 'Logged in successfully',
        data: {
          token,
          user: {
            _id: user._id,
            mspin:user.mspin,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
          }
        }
      });
  } catch (err) {
    console.error(err.message);
    return   res.status(500).json({ statusCode:500,message:"user login successfully",error:err });
  }
});
router.post('/update-user-data', async (req, res) => {
    const { mspin, data } = req.body;
  
    if (!mspin || !Array.isArray(data)) {
      return res.status(400).json({ message: 'Invalid input' });
    }
   try {
      const user = await User.findOneAndUpdate(
        { mspin },
        { $set: { data } },
        { new: true } 
      );
  
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
     return res.status(200).json({ message: 'User data updated successfully', user });
    } catch (error) {
      console.error(error);
    return  res.status(500).json({ message: 'Server error' });
    }
  });
module.exports = router;
