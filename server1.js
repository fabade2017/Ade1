// Import dependencies
const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const cors = require('cors');
const crypto = require('crypto');
 const nodemailer = require('nodemailer');
// const { randomInt } = require('crypto');

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

// Database connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect(err => {
    if (err) {
        console.error('Database connection failed:', err);
    } else {
        console.log('Connected to MySQL database');
    }
});
// Middleware to protect routes
const authenticate = (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) return res.json({ error: 'Access denied' });

    try {
        const decoded = jwt.verify(token.split(' ')[1], JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.json({ error: 'Invalid token' });
    }
}; // User registration
// JWT secret
const JWT_SECRET = process.env.JWT_SECRET;

// User login
            // app.post('/usersms/login', (req, res) => {
            //     const { email, password } = req.body;
            
            //     db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
            //         if (err) return res.json({ error: err.message });
                    
            //         if (results.length === 0) return res.json({ error: 'Invalid email or password' });
            
            //         const user = results[0];
            //         const passwordMatch = await bcrypt.compare(password, user.password);
            //         if (!passwordMatch) return res.json({ error: 'Invalid email or password' });
            
            //         const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
            //         res.json({ token });
            //     });
            // });
            
            app.post('/usersms/login', (req, res) => {
    const { email, password } = req.body;
 // return res.json({ status: "error", message: "Invalid credentials" });
    db.query(
        'SELECT id, password, verified FROM users WHERE email = ?',
        [email],
        async (err, results) => {
            if (err) return res.json({ status: "error", message: "err.message" });

            if (results.length === 0) {
                return res.json({ status: "error", message: "User not found" });
            }

            const user = results[0];
            
            // Check if user is verified
            if (!user.verified) {
                return res.json({ status: "error", message: "Please verify your email before logging in"});
            }

            // Validate password
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.json({ status: "error", message: "Invalid credentials" });
            }

            // Generate JWT token
           // const token = jwt.sign({ id: user.id, email }, 'your-secret-key', { expiresIn: '1h' });
            const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
            return  res.json({ token , user_id :user.id });
        }
    );
});

// Fetch all institutions
// app.get('/usersms/institutions', (req, res) => {
//     db.query('SELECT id, name, type, location FROM institutions', (err, results) => {
//         if (err) return res.json({ error: err.message });
//         res.json(results);
//     });
// });

app.get('/usersms/institutions', (req, res) => {
    let { page, limit } = req.query;

    // Set default values if not provided
    page = parseInt(page) || 1;  // Default to page 1
    limit = parseInt(limit) || 10; // Default to 10 records per page
    const offset = (page - 1) * limit;

    // Query to fetch institutions with pagination
    db.query(
        'SELECT id, name, type, location FROM institutions LIMIT ? OFFSET ?',
        [limit, offset],
        (err, results) => {
            if (err) return res.json({ error: err.message });

            // Query total count for pagination metadata
            db.query('SELECT COUNT(*) AS total FROM institutions', (err, countResult) => {
                if (err) return res.json({ error: err.message });

                const totalRecords = countResult[0].total;
                const totalPages = Math.ceil(totalRecords / limit);

                res.json({
                    currentPage: page,
                    totalPages: totalPages,
                    totalRecords: totalRecords,
                    data: results
                });
            });
        }
    );
});
app.post('/usersms/institutions', (req, res) => {
    const { name, type, location } = req.body;
   // console.log('Bing');
    const query = 'INSERT INTO institutions (id, name, type, location, created_at, updated_at) VALUES (UUID(), ?, ?, ?, NOW(), NOW())';
    
    db.query(query, [name, type, location], (err, result) => {
        if (err) return res.json({ error: err.message });
        res.json({ message: 'Institution created successfully', id: result.insertId });
    });
});
app.put('/usersms/institutions/:id', (req, res) => {
    const { id } = req.params;
    const { name, type, location } = req.body;
    const query = 'UPDATE institutions SET name = ?, type = ?, location = ?, updated_at = NOW() WHERE id = ?';
    
    db.query(query, [name, type, location, id], (err, result) => {
        if (err) return res.json({ error: err.message });
        if (result.affectedRows === 0) return res.json({ message: 'Institution not found' });
        res.json({ message: 'Institution updated successfully' });
    });
});
 
// app.post('/usersms/institutions_type/:type', (req, res) => {
//     const { type } = req.params;
//     const query = 'SELECT name, type, location FROM institutions WHERE type = ?';
    
//     db.query(query, [type], (err, result) => {
//         if (err) return res.json({ error: err.message });
//         res.json({ message: 'Institutions fetched successfully' });
//     });
// });

app.get('/usersms/institutions_type/:type', (req, res) => {
    const { type } = req.params;
    const query = 'SELECT id, name, type, location FROM institutions WHERE type = ? order by location,  name';
    
    db.query(query, [type], (err, result) => {
        if (err) return res.json({ error: err.message });
        res.json({ message: 'Institutions fetched successfully', data: result });
    });
});

app.delete('/usersms/institutions/:id', (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM institutions WHERE id = ?';
    
    db.query(query, [id], (err, result) => {
        if (err) return res.json({ error: err.message });
        if (result.affectedRows === 0) return res.json({ message: 'Institution not found' });
        res.json({ message: 'Institution deleted successfully' });
    });
});




// Fetch users with filtering
app.get('/usersms/users', (req, res) => {
    let { role, institution_id } = req.query;
    let query = 'SELECT id, name, email, role, institution_id FROM users WHERE 1=1';
    let params = [];

    if (role) {
        query += ' AND role = ?';
        params.push(role);
    }
    if (institution_id) {
        query += ' AND institution_id = ?';
        params.push(institution_id);
    }

    db.query(query, params, (err, results) => {
        if (err) return res.json({ error: err.message });
        res.json(results);
    });
});


// Change password
app.post('/usersms/change-password', authenticate, async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    db.query('SELECT password FROM users WHERE id = ?', [req.user.id], async (err, results) => {
        if (err) return res.json({ error: err.message });
        if (results.length === 0) return res.json({ error: 'User not found' });

        const passwordMatch = await bcrypt.compare(oldPassword, results[0].password);
        if (!passwordMatch) return res.json({ error: 'Incorrect old password' });

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.user.id], (err) => {
            if (err) return res.json({ error: err.message });
            res.json({ message: 'Password updated successfully' });
        });
    });
});
app.get('/usersms/users/profile', authenticate, (req, res) => {
    db.query(
        //'SELECT users.name, users.email, users.role, institutions.name AS institution FROM users JOIN institutions ON users.institution_id = institutions.id WHERE users.id = ?',

        'SELECT users.name, users.email, users.role, institutions.name AS institution FROM users JOIN institutions ON users.institution_id = institutions.id limit 1',
        [req.user.id],
        (err, results) => {
            if (err) return res.json({ error: err.message });
            if (results.length === 0) return res.json({ message: 'User not found' });
            res.json(results[0]);
        }
    );
});
// Forgot password (request reset)
app.post('/usersms/forgot-password', (req, res) => {
    const { email } = req.body;
    

const token = crypto.randomInt(10000, 999999);
   // const token = crypto.randomBytes(4).toString('hex');
    const expires = new Date(Date.now() + 3600000); // 1 hour expiry

    db.query('UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE email = ?', [token, expires, email], (err, results) => {
        if (err) return res.json({ error: err.message });
        if (results.affectedRows === 0) return res.json({ error: 'Email not found' });
  const transporter = nodemailer.createTransport({
                service: 'Gmail',
                auth: { user: 'fabade2017@gmail.com', pass: 'mixpyxrlcjbhcvxz' } //user: 'adeolu.emmanuel80@gmail.com', pass: 'Theone007@@'
            });

            const resetLink = `https://institutionconnect.com/usersms/reset-password/${token}`;
transporter.sendMail({
                 from: 'support@instituteconnect.com', 
                to: email,
                subject: 'Reset Password',
                html: `<p>Please Change your password by entering the valid code "${token}" and your new password. This link expires in 1 hr.</p>`
            });

        res.json({ message: 'Password reset link sent' });
    });
});

// Reset password
app.post('/usersms/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;
    
    db.query('SELECT id FROM users WHERE reset_token = ?', [token], async (err, results) => {   //AND reset_token_expires > NOW()
        if (err) return res.json({ error: err.message });
        if (results.length === 0) return res.json({ error: 'Invalid or expired token' });

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        db.query('UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?', [hashedPassword, results[0].id], (err) => {
            if (err) return res.json({ error: err.message });
            res.json({ message: 'Password reset successful' });
        });
    });
});

// Reset password
app.post('/usersms/validate-reset-password', async (req, res) => {
    const { token, email} = req.body;
    
    db.query('SELECT id FROM users WHERE reset_token = ? and email = ?', [token, email], async (err, results) => {   //AND reset_token_expires > NOW()
        if (err) return res.json({ error: err.message });
        if (results.length === 0) return res.json({ error: 'Invalid or expired token or Invalid email' });
        if (results.length === 1) return res.json({ message: 'Valid' });
        // const hashedPassword = await bcrypt.hash(newPassword, 10);
        // db.query('UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?', [hashedPassword, results[0].id], (err) => {
        //     if (err) return res.json({ error: err.message });
        //     res.json({ message: 'Password reset successful' });
        // });
    });
});

// Fetch statistics for dashboard
app.get('/usersms/stats', (req, res) => {
    const userQuery = `
        SELECT 
            SUM(CASE WHEN role = 'student' THEN 1 ELSE 0 END) AS students,
            SUM(CASE WHEN role = 'lecturer' THEN 1 ELSE 0 END) AS lecturers,
            SUM(CASE WHEN role = 'institution_admin' THEN 1 ELSE 0 END) AS admins
        FROM users;
    `;

    const institutionQuery = `
        SELECT 
            SUM(CASE WHEN type = 'university' THEN 1 ELSE 0 END) AS universities,
            SUM(CASE WHEN type = 'company' THEN 1 ELSE 0 END) AS companies
        FROM institutions;
    `;

    db.query(userQuery, (userErr, userResults) => {
        if (userErr) return res.json({ error: userErr.message });

        db.query(institutionQuery, (instErr, instResults) => {
            if (instErr) return res.json({ error: instErr.message });

            res.json({
                students: userResults[0].students,
                lecturers: userResults[0].lecturers,
                admins: userResults[0].admins,
                universities: instResults[0].universities,
                companies: instResults[0].companies
            });
        });
    });
});

// Interests Post
app.post('/usersms/interests', authenticate, (req, res) => {
    const { interests } = req.body; // Array of interests
    const userId = req.user.id;

    if (!Array.isArray(interests) || interests.length === 0) {
        return res.json({ error: 'Interests must be a non-empty array' });
    }

    const query = 'INSERT INTO interests (id, user_id, interest) VALUES ?';
    const values = interests.map(interest => [crypto.randomUUID(), userId, interest]);

    db.query(query, [values], (err, result) => {
        if (err) return res.json({ error: err.message });
        res.json({ message: 'Interests added successfully' });
    });
});

// Interests fetch user with interest
app.get('/usersms/users/profiler', authenticate, (req, res) => {
    const userId = req.user.id;

    const userQuery = `
        SELECT users.id, users.name, users.email, users.role, institutions.name AS institution,  departments.departmentName, users.profile_image
        FROM users 
        Left JOIN institutions ON users.institution_id = institutions.id 
         Left join departments ON users.department_id = departments.departmentID
        WHERE users.id = ?
    `;

    const interestsQuery = 'SELECT interest FROM interests WHERE user_id = ?';

    db.query(userQuery, [userId], (err, userResults) => {
        if (err) return res.json({ error: err.message });
        if (userResults.length === 0) return res.json({ message: 'User not found' });

        db.query(interestsQuery, [userId], (intErr, interestResults) => {
            if (intErr) return res.json({ error: intErr.message });

            const interests = interestResults.map(row => row.interest);
            res.json({ ...userResults[0], interests });
        });
    });
});

//   Interests fetch users with interest with array id authenticate, 
app.post('/usersms/users/profilegroup',(req, res) => {
    const userIds = req.body.user_ids; // Expecting an array of string user IDs

    if (!Array.isArray(userIds) || userIds.length === 0) {
        return res.json({ error: 'Invalid user_ids array' });
    }

    const placeholders = userIds.map(() => '?').join(', ');

    const userQuery = `
        SELECT users.id, users.name, users.email, users.role, institutions.name AS institution , departments.departmentName, users.profile_image 
        FROM users 
        LEFT JOIN institutions ON users.institution_id = institutions.id 
        LeFT join departments ON users.department_id = departments.departmentID
        WHERE users.id IN (${placeholders})
    `;
    console.log(userQuery);
    const interestsQuery = `SELECT user_id, interest FROM interests WHERE user_id IN (${placeholders})`;

    db.query(userQuery, userIds, (err, userResults) => {
        if (err) return res.json({ error: err.message });

        if (userResults.length === 0) return res.json({ message: 'Users not found' });
  
        db.query(interestsQuery, userIds, (intErr, interestResults) => {
            if (intErr) return res.json({ error: intErr.message });

            const interestsMap = interestResults.reduce((acc, row) => {
                if (!acc[row.user_id]) acc[row.user_id] = [];
                acc[row.user_id].push(row.interest);
                return acc;
            }, {});

            const users = userResults.map(user => ({
                ...user,
                interests: interestsMap[user.id] || []
            }));

            res.json(users);
        });
});
});

//
// Interests fetch user with interest    
app.get('/usersms/users/profilers', authenticate, (req, res) => {
    const userId = "req.user.id";

    const userQuery = `
        SELECT users.id, users.name, users.email, users.role, institutions.name,departments.departmentName  AS institution 
        FROM users 
        JOIN institutions ON users.institution_id = institutions.id 
        LeFT join departments ON users.department_id = departments.departmentID
    `;

    const interestsQuery = 'SELECT interest FROM interests';

    db.query(userQuery, [userId], (err, userResults) => {
        if (err) return res.json({ error: err.message });
        if (userResults.length === 0) return res.json({ message: 'User not found' });

        db.query(interestsQuery, [userId], (intErr, interestResults) => {
            if (intErr) return res.json({ error: intErr.message });

            const interests = interestResults.map(row => row.interest);
            res.json({ ...userResults[0], interests });
        });
    });
});
// Interests Post
app.get('/usersms/users/:id/interests', (req, res) => {
    const { id } = req.params;
    
    db.query('SELECT interest FROM interests WHERE user_id = ?', [id], (err, results) => {
        if (err) return res.json({ error: err.message });
        res.json(results.map(row => row.interest));
    });
});

// Interests Update
app.put('/interests', authenticate, (req, res) => {
    const { interests } = req.body;
    const userId = req.user.id;

    if (!Array.isArray(interests) || interests.length === 0) {
        return res.json({ error: 'Interests must be a non-empty array' });
    }

    db.query('DELETE FROM interests WHERE user_id = ?', [userId], (err) => {
        if (err) return res.json({ error: err.message }); 

        const query = 'INSERT INTO interests (id, user_id, interest) VALUES ?';
        const values = interests.map(interest => [crypto.randomUUID(), userId, interest]);

        db.query(query, [values], (insertErr) => {
            if (insertErr) return res.json({ error: insertErr.message });
            res.json({ message: 'Interests updated successfully' });
        });
    });
});
// Validate token

app.post('/usersms/validate-token', (req, res) => {
    const { token, email } = req.body;

    if (!token) {
        return res.json({ status: "error", message: "Token is required" });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
     //   console.log("Decoded Token:", decoded); // Debugging step
     //   return res.json({ status: "error", message: decoded });
        // Fetch user details from the database
        db.query('SELECT users.id, users.name AS full_name, email, role, institutions.name, department_id,profile_image FROM users left join institutions on users.institution_id = institutions.id WHERE users.id =? and user.email =?', [decoded.id, email], (err, results) => {
            if (err) return res.json({ status: "error", message: decoded });
    
 //console.log("Query Results:", results); // Debugging step
            if (results.length === 0) {
                
                return res.json({ status: "error", message: "User not found " });
            }

            const user = results[0];
//return res.json({ status: user, message: decoded });
            res.json({
                status: "success",
                message: "Token is valid",
                data: {
                    id: user.id,
                    full_name: user.full_name,
                    email: user.email,
                    role: user.role,
                    institution: user.name,
                    expires_at: new Date(decoded.exp * 1000).toISOString()
                }
            });
        });
    } catch (error) {
        res.json({ status: "error", message: "Invalid or expired token" });
    }
});



// Interests Update 
app.delete('/interests/:interest', authenticate, (req, res) => {
    const { interest } = req.params;
    const userId = req.user.id;

    db.query('DELETE FROM interests WHERE user_id = ? AND interest = ?', [userId, interest], (err, result) => {
        if (err) return res.json({ error: err.message });
        if (result.affectedRows === 0) return res.json({ message: 'Interest not found' });
        res.json({ message: 'Interest deleted successfully' });
    });
});
// Logout (handled client-side by removing token)
app.post('/usersms/logout', (req, res) => {
    res.json({ message: 'Logout successful' });
});

app.post('/usersms/register', async (req, res) => {
    const { name, email, password, role, institution_id, department_id } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    // Generate verification token
    const verificationToken = crypto.randomBytes(4).toString('hex');
    db.query(
        'INSERT INTO users (id, name, email, password, role, institution_id,  verification_token, verified, created_at, updated_at, department_id, profile_image) VALUES (UUID(), ?, ?, ?, ?, ?,?,?,?,?, NOW(), NOW())',
        [name, email, hashedPassword, role, institution_id, verificationToken, false, department_id, null],
        (err, results) => {
            if (err) return res.json({ error: err.message });
            
               // Send verification email
            const transporter = nodemailer.createTransport({
                service: 'Gmail',
                auth: { user: 'fabade2017@gmail.com', pass: 'mixpyxrlcjbhcvxz' } //user: 'adeolu.emmanuel80@gmail.com', pass: 'Theone007@@'
            });

            const verificationLink = `https://institutionconnect.com/usersms/verify-email/${verificationToken}`;

            transporter.sendMail({
                 from: 'support@instituteconnect.com', 
                to: email,
                subject: 'Verify Your Email',
                html: `<p>Please verify your email by entering the code "${verificationLink}">.</p>`
            });



            res.json({ message: 'User registered successfully' });
        });
});


// router.post('/usersms/verify-email', async (req, res) => {
//     try {
//         const { token } = req.body;

//         if (!token) {
//             return res.json({ status: "error", message: "Token is required" });
//         }

//         // Find user by verification token
//         const user = await User.findOne({ where: { verification_token: token } });

//         if (!user) {
//             return res.json({ status: "error", message: "Invalid or expired token" });
//         }

//         // Update user as verified
//         user.verified = true;
//         user.verification_token = null; // Clear the token after verification
//         await user.save();

//         return res.status(200).json({ status: "success", message: "Email verified successfully" });

//     } catch (error) {
//         console.error(error);
//         return res.json({ status: "error", message: "Server error" });
//     }
// });


// app.get('/usersms/resetverify-email', (req, res) => {
//     const { token } = req.query; 

//     if (!token) {
//         return res.json({ status: "error", message: "Token is required" });
//     }

//     db.query('SELECT id FROM users WHERE reset_token = ? AND reset_token_expires > NOW()', [token], (err, results) => {
//         if (err) return res.json({ status: "error", message: err.message });
        
//         if (results.length === 0) {
//             return res.json({ status: "error", message: "Invalid or expired token" });
//         }

//         res.json({ status: "success", message: "Email verified successfully" });
//     });
// });

app.post('/usersms/verify-email', (req, res) => {
                const { token, email } = req.params;
            
                if (!token) {
                    return res.json({ status: "error", message: "Token is required" });
                }
            
                db.query(
                    'SELECT id FROM users WHERE verification_token = ? and email= ?',
                    [token, email],
                    (err, results) => {
                        if (err) return res.json({ status: "error", message: err.message });
            
                        if (results.length === 0) {
                            return res.json({ status: "error", message: "Invalid or expired token" });
                        }
            
                        // Update user as verified
                        db.query(
                            'UPDATE users SET verified = ?, verification_token = NULL, updated_at = NOW() WHERE verification_token = ?',
                            [true, token],
                            (err, updateResults) => {
                                if (err) return res.json({ status: "error", message: err.message });
            
                                res.status(200).json({ status: "success", message: "Email verified successfully" });
                            }
                        );
                    }
                );
             });

app.post('/usersms/resend-verification', (req, res) =>  {
  
    const { email } = req.body;    
    db.query(
        'SELECT id, verified, verification_token FROM users WHERE email  = ?',
        [email],
        async (err, results) => {
            
      //   return res.status(800).json({ status: "error", message:  err.message });
            if (err) return res.json({ status: "error", message: err.message });

            if (results.length === 0) {
                return res.json({ status: "error", message: "User not found" });
            }

            const user = results[0];

            if (user.verified) {
                return res.json({ status: "error", message: "User is already verified" });
            }

            // Generate a new token
            const verificationToken = crypto.randomBytes(4).toString('hex'); 
            
//  return res.json({ status: "error", message:  "so natural" });
            db.query(
                'UPDATE users SET verification_token = ?, updated_at = NOW() WHERE id =?', 
                [verificationToken, user.id],
                async (err, updateResults) => {
                    

                    if (err) return res.json({ status: "error", message: 'err.message' });
                 //   return res.json({ status: "not111DDD", message:  "so natural" });
                    // Resend email
                         const transporter = nodemailer.createTransport({
                            service: 'Gmail',
                            auth: { user: 'fabade2017@gmail.com', pass: 'mixpyxrlcjbhcvxz' }  
                        });
                        
                       

                        transporter.verify((error, success) => {
                                if (error) {
                                    console.error('Transporter error:', error);
                                } else {
                                    console.log('Mail server is ready to send emails!');
                                }
                            });

                    const verificationLink = `https://institutionconnect.com/usersms/verify-email/${verificationToken}`; 

                    await transporter.sendMail({ 
                        from: 'support@instituteconnect.com', 
                        to: email,
                        subject: 'Verify Your Email',
                        html: `<p>Please verify your email by entering the verification code <b>"${verificationToken}"</b>.</p>`
                    });
//html: `<p>Please verify your email by entering the verification code <b> </b> clicking <a href="${verificationLink}">here</a>.</p>`
                  return  res.json({ message: "Verification email sent successfully" }); 
                }
            );
        }
    );
});


app.post('/usersms/departments', (req, res) => {
    const { DepartmentName, InstitutionType, CoursesOffered, faculty_id } = req.body;

    db.query(
        'INSERT INTO departments (DepartmentID, DepartmentName, InstitutionType, CoursesOffered, faculty_id) VALUES (UUID(), ?, ?, ?, ?)',
        [DepartmentName, InstitutionType, CoursesOffered, faculty_id],
        (err, results) => {
            if (err) return res.json({ error: err.message });
            res.json({ message: 'Department created successfully', id: results.insertId });
        }
    );
});

app.get('/usersms/departments', (req, res) => {
    let { page, limit } = req.query;

    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    const offset = (page - 1) * limit;

    db.query(
        'SELECT * FROM departments LIMIT ? OFFSET ?',
        [limit, offset],
        (err, results) => {
            if (err) return res.json({ error: err.message });

            db.query('SELECT COUNT(*) AS total FROM departments', (err, countResult) => {
                if (err) return res.json({ error: err.message });

                const totalRecords = countResult[0].total;
                const totalPages = Math.ceil(totalRecords / limit);

                res.json({
                    currentPage: page,
                    totalPages: totalPages,
                    totalRecords: totalRecords,
                    data: results
                });
            });
        }
    );
});

app.get('/usersms/departments/:id', (req, res) => {
    const { id } = req.params;

    db.query('SELECT * FROM departments WHERE DepartmentID = ?', [id], (err, results) => {
        if (err) return res.json({ error: err.message });
        if (results.length === 0) return res.json({ message: 'Department not found' });

        res.json(results[0]);
    });
});

app.put('/usersms/departments/:id', (req, res) => {
    const { id } = req.params;
    const { DepartmentName, InstitutionType, CoursesOffered, faculty_id } = req.body;

    db.query(
        'UPDATE departments SET DepartmentName = ?, InstitutionType = ?, CoursesOffered = ?, faculty_id = ?, updated_at = NOW() WHERE DepartmentID = ?',
        [DepartmentName, InstitutionType, CoursesOffered, faculty_id, id],
        (err, results) => {
            if (err) return res.json({ error: err.message });
            if (results.affectedRows === 0) return res.json({ message: 'Department not found' });

            res.json({ message: 'Department updated successfully' });
        }
    );
});

app.get('/usersms/departments/search', (req, res) => {
    const { DepartmentName, InstitutionType } = req.query;
    let query = 'SELECT * FROM departments WHERE 1=1';
    let queryParams = [];

    if (DepartmentName) {
        query += ' AND DepartmentName LIKE ?';
        queryParams.push(`%${DepartmentName}%`);
    }
    if (InstitutionType) {
        query += ' AND InstitutionType LIKE ?';
        queryParams.push(`%${InstitutionType}%`);
    }

    db.query(query, queryParams, (err, results) => {
        if (err) return res.json({ error: err.message });

        res.json(results);
    });
});

app.delete('/usersms/departments/:id', (req, res) => {
    const { id } = req.params;

    db.query('DELETE FROM departments WHERE DepartmentID = ?', [id], (err, results) => {
        if (err) return res.json({ error: err.message });
        if (results.affectedRows === 0) return res.json({ message: 'Department not found' });

        res.json({ message: 'Department deleted successfully' });
    });
});



const PORT = 6000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
