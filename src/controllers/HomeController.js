const moment = require('moment')
moment.locale('vi')
const Post = require('../models/Post.js')
const bootstrapPaginator = require('../utils/bootstrapPaginator.js');

module.exports = {
    async index(req, res) {
        const page = parseInt(req.query.page) || 1;
        const limit = 9; // Number of items per page

        const result = await Post.paginate({}, { page, limit, sort: { createdAt: -1 } });

        const bPaginator = bootstrapPaginator(page, limit, result)

        res.render('index', {
            posts: result.docs,
            page, 
            pages: result.pages,
            moment,
            bPaginator
        });
            
    },

    async allPost(req, res) {
        try {
            const post = await Post.findById(req.params.id)
        
            res.render('posts/post', {
                post: post,
                moment: moment
            })
        } catch (err) {
            res.json({message: "post doesn't exist"})
        }
    }
}