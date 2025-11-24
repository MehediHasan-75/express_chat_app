//this will just call the fule upload function
const uploader = require("../../utilities/singleUploader");

function avatarUpload(req, res, next) {
  const upload = uploader(
    "avatars", //subfolder name
    ["image/jpeg", "image/jpg", "image/png"],//allowed type
    10000000,//max file size
    "Only .jpg, jpeg or .png format allowed!"//error message
  );

  // call the middleware function
  upload.any()(req, res, (err) => {
    if (err) {
      res.status(500).json({ 
        errors: {
          avatar: {
            msg: err.message,
          },
        },
      });
    } else {
      next();
    }
  });
}

module.exports = avatarUpload;