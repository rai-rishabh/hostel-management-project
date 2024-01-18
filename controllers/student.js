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

exports.studentlogin = async (req, res) => {
    try {
        const { enrollment, password } = req.body;
        if (!enrollment || !password) {
            return res.status(400).sendFile(path.resolve(__dirname, "../public/studentlog.html"), {
                message: "Please provide a enrollment and password"
            });
        }
        db.query('SELECT * FROM students WHERE enrollment = ?', [enrollment], async (err, results) => {
            if (!results || results.length === 0 || !await bcrypt.compare(password, results[0].password)) {
                return res.send("<script>alert('enrollment or password is incorrect'); window.location.href = '/stud';</script>");
            } else {
                const enrollment = results[0].enrollment;

                const token = jwt.sign({ enrollment }, process.env.JWT_SECRET, {
                    expiresIn: 7776000
                });

                console.log("The token is " + token);

                const cookieOptions = {
                    expires: new Date(
                        Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000
                    ),
                    httpOnly: true
                };

                userSave = "student" + enrollment; // Assign the value to the global variable
                res.cookie(userSave, token, cookieOptions);
                res.status(200).redirect("/stud");
            }
        });
    } catch (err) {
        console.log(err);
    }
}

exports.studentisLoggedIn = async (req, res, next) => {
    if (req.cookies[userSave]) { // Access the global variable here
        try {
            const decoded = await promisify(jwt.verify)(req.cookies[userSave], process.env.JWT_SECRET);
    
            db.query('SELECT * FROM students WHERE enrollment = ?', [decoded.enrollment], (err, results) => {
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

exports.processLeave = async (req, res) => {
    if (req.cookies[userSave]){
    try {
      const { from_date, to_date, zipcode, city, state, address, reason, image } = req.body;
  
      // Get the username from the decoded token
      const decoded = await promisify(jwt.verify)(req.cookies.userSave, process.env.JWT_SECRET);
      const username = decoded.enrollment;
  
      // Fetch the room number from the database
      db.query('SELECT * FROM students WHERE enrollment = ?', [username], async (err, results) => {
        if (!results || results.length === 0) {
          return res.status(401).send("User not found");
        }
  
        const { room, name } = results[0];
  
        // Handle file upload
        const imageFile = req.files.image;
        const imageFileName = `${Date.now()}-${imageFile.name}`;
        await imageFile.mv(path.join(__dirname, "public", "images", imageFileName));
  
        // Store the form data in the database
        db.query(
          "INSERT INTO leave_applications (username, name, room_no, from_date, to_date, zipcode, city, state, address, reason, image_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [username, name, room, from_date, to_date, zipcode, city, state, address, reason, imageFileName],
          (err, result) => {
            if (err) {
              console.error(err);
              return res.status(500).send("Failed to store leave application");
            }
            res.status(200).send("Leave application stored successfully");
          }
        );
      });
    } catch (err) {
      console.error(err);
      res.status(500).send("Failed to process leave application");
    }
    }
  };
  


exports.requestmaintenance = async (req, res, next) => {
    if (req.cookies[userSave]) {
        try {
            console.log(req.body);
            const currentDate = new Date().toLocaleDateString('en-GB'); // Get current date in DD-MM-YY format
            
            const decoded = await promisify(jwt.verify)(req.cookies[userSave], process.env.JWT_SECRET);
            console.log(decoded);
            
            const { mreq } = req.body;

            // Retrieve the 'room' value from the 'students' table based on 'enrollment'
            db.query('SELECT room FROM students WHERE enrollment = ?', [decoded.enrollment], (err, results) => {
                if (err) {
                    console.log(err);
                } else {
                    const room = results[0].room; // Assuming there is only one row with the given enrollment
                    // Insert the data into the 'maintenance' table
                    db.query('INSERT INTO maintenance SET ?', {
                        enrollment: decoded.enrollment,
                        room: room,
                        request_for: mreq                        
                    }, (err, results) => {
                        if (err) {
                            console.log(err);
                        } else {
                            return res.send("<script>alert('Requested'); window.location.href = '/stud';</script>");
                        }
                    });
                }
            });
        } catch (err) {
            console.log(err);
        }
    } else {
        next();
    }
};



exports.studentChangePass = async (req, res) => {
    try {
        const { opass, npass, cnpass } = req.body;

        // Retrieve the logged-in user's enrollment from the JWT token
         const decoded = await promisify(jwt.verify)(req.cookies[userSave],
            process.env.JWT_SECRET
        );

        // Perform the password change in the database
        db.query('SELECT * FROM students WHERE enrollment = ?', [decoded.enrollment], async (err, results) => {
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
            db.query('UPDATE students SET password = ? WHERE enrollment = ?', [hashedPassword, decoded.enrollment], (err, results) => {
                if (err) {
                    console.log(err);
                    return res.status(500).send("Internal Server Error");
                }

                return res.send("<script>alert('Password changed successfully!'); window.location.href = '/stud';</script>"); 

                
            });
        });
    } catch (err) {
        console.log(err);
        return res.status(401).send("Unauthorized");
    }
};


exports.studentlogout = (req, res) => {
    res.cookie(userSave, 'logout', { // Use the correct `userSave` value here
        expires: new Date(Date.now() + 2 * 1000),
        httpOnly: true
    });
    res.status(200).redirect("/");
}