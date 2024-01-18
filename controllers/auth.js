const mysql = require("mysql");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { promisify } = require("util");
const path=require('path');

const db = mysql.createConnection({
    host: process.env.HOST,
    user: process.env.DATABASE_USER,
    password: process.env.PASSWORD,
    database: process.env.DATABASE
});

let userSave; // Declare the variable outside the functions

exports.adminlogin = async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).sendFile(path.resolve(__dirname, "../public/adminlog.html"), {
                message: "Please provide a username and password"
            });
        }
        db.query('SELECT * FROM adminlog WHERE username = ?', [username], async (err, results) => {
            if (!results || results.length === 0 || !await bcrypt.compare(password, results[0].password)) {
                return res.send("<script>alert('Username or password is incorrect'); window.location.href = '/adminlog';</script>");
            } else {
                const username = results[0].username;

                const token = jwt.sign({ username }, process.env.JWT_SECRET, {
                    expiresIn: 7776000
                });

                console.log("The token is " + token);

                const cookieOptions = {
                    expires: new Date(
                        Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000
                    ),
                    httpOnly: true
                };

                userSave = "admin" + username; // Assign the value to the global variable
                res.cookie(userSave, token, cookieOptions);
                res.status(200).redirect("/admin");
            }
        });
    } catch (err) {
        console.log(err);
    }
};

exports.adminisLoggedIn = async (req, res, next) => {
    if (req.cookies[userSave]) { // Access the global variable here
        try {
            const decoded = await promisify(jwt.verify)(req.cookies[userSave], process.env.JWT_SECRET);

            db.query('SELECT * FROM adminlog WHERE username = ?', [decoded.username], (err, results) => {
                if (!results || results.length === 0) {
                    return next();
                }
                req.user = results[0];
                return next();
            });
        } catch (err) {
            console.log(err);
            return next();
        }
    } else {
        next();
    }
};



exports.addstudent = (req, res) => {
    console.log(req.body);
    const { enrollment, name, phone, parentphone, room, zipcode, city, state, address } = req.body;
  
    db.query('SELECT enrollment from students WHERE enrollment = ?', [enrollment], async (err, results) => {
      if (err) {
        console.log(err);
      } else {
        if (results.length > 0) {
          return res.send("<script>alert('Student Already Registered!'); window.location.href = '/addstudent';</script>");
        }
      }
  
      const password = parentphone;
      console.log(password);
  
      let hashedPassword = await bcrypt.hash(password, 8);
      console.log(hashedPassword);
  
      db.query('INSERT INTO students SET ?',
        {
          enrollment: enrollment,
          name: name,
          phone: phone,
          parentphone: parentphone,
          room: room,
          zipcode: zipcode,
          city: city,
          state: state,
          address: address,
          password: hashedPassword
        },
        (err, results) => {
          if (err) {
            console.log(err);
          } else {
            // Insert enrollment and name into attendance table
            db.query('INSERT INTO attendance SET ?',
            {
              enrollment: enrollment,
              name: name,
              room: room,            
            }, (err, results) => {
              if (err) {
                console.log(err);
              } else {
                // const toEmail = email;
                // const subject = 'Password for HMS login';
                // const message = password;
  
                // mailsender.sendEmail(toEmail, subject, message); // Call the sendEmail function from the emailModule
  
                return res.send("<script>alert('Student Registered Successfully!'); window.location.href = '/adminlogin';</script>");
              }
            });
          }
        });
    });
  };
  



  exports.searchAndUpdateStudent = (req, res) => {
    const enrollment = req.body.enrollment;
  
    db.query('SELECT * FROM students WHERE enrollment = ?', [enrollment], (err, results) => {
      if (err) {
        console.log(err);
        res.render('updatestudent', { username: 'Admin', student: null });
      } else {
        if (results.length > 0) {
          const student = results[0]; // Get the first student from the results (assuming enrollment is unique)
          res.render('updatestudent', { username: 'Admin', student: student });
        } else {
          res.render('updatestudent', { username: 'Admin', student: null });
        }
      }
    });
  };
  
  
  exports.updateStudentDetails = (req, res) => {
    const { enrollment, name, phone, parentphone, room, zipcode, city, state, address } = req.body;
  
    db.query(
      'UPDATE students SET name = ?, phone = ?, parentphone = ?, room = ?, zipcode = ?, city = ?, state = ?, address = ? WHERE enrollment = ?',
      [name, phone, parentphone, room, zipcode, city, state, address, enrollment],
      (err, results) => {
        if (err) {
          console.log(err);
          return res.status(500).send('Internal Server Error');
        }else{
            db.query(
                'UPDATE attendance SET name = ? ,room = ? WHERE enrollment = ?',
                [name, room, enrollment],
                (err, results) => {
                  if (err) {
                    console.log(err);
                    return res.status(500).send('Internal Server Error');
                  }
        
                  return res.send("<script>alert('Student details updated successfully!'); window.location.href = '/admin/updatestud';</script>");
                }
              );

        }        
      }
    );
  };
  

  
exports.publishnotice = (req, res) => {
    console.log(req.body);
    
    // Get the current date
    const currentDate = new Date();

    const { heading,nbody } = req.body;
    db.query('INSERT INTO notices SET ?', { heading: heading, nbody:nbody, created_at:currentDate }, (err, results) => {
        if (err) {
            console.log(err);
        } else {
            return res.send("<script>alert('Notice Published!'); window.location.href = '/admin';</script>");
        }
    })
    
}

exports.regstaff = async (req, res) => {
    const { username,name,phone} = req.body;
    const password = username + '@' + phone;
  
      let hashedPassword = await bcrypt.hash(password, 8);
            db.query('INSERT INTO staff SET ?', { username:username, name: name, phone: phone, password: hashedPassword }, (err, results) => {
                if (err) {
                    console.log(err);
                } else {
                    return res.send("<script>alert('Staff Registered Successfully!'); window.location.href = '/admin';</script>");
                }
            })
           
}

exports.regward = async (req, res) => {
    const { username,name,phone} = req.body;
    const password = username + '@' + phone;
  
      let hashedPassword = await bcrypt.hash(password, 8);
            db.query('INSERT INTO warden SET ?', { username:username, name: name, phone: phone, password: hashedPassword }, (err, results) => {
                if (err) {
                    console.log(err);
                } else {
                    return res.send("<script>alert('Warden Registered Successfully!'); window.location.href = '/admin';</script>");
                }
            })
           
}

exports.adminChangePass = async (req, res) => {
    try {
        const { opass, npass, cnpass } = req.body;

        // Retrieve the logged-in user's username from the JWT token
         const decoded = await promisify(jwt.verify)(req.cookies.userSave,
            process.env.JWT_SECRET
        );

        // Perform the password change in the database
        db.query('SELECT * FROM adminlog WHERE username = ?', [decoded.username], async (err, results) => {
            if (err) {
                console.log(err);
                return res.status(500).send("Internal Server Error");
            }

            if (results.length === 0) {
                return res.send("<script>alert('User not found!'); window.location.href = '/';</script>"); 
                
            }

            const user = results[0];

            // Check if the old password matches the stored password
            const passwordMatches = await bcrypt.compare(opass, user.password);

            if (!passwordMatches) {
                return res.send("<script>alert('Incorrect old password'); </script>"); 
                
            }

            // Check if new password and confirm new password match
            if (npass !== cnpass) {
                return res.send("<script>alert('New password and confirm new password do not match'); </script>"); 
                
            }

            // Hash the new password
            const hashedPassword = await bcrypt.hash(npass, 8);
            console.log(hashedPassword);

            // Update the password in the database
            db.query('UPDATE adminlog SET password = ? WHERE username = ?', [hashedPassword, decoded.username], (err, results) => {
                if (err) {
                    console.log(err);
                    return res.status(500).send("Internal Server Error");
                }

                return res.send("<script>alert('Password changed successfully!'); window.location.href = '/';</script>"); 

                
            });
        });
    } catch (err) {
        console.log(err);
        return res.status(401).send("Unauthorized");
    }
};


exports.adminlogout = (req, res) => {
    res.cookie(userSave, 'logout', {
        expires: new Date(Date.now() + 2 * 1000),
        httpOnly: true
    });
    res.status(200).redirect("/");
}