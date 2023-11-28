const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const port = 4000
const secretKey = "secretKey";
const jwt = require('jsonwebtoken');
const database_file = require('./database.js');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

app.use(bodyParser.json())

app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Access-Control-Allow-Headers');
  next();
});


app.post('/user', (req, res, next) => {
  const userId = uuidv4();
  req.userId = userId; 
  next();
});

app.put('/user/:userid',(req, res, next) => {
  const userId = req.params.userid;
  req.userId = userId;
  next();
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => { 
    if (!req.userId) {
      return cb(new Error('User ID not provided'), null);
    }
    const userFolder = `./upload/${req.userId}`;
    const profilePicFolder = path.join(userFolder, 'profilepic');
    const resumeFolder = path.join(userFolder, 'resume');
    
    fs.mkdirSync(userFolder, { recursive: true });
    fs.mkdirSync(profilePicFolder, { recursive: true });
    fs.mkdirSync(resumeFolder, { recursive: true });

    if (file.fieldname === 'profilepicture') {
      cb(null, profilePicFolder);
    } else if (file.fieldname === 'resume') {
      cb(null, resumeFolder);
    } else {
      cb(new Error('Invalid file field'), null);
    }
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });
app.use('/upload', express.static('upload'));


app.post('/user', upload.fields([
  { name: 'profilepicture', maxCount: 1 }, 
  { name: 'resume', maxCount: 1 }, 
]), (req, res) => {
  const profilepicture = `http://localhost:4000/upload/${req.userId}/profilepic/${req.files['profilepicture'][0].filename}`;
  const resume = `${req.files['resume'][0].filename}`;
  database_file.createUser(req.userId,req.body,profilepicture,resume)
  .then((response) => {
     res.status(200).send(response);
  })
  .catch((error) => {
     res.status(500).send(error);
  })
});

app.put('/user/:userId', upload.fields([
  { name: 'profilepicture', maxCount: 1 }, 
  { name: 'resume', maxCount: 1 }, 
]), async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).send('User ID not provided');
  }

  let profilepicture = '';
  let resume = '';

  if (req.files['profilepicture']) {
    profilepicture = `http://localhost:4000/upload/${userId}/profilepic/${req.files['profilepicture'][0].filename}`;
  }
  
  if (req.files['resume']) {
    resume = `${req.files['resume'][0].filename}`;
  }

  try {
    
    const existingUserData = await database_file.getUser(userId);

    if (!req.files['profilepicture']) {
      profilepicture = existingUserData.profilepicture; 

    }
    if (!req.files['resume']) {
      resume = existingUserData.resume; 
    }
    
    const response = await database_file.updateUser(userId, req.body, profilepicture, resume);
    res.status(200).send(response);
  } catch (error) {
    res.status(500).send(error);
  }
});

app.get('/user/:userid/:filename', (req, res) => {
  const userId = req.params.userid;
  const filename = req.params.filename;

  database_file.DownloadResume(userId,filename)
    .then((resumePath) => {
      res.download(resumePath);
    })
    .catch((error) => {
      res.status(404).json({ error: error.message });
    });
});

app.get('/country', (req, res) => {
  database_file.getCountry()
    .then(response => {
      res.status(200).send(response);
    })
    .catch(error => {
      res.status(500).send(error);
    })
})

app.get('/state', (req, res) => {
  database_file.getState()
    .then(response => {
      res.status(200).send(response);
    })
    .catch(error => {
      res.status(500).send(error);
    })
})

app.get('/city', (req, res) => {
  database_file.getCity()
    .then(response => {
      res.status(200).send(response);
    })
    .catch(error => {
      res.status(500).send(error);
    })
})

app.post('/admin', (req, res) => {
  const { username, password } = req.body;

  database_file.createToken({ username, password })
    .then((user) => {
      if (user) {
        jwt.sign({ username, password }, secretKey, { expiresIn: '1h' }, (err, token) => {
          if (err) {
            res.status(500).json({ error: 'Internal server error' });
          } else {
            res.json({ token });
          }
        });
      } else {
        res.status(401).json({ error: 'Invalid username or password' });
      }
    })
    .catch((error) => {
      res.status(500).json({ error: 'Internal server error',error});
    });
});

app.post('/profile', verifyToken, (req, res) => {
  jwt.verify(req.token, secretKey, (err, authData) => {
    if(err) {
      res.send({ result: "invalid token" })
    } else {
      res.json({ message: "profile accessed", authData })
    }
  })
})

function verifyToken(req, res, next) {
  const bearerHeader = req.headers['authorization'];
  if (typeof bearerHeader !== 'undefined') {
    const bearer = bearerHeader.split(" ");
    const token = bearer[1];
    req.token = token;
    next();
  } else {
    res.send({ result: "Token is not valid" })
  }
}

app.post('/country', (req, res) => {
  database_file.createCountry(req.body)
    .then(response => {
      res.status(200).send({response, message: "Country Addedd Successfully"});
    })
    .catch(error => {
      res.status(500).send(error);
    })
})

app.post('/state', (req, res) => {
  database_file.createState(req.body)
    .then(response => {
      res.status(200).send({response, message: "State Addedd Successfully"});
    })
    .catch(error => {
      res.status(500).send(error);
    })
})

app.post('/city', (req, res) => {
  database_file.createCity(req.body)
    .then(response => {
      res.status(200).send({response, message: "City Addedd Successfully"});
    })
    .catch(error => {
      res.status(500).send(error);
    })
})

app.post('/admin/:id', (req, res) => {
  const userId = req.params.id;

  database_file.getUserById(userId)
    .then((user) => {
      res.json(user);
    })
    .catch((error) => {
      res.status(404).json({ error: error.message });
    });
});

app.delete('/country/:countryid', (req, res,) => {
  const countryId = req.params.countryid;

  database_file.deleteCountry(countryId)
  .then(response => {
    res.json({message: response});
  })
  .catch(error => {
    res.status(500).send(error);
  })
}) 

app.delete('/state/:stateid', (req, res,) => {
  const stateId = req.params.stateid;

  database_file.deleteState(stateId)
  .then(response => {
    res.json({message: response});
  })
  .catch(error => {
    res.status(500).send(error);
  })
}) 

app.delete('/city/:cityid', (req, res,) => {
  const cityId = req.params.cityid;

  database_file.deleteCity(cityId)
  .then(response => {
    res.json({message: response});
  })
  .catch(error => {
    res.status(500).send(error);
  })
}) 

app.get('/country/:countryid', (req, res) => {
  const countryId = req.params.countryid;

  database_file.getCountryById(countryId)
    .then((country) => {
      res.json(country);
    })
    .catch((error) => {
      res.status(404).json({ error: error.message });
    });
});

app.get('/state/:stateid', (req, res) => {
  const stateId = req.params.stateid;

  database_file.getStateById(stateId)
    .then((state) => {
      res.json(state);
    })
    .catch((error) => {
      res.status(404).json({ error: error.message });
    });
});

app.get('/city/:cityid', (req, res) => {
  const cityId = req.params.cityid;

  database_file.getCityById(cityId)
    .then((city) => {
      res.json(city);
    })
    .catch((error) => {
      res.status(404).json({ error: error.message });
    });
});

app.put('/country/:countryid', (req, res,) => {
  const body = req.body
  const countryId = req.params.countryid
  database_file.updateCountry(body,countryId)
  .then(response => {
    res.json({message: response});
  })
  .catch(error => {
    res.status(500).send(error);
  })
})

app.put('/state/:stateid', (req, res,) => {
  const body = req.body
  const stateId = req.params.stateid
  database_file.updateState(body,stateId)
  .then(response => {
    res.json({message: response});
  })
  .catch(error => {
    res.status(500).send(error);
  })
}) 

app.put('/city/:cityid', (req, res,) => {
  const body = req.body
  const cityId = req.params.cityid
  database_file.updateCity(body,cityId)
  .then(response => {
    res.json({message: response});
  })
  .catch(error => {
    res.status(500).send(error);
  })
}) 

app.get('/countryPagination', (req, res) => {
  const sortOrder = req.query.sortOrder || 'asc';
  const filter = req.query.filter || '';
  const pageNumber = parseInt(req.query.pageNumber) || 0;
  const pageSize = parseInt(req.query.pageSize);

  database_file.Countrypagination(pageNumber, pageSize, filter, sortOrder)
    .then((response) => {
      res.status(200).send(response);
    })
    .catch((error) => {
      res.status(500).send(error);
    });
});

app.get('/statePagination', (req, res) => {
  const sortOrder = req.query.sortOrder || 'asc';
  const filter = req.query.filter || '';
  const pageNumber = parseInt(req.query.pageNumber) || 0;
  const pageSize = parseInt(req.query.pageSize);
  database_file.Statepagination(pageNumber, pageSize, filter, sortOrder)
    .then((response) => {
      res.status(200).send(response);
    })
    .catch((error) => {
      res.status(500).send(error);
    });
});

app.get('/cityPagination', (req, res) => {
  const sortOrder = req.query.sortOrder || 'asc';
  const filter = req.query.filter || '';
  const pageNumber = parseInt(req.query.pageNumber) || 0;
  const pageSize = parseInt(req.query.pageSize);

  database_file.Citypagination(pageNumber, pageSize, filter, sortOrder)
    .then((response) => {
      res.status(200).send(response);
    })
    .catch((error) => {
      res.status(500).send(error);
    });
});

app.get('/user', (req, res) => {
  database_file.getUser()
    .then(response => {
      res.status(200).send(response);
    })
    .catch(error => {
      res.status(500).send(error);
    })
})

app.get('/userById/:userid', (req, res) => {
  const userId = req.params.userid;
  database_file.getUserById(userId)
    .then((response) => {
      res.json(response);
    })
    .catch((error) => {
      res.status(404).json({ error: error.message });
    });
});

app.get('/ViewUserById/:userid', (req, res) => {
  const userId = req.params.userid;

  database_file.ViewUserById(userId)
    .then((response) => {
      res.json(response);
    })
    .catch((error) => {
      res.status(404).json({ error: error.message });
    });
});

app.delete('/user/:userid', (req, res,) => {
  const userId = req.params.userid;
  database_file.deleteUser(userId)
  .then(response => {
    res.json(response);
  })
  .catch(error => {
    res.status(500).send(error);
  })
});

app.get('/userPagination', (req, res) => {
  const sortOrder = req.query.sortOrder || 'asc';
  const filter = req.query.filter || '';
  const pageNumber = parseInt(req.query.pageNumber) || 0;
  const pageSize = parseInt(req.query.pageSize);

  database_file.Userpagination(pageNumber, pageSize, filter, sortOrder)
    .then((response) => {
      res.status(200).send(response);
    })
    .catch((error) => {
      res.status(500).send(error);
    });
});

app.listen(port, () => {
  console.log(`App running on port ${port}.`)
})


