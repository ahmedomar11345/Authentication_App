const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const register = async (req, res) => {
  const { first_name, last_name, email, password } = req.body;
  if (!first_name || !last_name || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }
  const foundUser = await User.findOne({ email }).exec();
  if (foundUser) {
    return res.status(401).json({ message: "User already exists" });
  }
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    first_name,
    last_name,
    email,
    password: hashedPassword,
  });

  const accessToken = jwt.sign(
    {
      UserInfo: {
        id: user._id,
      },
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "15m" }
  );
  const refreshToken = jwt.sign(
    {
      UserInfo: {
        id: user._id,
      },
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );
  res.cookie("jwt", refreshToken, {
    httpOnly: true, //accessible only by web server
    secure: true, //https
    sameSite: "None", //cross-site cookie
    maxAge: 60 * 60 * 24 * 7 * 1000,
  });
  res.json({
    accessToken,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    message: "User Created successfully!",
  });
};

const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }
  const foundUser = await User.findOne({ email }).exec();
  if (!foundUser) {
    return res.status(401).json({ message: "User does not exist" });
  }
  const match = await bcrypt.compare(password, foundUser.password);

  if (!match) {
    return res.status(401).json({ message: "Wrong password" });
  }

  const accessToken = jwt.sign(
    {
      UserInfo: {
        id: foundUser._id,
      },
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "15m" }
  );
  const refreshToken = jwt.sign(
    {
      UserInfo: {
        id: foundUser._id,
      },
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );

  res.cookie("jwt", refreshToken, {
    httpOnly: true, //accessible only by web server
    secure: true, //https
    sameSite: "None", //cross-site cookie
    maxAge: 60 * 60 * 24 * 7 * 1000,
  });
  res.json({
    accessToken,
    email: foundUser.email,
  });
};

const refresh = (req, res) => {
  const cookies = req.cookies;
  if(!cookies?.jwt){res.status(401).json({message:"Unauthorized"});}
  const refreshToken = cookies.jwt;
  jwt.verify(refreshToken , process.env.REFRESH_TOKEN_SECRET , async (err , decoded)=>{
    if(err)return res.status(403).json({message:"Forbidden"});
    const foundUser = await User.findById(decoded.UserInfo.id).exec();
    if(!foundUser)return res.status(401).json({message:"Unauthorized"});
    const accessToken = jwt.sign(
      {
        UserInfo: {
          id: foundUser._id,
        },
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" }
    );
    res.json({accessToken});

  })
};
const logout = (req ,res)=>{
  const cookies = req.cookies;
  if(!cookies?.jwt)return res.sendStatus(204); //No content
  res.clearCookie("jwt" ,{
    httpOnly: true, //accessible only by web server
    sameSite: "None",
    secure: true, //https
  });
  res.json({message:"Cookie cleared"});
}
module.exports = {
  register,
  login,
  refresh,
  logout,
};
