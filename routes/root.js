const express = require("express");
const router = express.Router();
const path = require("path");
console.log();
// Define routes
router.get("/" , (req , res)=>{
    res.sendFile(path.join(path.join(__dirname,".." , "views", "index.html")))
});
module.exports = router;