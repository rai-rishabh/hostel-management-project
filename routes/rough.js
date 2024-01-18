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
            db.query('UPDATE adminlog SET password = ? WHERE username = ?', [hashedPassword, loggedInUsername], (err, results) => {
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
