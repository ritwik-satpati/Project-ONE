import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath, folderNameOnCloudinary) => {
  try {
    if (!localFilePath) return null;
    // upload the file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      folder: folderNameOnCloudinary,
    });
    // file has been uploaded successfully on cloudinary
    // console.log("File has been uploaded on cloudinary ", response.url);
    return response;
  } catch (error) {
    fs.unlink(localFilePath);
    // console.log("File is not uploaded on cloudinary !!!", response.url);
    return null;
  }
};

export { uploadOnCloudinary };
