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

exports.wardenlogin = async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).sendFile(path.resolve(__dirname, "../public/wardenlog.html"), {
                message: "Please provide a username and password"
            });
        }
        db.query('SELECT * FROM warden WHERE username = ?', [username], async (err, results) => {
            if (!results || results.length === 0 || !await bcrypt.compare(password, results[0].password)) {
                return res.send("<script>alert('Username or password is incorrect'); window.location.href = '/wardlog';</script>");
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

                userSave = "warden" + username; // Assign the value to the global variable
                res.cookie(userSave, token, cookieOptions);
                res.status(200).redirect("/ward");
            }
        });
    } catch (err) {
        console.log(err);
    }
}

exports.wardenisLoggedIn = async (req, res, next) => {
    if (req.cookies[userSave]) { // Access the global variable here
        try {
            const decoded = await promisify(jwt.verify)(req.cookies[userSave], process.env.JWT_SECRET);
    
            db.query('SELECT * FROM warden WHERE username = ?', [decoded.username], (err, results) => {
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


exports.publishnotice = (req, res) => {
    console.log(req.body);
    
    // Get the current date
    const currentDate = new Date();

    const { heading,nbody } = req.body;
    db.query('INSERT INTO notices SET ?', { heading: heading, nbody:nbody, created_at:currentDate }, (err, results) => {
        if (err) {
            console.log(err);
        } else {
            return res.send("<script>alert('Notice Published!'); window.location.href = '/ward';</script>");
        }
    })
    
}


exports.wardenChangePass = async (req, res) => {
    try {
        const { opass, npass, cnpass } = req.body;

        // Retrieve the logged-in user's username from the JWT token
         const decoded = await promisify(jwt.verify)(req.cookies[userSave],
            process.env.JWT_SECRET
        );

        // Perform the password change in the database
        db.query('SELECT * FROM warden WHERE username = ?', [decoded.username], async (err, results) => {
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
            db.query('UPDATE warden SET password = ? WHERE username = ?', [hashedPassword, decoded.username], (err, results) => {
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


exports.wardenlogout = (req, res) => {
    res.cookie(userSave, 'logout', { // Use the correct `userSave` value here
        expires: new Date(Date.now() + 2 * 1000),
        httpOnly: true
    });
    res.status(200).redirect("/");
}