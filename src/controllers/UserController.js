const User = require('../models/User.js')
const { validationResult } = require('express-validator')
const bcrypt = require('bcrypt')
const Post = require('../models/Post.js')
const moment = require('moment')
const fs = require('fs')

module.exports = {
    // hiển thị ra các bài viết mà người dùng đã viết
    async mangePost(req, res) {
        let userPosts = await Post.find({ author: req.user.name }).exec();
             
        res.render('user/posts', { 
            title: "Quản lý bài viết của bạn",
            userPosts, 
            moment 
        })
    },

    // hiển thị giao diện thay đổi thông tin
    async changeInfo(req, res) {
        const user = await User.findById(req.user._id).exec();
        
        res.render('user/change-info', { 
            title: "Thay đổi thông tin",
            user,
        })
    },

    // lưu thông tin vừa chỉnh sửa
    async saveInfo(req, res) {
        const result = validationResult(req)
        const errors = result.array()  
        if ((req.body.name != req.user.name) || (req.body.email != req.user.email)) {
            if (errors.length > 0) {
                res.render('user/change-info', {errors})
            } else {
                try {
                    await User.findByIdAndUpdate(req.user._id, {
                        name: req.body.name,
                        email: req.body.email
                    })
                    req.session.message = {
                        type: 'success',
                        text: 'Thông tin đã được thay đổi'
                    }
                    res.redirect('/user/change-info')
                } catch(err) {
                    req.session.message = {
                        type: 'danger',
                        text: 'Tên người dùng hoặc email đã tồn tại'
                    }
                    res.redirect('/user/change-info')
                }
            }
        } else {
            req.session.message = {
                type: 'success',
                text: 'Thông tin đã được thay đổi'
            }
            res.redirect('/user/change-info')
        }
    },

    changePassword(req, res) {
        res.render('user/change-password', {
            title: "Thay đổi mật khẩu"
        })
    },

    savePassword(req, res) {
        bcrypt.compare(req.body.password, req.user.password)
            .then(async (result) => {
                if (result) {
                    const errors = validationResult(req)
                    const errorsArray = errors.array()  

                    if (errorsArray.length > 0) {
                        res.render('user/change-password', {errorsArray})
                    } else {
                        const newPassword = await bcrypt.hash(req.body.newPassword, 10)
                        await User.findByIdAndUpdate(req.user._id, { password: newPassword })
                        req.session.message = {
                            type: 'success',
                            text: "Thông tin đã được lưu lại"
                        }
                        res.redirect('/user/change-info')
                    }
                } else {
                    res.render('user/change-password', {errMsg: "Mật khẩu cũ không đúng"})
                }
            })
            .catch((err) => {
                console.log(err)
            })
    },

    // giao diện cho phép viết bài
    writePost(req, res) {
        res.render('user/write-post', {
            title: "Viết bài"
        })
    },

    // lưu bài viết vừa tạo
    savePost(req, res) {
        const data = {
            title: req.body.title,
            author: req.user.name,
            image: req.file.filename,
            description: req.body.description
        }
        const post = new Post(data)
        post.save()
            .then(() => {
                req.session.message = {
                    text: "Viết bài thành công",
                    type: "success"
                }
                return res.redirect('/user/posts')
            })
            .catch(err => {
                return res.json({message: err.message})
            })
    
    },

    // giao diện thay đổi bài viết
    editPost(req, res) {
        Post.findById(req.params.id)
            .then((post) => {
                res.render('user/edit-post', {
                    title: "Sửa bài viết",
                    post
                })

            })
    },

    // sau khi bấm sửa thì cập nhật bài viết
    async updatePost(req, res) {
        let newImage = '';
       
        if (req.file) {
            newImage = req.file.filename;

            fs.unlink('./src/public/uploads/post_image/' + req.body.old_image, (err) => {
                err ? console.log(err) : console.log('old image was removed')
            })
        } else {
            newImage = req.body.old_image
        }
        

        try {
            await Post.findByIdAndUpdate(req.params.id, {
                title: req.body.title,
                description: req.body.description,
                author: req.user.name,
                image: newImage,
                modified: 1
            })
            req.session.message = {
                text: 'Cập nhật bài viết thành công',
                type: 'success'
            }
            res.redirect('/user/posts')
        } catch (err) {
            res.json({ message: err.message });
        }
    },

    // xóa bài viết
    async removePost(req, res) {
        const post = await Post.findById(req.params.id)
        try {
            fs.unlink('./src/public/uploads/post_image/' + post.image, (err) => {
                err ? console.log(err) : console.log('old image was removed')
            })
            await Post.findByIdAndDelete(req.params.id)
            req.session.message = {
                text: "Đã xóa bài viết!",
                type: "success"
            }
            res.redirect('/user/posts')
        } catch (err) {
            console.log(err.message)
        }
    }
}
