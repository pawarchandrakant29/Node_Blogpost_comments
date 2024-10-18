const UserModel = require("../models/usermodel");
const bcrypt = require("bcrypt");
const { request } = require("express");
const otpGenerator = require("otp-generator");
const saltRounds = 10;
const nodemailer = require("nodemailer");
let userOtp = null;
const randomstring = require("randomstring");
// const flash =  require('connect-flash')

let transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: "chandrakantpawar590@gmail.com",
    pass: "ahspzywjwahqmfxu",
  },
});
// Render the signup form
const signUpFormCon = (req, res) => {
  res.render("auth/register", { title: "Sign Up", user: res.locals.user });
};

// Render the login form
const logInFormCon = (req, res) => {
  // console.log("hello111")
  // req.flash('login','you are logged in successfully')

  res.render("auth/login", {
    title: "Login",
    user: res.locals.user,
    error: req.query.error,
  });
};

// Handle signup logic
const signUpCon = async (req, res) => {
  try {
    const { name, email, password, con_password, role } = req.body;

    // Ensure passwords match
    if (password !== con_password) {
      return res.redirect("/signUpForm?error=PasswordMismatch");
    }

    // Check if the email already exists in the database
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.redirect("/signUpForm?error=EmailAlreadyExists");
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create a new user with the provided information

    const newUser = new UserModel({
      name,
      email,
      password: hashedPassword,
      profilePic: req.file ? req.file.path : null, // Handle optional profile picture upload
      userToken: null,
    });

    // Save the user to the database
    await newUser.save();
    res.redirect("/logInForm");
  } catch (err) {
    console.error("Error during signup:", err);
    res.redirect("/signUpForm?error=ServerError");
  }
};

// Handle login logic
const logInCon = async (req, res) => {
  // const { email, password } = req.body;

  // // Find user by email
  // const user = await UserModel.findOne({ email: email });
  // console.log("user", user)
  // if (user) {
  //     bcrypt.compare(password, user.password, (err, r) => {
  //         if (!err) {
  //             res.cookie('user_id', user._id);
  //             res.redirect('/');
  //         } else {
  //             res.redirect('/logInForm');
  //         }
  //     });
  // } else {
  //     res.redirect('/signUpForm');
  // }

  req.flash("login", "you are logged in successfully");

  res.redirect("/");
};

// Handle logout logic
const logoutCon = (req, res) => {
  res.redirect("/logInForm"); // Redirect to login form
};
const changePass = (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;
  console.log(req.user.password);
  bcrypt.compare(oldPassword, req.user.password, (err, result) => {
    if (result) {
      if (newPassword === confirmPassword) {
        console.log("new password is", newPassword);
        bcrypt.hash(newPassword, saltRounds, async (err, hash) => {
          console.log("new password converted in ");
          if (err) {
            console.error("Error hashing password:", err);
            res.redirect("/changePassForm");
          } else {
            const updatedPass = await UserModel.findByIdAndUpdate(
              { _id: req.user.id },
              { password: hash }
            );
            console.log("pass_update", updatedPass);
            res.redirect("/logInForm");
          }
        });
      } else {
        res.redirect("/changePassForm");
      }
    } else {
      res.redirect("/changePassForm");
    }
  });
};
const changePassForm = (req, res) => {
  res.render("auth/change_Pass", { title: "Change Password" });
};
const forgotPassForm = (req, res) => {
  res.render("auth/forgot_Pass", { title: "Forgot Password" });
};

const verifyEmail = async (req, res) => {
  const { email } = req.body;

  const user = await UserModel.findOne({ email });
  // user.userToken = token;
  console.log("user", user);

  if (!user) {
    res.redirect("/forgotPassForm");
  } else {
    let token = randomstring.generate();
    await UserModel.updateOne({ email: user.email }, { userToken: token });
    // for otp
    // userOtp = otpGenerator.generate(6, { upperCaseAlphabets: false, lowerCaseAlphabets: false, specialChars: false });
    // console.log(' variableotp', userOtp)
    // res.redirect(`/verifyOtpForm/${user._id}`)

    // for link
    let link = `http://localhost:3009/resetPassForm/${user.id}?token=${token}`;
    console.log(link);
    transporter.sendMail(
      {
        from: "Chandrakant Pawar <chandrakantpawar590@gmail.com>",
        to: user.email,
        subject: "Reset Your Password - Important Information",
        text: `Dear ${user.name},
        
        We received a request to reset your password. Please use the following link to create a new password:
        
        ${link}
        
        If you did not request a password reset, please ignore this email or contact our support team if you have any questions.
        
        Best regards,
        The Chandrakant Team`,
        html: `
                <div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <img src="https://cdn.logojoy.com/wp-content/uploads/2018/05/30164225/572.png" alt="Company Logo" style="width: 150px;">
                    </div>
                    <h2 style="color: #6c63ff; text-align: center;">Reset Your Password</h2>
                    <p>Dear ${user.name},</p>
                    <p>We received a request to reset your password. Click the button below to reset your password:</p>
                    <div style="text-align: center; margin: 20px 0;">
                        <a href="${link}" style="padding: 12px 20px; background-color: #6c63ff; color: white; text-decoration: none; border-radius: 5px; font-size: 16px;">
                            Reset Password
                        </a>
                    </div>
                    <p>If the button above doesn't work, you can also use the following link:</p>
                    <p><a href="${link}" style="color: #6c63ff;">${link}</a></p>
                    <p>If you did not request a password reset, please ignore this email or contact our support team.</p>
                    <p style="margin-top: 20px;">Best regards,<br>The Chandrakant Team</p>
                    <div style="margin-top: 30px; text-align: center; color: #999; font-size: 12px;">
                        <p>&copy; 2024 Chandrakant Company. All rights reserved.</p>
                    </div>
                </div>`,
      },
      (err, info) => {
        if (err) {
          console.log("Error sending email: ", err);
        } else {
          console.log("Email sent: ", info.response);
        }
      }
    );

    res.render("auth/linkSent");
  }
};

const verifyOtpForm = async (req, res) => {
  // const { id } = req.params;
  // const { otp } = req.body;

  res.render(`auth/otp_Verify`, { id: req.params.id });
};

const verifyOTP = (req, res) => {
  const { id } = req.params;

  console.log("body otp", req.body.otp, userOtp);
  if (userOtp == req.body.otp) {
    console.log("otp matched");
    res.redirect(`/resetPassForm/${id}`);
  } else {
    console.log("otp does not match");
    res.redirect("/forgotPassForm");
  }
};
const resetPassForm = async (req, res) => {
  const user = await UserModel.findOne({ _id: req.params.id });

  console.log("reset pass form", user);
  if (user.userToken) {
    res.render("auth/reset_Pass", {
      title: "Reset Password",
      id: req.params.id,
    });
  } else {
    res.render("auth/token");
  }
};

const resetPassword = async (req, res) => {
  const { id } = req.params;
  const { token } = req.query;
  const { newPassword, confirmPassword } = req.body;
  const user = await UserModel.findById(id);

  if (newPassword === confirmPassword) {
    bcrypt.hash(newPassword, saltRounds, async (err, hash) => {
      if (err) {
        console.error("Error hashing password:", err);
        res.redirect(`/resetPassForm/${id}`);
      } else {
        const updatedPass = await UserModel.findByIdAndUpdate(id, {
          password: hash,
          userToken: null,
        });
        console.log("userToken in reset password", updatedPass);
        res.redirect("/logInForm");
      }
    });
    // if (!user || user.userToken !== token) {

    //      res.render('auth/token');
    // }
  } else {
    res.redirect(`/resetPassForm/${id}`);
  }
};

module.exports = {
  signUpFormCon,
  signUpCon,
  logInFormCon,
  logInCon,
  logoutCon,
  changePassForm,
  forgotPassForm,
  changePass,
  verifyEmail,
  resetPassForm,
  verifyOtpForm,
  verifyOTP,
  resetPassword,
};
