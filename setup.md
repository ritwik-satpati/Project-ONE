# Project ONE - Setup 

- Rename file name `.env.sample` to `.env`
- Setup `.env` file
    - `PORT` - (Change - Optional)
    - `MONGODB_URI` - Mongo DB URI
    - `CORS_ORIGIN` - (Change - Optional)
    - `ACCOUNT_ACCESS_TOKEN_SECRET`, `ACCOUNT_REFRESH_TOKEN_SECRET`, `ADMIN_ACCESS_TOKEN_SECRET`, `SUPERADMIN_ACCESS_TOKEN_SECRET` - Set Keys [Can use this - `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` in the terminal]
    - `ACCOUNT_ACCESS_TOKEN_EXPIRY`, `ACCOUNT_REFRESH_TOKEN_EXPIRY`, `ADMIN_ACCESS_TOKEN_EXPIRY`, `SUPERADMIN_ACCESS_TOKEN_EXPIRY` - Set Expiry day [like `5d`]
    - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` - These things can be found in [Cloudinary](https://console.cloudinary.com/) (Optional for Avatar File upload system)
- In the terminal `npm init`
- In the terminal `npm run dev` to live the project