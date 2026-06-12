# Backend README (Quick Reference)

Backend API built with Node.js, Express, MongoDB (Mongoose), JWT authentication using httpOnly cookies, Multer + Cloudinary for image uploads. Supports users, posts, comments, reviews, likes, and role-based authorization.

Run commands:
npm install
npm run dev
Server default: http://localhost:5000

Required .env keys:
PORT, MONGO_URI, JWT_SECRET, CLOUD_NAME, CLOUD_API_KEY, CLOUD_API_SECRET, NODE_ENV

Server entry: server.js (Express app, CORS for localhost:3000, JSON parser, cookie-parser, MongoDB connect, route mounting)

Routes mounted:
 /api/auth
 /api/posts
 /api/comments
 /api/reviews
 /api/upload

Authentication idea in one line:
user logs in → JWT created → stored in httpOnly cookie → authMiddleware reads & verifies → req.userId + req.userRole available → protected routes allowed

authMiddleware:
reads token from cookie or Bearer header, verifies JWT_SECRET, blocks if invalid/expired

User model:
name, email (unique, lowercase), password (hashed), role(user/admin), avatar (cloudinary url), timestamps

Post model:
title, content, coverImage, author (User ref), likes[], tags[], isPublished, text index on title+content, timestamps

Comment model:
text, post ref, author ref, timestamps

Review model:
rating 1–5, optional comment, user ref, post ref, unique(user+post), timestamps, used to compute averageRating + totalReviews in Post

Main features in English:
register/login/logout, get current user, profile photo update, delete account, create posts, update/delete own or admin, like/unlike, add comments, delete own/admin comment, add or update review, delete own/admin review, upload images from file or URL to Cloudinary folder blog_uploads

Auth routes:
POST /register, POST /login, POST /logout, GET /me, PUT /profile/photo, DELETE /delete/:id

Post routes:
GET /, GET /:id, POST /, PUT /:id, DELETE /:id, PUT /like/:id

Comment routes:
GET /:postId, POST /, DELETE /:id

Review routes:
GET /:postId, POST /, DELETE /:id

Upload routes:
POST /image (form-data field=image)
POST /image-by-url (JSON {imageUrl})
stored in Cloudinary blog_uploads

Cloudinary config:
uses CLOUD_NAME, CLOUD_API_KEY, CLOUD_API_SECRET

Multer storage:
CloudinaryStorage with allowed formats jpg, jpeg, png, webp

Important reminders:
Use credentials:true in frontend fetch/axios, cookie name is token, cookies are httpOnly, admin can delete any resource, owners can modify their own content, all controllers wrapped in try/catch

That is the entire backend in one page.




















# COMPLETE BACKEND DOCUMENTATION (ONE PAGE)

## Overview
This backend powers a Portfolio + Blog application with:
- Authentication (JWT + HTTP-only cookies)
- Admin/User roles
- Posts, Comments, Reviews
- Likes system
- Cloudinary uploads
- Profile photo upload & remove
- Admin statistics & management

Tech: Node.js, Express, MongoDB, Mongoose, JWT, Multer, Cloudinary

-------------------------------------------------------------

## Install & Run

cd backend
npm install
npm run dev

Backend URL default:
http://localhost:5000

-------------------------------------------------------------

## Environment (.env)

PORT=5000
MONGO_URI=your_mongo_uri
JWT_SECRET=anysecret
NODE_ENV=development

CLOUD_NAME=cloudinary_name
CLOUD_API_KEY=cloudinary_key
CLOUD_API_SECRET=cloudinary_secret

-------------------------------------------------------------

## Project Structure

backend/
│ server.js
│ package.json
│ .env
│
├─config/
│ ├─cloudinary.js
│ └─multer.js
│
├─controllers/
│ ├─authController.js
│ ├─postController.js
│ ├─commentController.js
│ └─reviewController.js
│
├─middleware/
│ ├─authMiddleware.js
│ └─adminOnly.js
│
├─models/
│ ├─User.js
│ ├─Post.js
│ ├─Comment.js
│ └─Review.js
│
└─routes/
  ├─authRoutes.js
  ├─postRoutes.js
  ├─commentRoutes.js
  ├─reviewRoutes.js
  └─uploadRoutes.js

-------------------------------------------------------------

## Authentication (JWT)

LOGIN creates cookie "token"
LOGOUT clears token

authMiddleware:
- verifies JWT
- sets req.userId & req.userRole

adminOnly:
- only role "admin" allowed

-------------------------------------------------------------

## USER ROUTES  ( /api/auth )

POST   /register           → create account
POST   /login              → login + cookie
POST   /logout             → logout
GET    /me                 → get current user
PUT    /profile/photo      → update OR remove avatar
DELETE /delete/:id         → delete account

Admin only:
GET /stats/total-users     → number of users
GET /stats/users           → list all users

-------------------------------------------------------------

## USER CONTROLLER FEATURES

register
- validates fields
- hashes password
- auto login after register

login
- verifies credentials
- signs JWT 7 days
- stores token in cookie

getMe
- returns logged user without password

updateProfilePhoto
- upload image → Cloudinary
- save avatar URL in DB
- remove avatar if imageUrl = ""

deleteAccount
- user can delete self
- admin can delete any user

-------------------------------------------------------------

## USER MODEL (User.js)

name: String
email: unique lowercase
password: hashed
role: "user" | "admin"
avatar: String | null
timestamps

-------------------------------------------------------------

## POSTS ROUTES ( /api/posts )

GET    /              → all posts
GET    /:id           → single post
POST   /              → create (auth)
PUT    /:id           → update own/admin
DELETE /:id           → delete own/admin
PUT    /like/:id      → like/unlike post

-------------------------------------------------------------

## POSTS CONTROLLER

createPost
getAllPosts
getPostById
updatePost
deletePost
likePost  (toggle)

-------------------------------------------------------------

## POST MODEL (Post.js)

title
content
coverImage
author (User ref)
likes [User ref]
tags [String]
isPublished
text search index
timestamps

-------------------------------------------------------------

## COMMENTS ROUTES ( /api/comments )

GET    /:postId       → comments for post
POST   /              → add comment (auth)
DELETE /:id           → delete own/admin

-------------------------------------------------------------

## COMMENTS CONTROLLER

addComment
getCommentsForPost
deleteComment

-------------------------------------------------------------

## COMMENT MODEL (Comment.js)

text
post (Post ref)
author (User ref)
timestamps

-------------------------------------------------------------

## REVIEWS ROUTES ( /api/reviews )

GET    /:postId       → list reviews for post
POST   /              → add OR update review
DELETE /:id           → delete own/admin

-------------------------------------------------------------

## REVIEWS CONTROLLER

addOrUpdateReview
- user reviews post
- updates if already exists
- recalculates avg rating in Post

deleteReview
getReviewsForPost

-------------------------------------------------------------

## REVIEW MODEL (Review.js)

rating 1–5
comment optional
post ref
user ref
unique(post,user)
timestamps

-------------------------------------------------------------

## FILE UPLOAD ROUTES  ( /api/upload )

POST /image            → upload file (multer + cloudinary)
POST /image-by-url     → upload image by link

-------------------------------------------------------------

## CLOUDINARY HANDLING

config/cloudinary.js
- connects using env credentials

config/multer.js
- stores uploads in Cloudinary folder blog_uploads

-------------------------------------------------------------

## SECURITY USED

HTTP only cookies
SameSite strict
JWT verification
Hashed password
Admin role check middleware
Input validation
Error handling JSON response

-------------------------------------------------------------

## TEST ROUTE

GET /

Response:
Backend server is running successfully

-------------------------------------------------------------

## SUMMARY

✔ Login / Register / Logout
✔ Role based access
✔ Admin dashboard APIs
✔ Profile photo upload & remove
✔ Cloudinary integration
✔ Posts CRUD + likes
✔ Comments CRUD
✔ Reviews CRUD + ratings
✔ Upload by file or URL
✔ Works with your React frontend dashboards

-------------------------------------------------------------

END OF BACKEND DOCUMENTATION

