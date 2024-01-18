exports.processLeave = (req, res) => {
    // Handle form submission and file upload
    const { name, from_date, to_date, zipcode, city, state, address, reason, no_of_days } = req.body;
    const imageFile = req.files.image;
  
    // Generate a unique filename for the uploaded image
    const imageFileName = `${Date.now()}-${imageFile.name}`;
  
    // Save the image file to the designated folder
    imageFile.mv(path.join(__dirname, "public", "images", imageFileName), err => {
      if (err) {
        console.error(err);
        return res.status(500).send("Failed to upload image");
      }
  
      // Store the form data in the database
      db.query(
        "INSERT INTO leave_applications (username, name, room_no, from_date, to_date, zipcode, city, state, address, reason, no_of_days, image_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [username, name, room_no, from_date, to_date, zipcode, city, state, address, reason, no_of_days, imageFileName],
        (err, result) => {
          if (err) {
            console.error(err);
            return res.status(500).send("Failed to store leave application");
          }
          res.status(200).send("Leave application stored successfully");
        }
      );
    });
  };

  if (req.cookies[userSave]) {
    try {
        const {name, from_date, to_date, zipcode, city, state, address, reason, no_of_days } = req.body;
        const imageFile = req.files.image;

        // Generate a unique filename for the uploaded image
        const imageFileName = `${Date.now()}-${imageFile.name}`;
        
        

        const decoded = await promisify(jwt.verify)(req.cookies[userSave], process.env.JWT_SECRET);
        console.log(decoded); 
        

        // Retrieve the 'room' value from the 'students' table based on 'enrollment'
        db.query('SELECT room FROM students WHERE enrollment = ?', [decoded.enrollment], (err, results) => {
            if (err) {
                console.log(err);
            } 
        });

    } catch (err) {
        console.log(err);
    }
} else {
    next();
}