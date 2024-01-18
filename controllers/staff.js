const mysql = require("mysql");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { promisify } = require("util");
const path=require('path');
// const mailsender= require("./mailsender");

const db = mysql.createConnection({
    host: process.env.HOST,
    user: process.env.DATABASE_USER,
    password: process.env.PASSWORD,
    database: process.env.DATABASE
});

let userSave;

exports.stafflogin = async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).sendFile(path.resolve(__dirname, "../public/stafflog.html"), {
                message: "Please provide a username and password"
            });
        }
        db.query('SELECT * FROM staff WHERE username = ?', [username], async (err, results) => {
            if (!results || results.length === 0 || !await bcrypt.compare(password, results[0].password)) {
                return res.send("<script>alert('Username or password is incorrect'); window.location.href = '/stafflog';</script>");
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

                userSave = "staff" + username; // Assign the value to the global variable
                res.cookie(userSave, token, cookieOptions);
                res.status(200).redirect("/staff");
            }
        });
    } catch (err) {
        console.log(err);
    }
}

exports.staffisLoggedIn = async (req, res, next) => {
    if (req.cookies[userSave]) { // Access the global variable here
        try {
            const decoded = await promisify(jwt.verify)(req.cookies[userSave], process.env.JWT_SECRET);
    
            db.query('SELECT * FROM staff WHERE username = ?', [decoded.username], (err, results) => {
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

exports.markattendance = async (req, res) => {
    try {
      const currentDate = new Date().toLocaleDateString('en-GB'); // Get current date in DD-MM-YY format
      const attendanceData = req.body;
  
      // Step 1: Alter table to add column with current date heading and set 'A' as the default value
      const alterQuery = `ALTER TABLE attendance ADD COLUMN \`${currentDate}\` VARCHAR(255) DEFAULT 'A'`;
  
      db.query(alterQuery, (alterError) => {
        if (alterError) {
          console.error('Error altering table:', alterError);
          return res.send("<script>alert('Attendance Already Marked!'); window.location.href = '/staff';</script>");
        }
  
        // Step 2: Insert attendance values into the new column
        const insertQueries = [];
  
        for (const enrollment in attendanceData) {
          if (enrollment.startsWith('attendance[')) {
            const isChecked = attendanceData[enrollment] === 'present' ? 'P' : 'A';
            const studentEnrollment = enrollment.substring(11, enrollment.length - 1);
  
            const insertQuery = `UPDATE attendance SET \`${currentDate}\` = '${isChecked}' WHERE enrollment = '${studentEnrollment}'`;
            insertQueries.push(insertQuery);
          }
        }
  
        // Execute all insert queries
        insertQueries.forEach((query) => {
          db.query(query, (insertError) => {
            if (insertError) {
              console.error('Error inserting attendance:', insertError);
            }
          });
        });
  
        res.send("<script>alert('Attendance Marked!'); window.location.href = '/staff';</script>");
      });
    } catch (err) {
      console.log(err);
      return res.status(401).send('Unauthorized');
    }
  };
  
  
  
  


exports.staffChangePass = async (req, res) => {
    try {
        const { opass, npass, cnpass } = req.body;

        // Retrieve the logged-in user's username from the JWT token
         const decoded = await promisify(jwt.verify)(req.cookies[userSave],
            process.env.JWT_SECRET
        );

        // Perform the password change in the database
        db.query('SELECT * FROM staff WHERE username = ?', [decoded.username], async (err, results) => {
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
            db.query('UPDATE staff SET password = ? WHERE username = ?', [hashedPassword, decoded.username], (err, results) => {
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


exports.stafflogout = (req, res) => {
    res.cookie(userSave, 'logout', { // Use the correct `userSave` value here
        expires: new Date(Date.now() + 2 * 1000),
        httpOnly: true
    });
    res.status(200).redirect("/");
}