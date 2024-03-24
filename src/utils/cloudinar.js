import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// * Cloudinary Configuration *
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// *** Upload File in a Specific Path on Cloudinary ***
export const uploadOnCloudinary = async (
  localFilePath,
  folderNameOnCloudinary
) => {
  try {
    if (!localFilePath) return null;
    // upload the file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      folder: folderNameOnCloudinary,
    });
    // file has been uploaded successfully on cloudinary
    // console.log("File has been uploaded on cloudinary ", response);
    return response;
  } catch (error) {
    fs.unlink(localFilePath);
    // console.log("File is not uploaded on cloudinary !!!", response);
    return null;
  }
};

// *** Delete File using public_id on Cloudinary ***
export const destroyOnCloudinary = async (public_id) => {
  try {
    if (!public_id) return null;
    // delete the file on cloudinary
    const response = await cloudinary.uploader.destroy(public_id);
    // file has been deleteded successfully on cloudinary
    // console.log("File has been deleted on cloudinary: ", response);
    return response;
  } catch (error) {
    return null;
  }
};
