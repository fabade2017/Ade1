// Import dependencies
const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const cors = require('cors');
const crypto = require('crypto');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerDocument = require('./swagger_output.json'); 
const  = require('swagger-ui-express');
 const nodemailer = require('nodemailer');
 const setupSwagger = require('./swagger');
// const { randomInt } = require('crypto');

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());
// Setup Swagger


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

        'SELECT users.name, name as full_name, users.email, users.role, institutions.name AS institution, profile_image FROM users JOIN institutions ON users.institution_id = institutions.id limit 1',
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
        SELECT users.id, users.name, users.name as full_name,users.email, users.role, institutions.name AS institution,  departments.departmentName, users.profile_image
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
        SELECT users.id, users.name, name as full_name, users.email, users.role, institutions.name,departments.departmentName  AS institution 
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
       //     db.query('SELECT users.id, users.name AS full_name, email, role, institutions.name, department_id,profile_image FROM users left join institutions on users.institution_id = institutions.id WHERE users.id =? and user.email =?', [decoded.id, email], (err, results) => {



        db.query('SELECT users.id, users.name AS full_name, email, role, institutions.name, department_id, profile_image FROM users left join institutions on users.institution_id = institutions.id WHERE users.id =?', [decoded.id], (err, results) => {
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
                    expires_at: new Date(decoded.exp * 1000).toISOString(),
                profile_image: user.profile_image
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
        'INSERT INTO users (id, name, email, password, role, institution_id,  verification_token, verified, created_at, updated_at, department_id, profile_image) VALUES (UUID(), ?, ?, ?, ?, ?,?,?,NOW(), NOW(),?, ?)',
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
                html: `<p>Please verify your email by entering the code "${verificationToken}">.</p>`
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
                const { token, email } = req.body;
            
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

// API Endpoint to get users by criteria
app.post('/usersms/search-users', (req, res) => {
  const { user_id, criteria } = req.body;

  if (!user_id || !criteria) {
    return res.status(400).json({ error: 'user_id and criteria are required.' });
  }

  const { departmentID, institutionID, interests } = criteria;

  let query = 'SELECT u.id, u.name, u.email, u.role, u.department_id, u.institution_id, u.profile_image ' +
              'FROM users u ' +
              'JOIN departments d ON u.department_id = d.departmentID ' +
              'JOIN institutions i ON u.institution_id = i.id ' +
              'JOIN interests iu ON u.id = iu.user_id ' +
              'WHERE 1=1 ';

  // Dynamically build the SQL query based on the provided criteria
  const queryParams = [];

  if (departmentID) {
    query += 'AND u.department_id = ? ';
    queryParams.push(departmentID);
  }

  if (institutionID) {
    query += 'AND u.institution_id = ? ';
    queryParams.push(institutionID);
  }

  if (interests && interests.length > 0) {
    query += 'AND iu.interest IN (?) ';
    queryParams.push(interests);
  }

  db.query(query, queryParams, (err, results) => {
    if (err) {
      console.error('Error querying the database:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    // Return the list of users
    res.json(results);
  });
});

// app.post('/usersms/user_update', async (req, res) => {
//     const { name, email, role, institution_id, department_id, profile_image } = req.body;
//     //const hashedPassword = await bcrypt.hash(password, 10);
//     // Generate verification token
//     const verificationToken = crypto.randomBytes(4).toString('hex');
//     db.query(
//         'INSERT INTO users (id, name, email, password, role, institution_id,  verification_token, verified, created_at, updated_at, department_id, profile_image) VALUES (UUID(), ?, ?, ?, ?, ?,?,?,NOW(), NOW(),?, ?)',
//         [name, email, hashedPassword, role, institution_id, verificationToken, false, department_id, null],
//         (err, results) => {
//             if (err) return res.json({ error: err.message });
            
//               // Send verification email
//             const transporter = nodemailer.createTransport({
//                 service: 'Gmail',
//                 auth: { user: 'fabade2017@gmail.com', pass: 'mixpyxrlcjbhcvxz' } //user: 'adeolu.emmanuel80@gmail.com', pass: 'Theone007@@'
//             });

//             const verificationLink = `https://institutionconnect.com/usersms/verify-email/${verificationToken}`;

//             transporter.sendMail({
//                  from: 'support@instituteconnect.com', 
//                 to: email,
//                 subject: 'Verify Your Email',
//                 html: `<p>Please verify your email by entering the code "${verificationToken}">.</p>`
//             });



//             res.json({ message: 'User registered successfully' });
//         });
// });
app.post('/usersms/user_update', async (req, res) => {
    const { id, name, email, role, institution_id, department_id, profile_image } = req.body;

    // Generate a new verification token
    const verificationToken = crypto.randomBytes(4).toString('hex');

    const sql = `
        UPDATE users SET 
            name = ?, 
            email = ?, 
            role = ?, 
            institution_id = ?, 
            department_id = ?, 
            profile_image = ?, 
            updated_at = NOW() 
        WHERE id = ?
    `;

    //const values = [name, email, role, institution_id, department_id, profile_image];

    db.query(sql, values, (err, results) => {
        if (err) return res.json({ error: err.message });

       // const verificationLink = `https://institutionconnect.com/usersms/verify-email/${verificationToken}`;

        transporter.sendMail({
            from: 'support@instituteconnect.com',
            to: email,
            subject: 'Credential Updated',
            html: `<p>Your credentials have been updated Successfully.</p>`
        });

        res.json({ message: 'User updated and verification email sent.' });
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
app.get('/usersms/privacy/:userId',authenticate,  (req, res) => {
    //const userId = req.params.userId;
 const userId = "req.user.id";
    if (!userId) {
        return res.status(400).json({ error: "userId is required" });
    }

    const sql = `SELECT * FROM PrivacySettings WHERE UserId = ?`;

    db.query(sql, [userId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });

        if (results.length === 0) {
            return res.status(404).json({ message: "Privacy settings not found for this user." });
        }

        res.json(results[0]);
    });
});
app.post('/usersms/privacy/update', async (req, res) => {
    const {
        userId,
        profileVisibility,
        searchVisibility,
        taggingPermissions,
        directMessages
    } = req.body;

    if (!userId) {
        return res.status(400).json({ error: "userId is required" });
    }

    const checkSql = `SELECT * FROM PrivacySettings WHERE UserId = ?`;

    db.query(checkSql, [userId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });

        if (results.length > 0) {
            // Existing record - update only non-null values
            const current = results[0];

            const updatedSql = `
                UPDATE PrivacySettings SET 
                    ProfileVisibility = ?, 
                    SearchVisibility = ?, 
                    TaggingPermissions = ?, 
                    DirectMessages = ?
                WHERE UserId = ?
            `;

            const values = [
                profileVisibility ?? current.ProfileVisibility,
                searchVisibility ?? current.SearchVisibility,
                taggingPermissions ?? current.TaggingPermissions,
                directMessages ?? current.DirectMessages,
                userId
            ];

            db.query(updatedSql, values, (err) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ message: "Privacy settings updated." });
            });

        } else {
            // No record - insert new
            const insertSql = `
                INSERT INTO PrivacySettings (
                    UserId,
                    ProfileVisibility,
                    SearchVisibility,
                    TaggingPermissions,
                    DirectMessages
                ) VALUES (?, ?, ?, ?, ?)
            `;

            const values = [
                userId,
                profileVisibility || 'Everyone',
                searchVisibility !== undefined ? searchVisibility : true,
                taggingPermissions || 'Everyone',
                directMessages || 'Everyone'
            ];

            db.query(insertSql, values, (err) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ message: "Privacy settings created." });
            });
        }
    });
});
 
app.get('/usersms/privacy/list', (req, res) => {
    const { page = 1, limit = 10, profileVisibility, searchVisibility } = req.query;

    const offset = (page - 1) * limit;

    let baseSql = `SELECT * FROM PrivacySettings WHERE 1=1`;
    const params = [];

    // Optional filtering
    if (profileVisibility) {
        baseSql += ` AND ProfileVisibility = ?`;
        params.push(profileVisibility);
    }

    if (searchVisibility !== undefined) {
        baseSql += ` AND SearchVisibility = ?`;
        params.push(searchVisibility === 'true' ? 1 : 0);
    }

    // Add pagination
    baseSql += ` LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));

    db.query(baseSql, params, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ page: Number(page), limit: Number(limit), data: results });
    });
});


//console.log(JSON.stringify(app));
setupSwagger(app); 
//app.use('/usersms/swagger/api-doc', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const PORT = 7000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
