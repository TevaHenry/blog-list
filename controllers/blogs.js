const jwt = require('jsonwebtoken')
const blogsRouter = require('express').Router()
const Blog = require('../models/blog')
const User = require('../models/user')
const Comment = require('../models/comment')

blogsRouter.get('/', async (req, res) => {
  const blogs = await Blog.find({}).populate('user', { username: 1, name: 1 })
  res.json(blogs)
})

blogsRouter.post('/', async (req, res, next) => {
  const body = req.body

  if(!(body.title && body.url)) {
    return res.status(400).end()
  }

  try {
    const decodedToken = jwt.verify(req.token, process.env.SECRET)

    if (!req.token || !decodedToken.id) {
      return res.status(401).json({ error: 'token missing or invalid' })
    }

    const user = await User.findById(decodedToken.id)

    const blog = new Blog({
      title: body.title,
      author: body.author,
      url: body.url,
      likes: body.likes ? body.likes : 0,
      user
    })

    const savedBlog = await blog.save()
    user.blogs = user.blogs.concat(savedBlog._id)
    await user.save()
    res.status(201).json(savedBlog.toJSON())
  } catch (exception) {
    next(exception)
  }
})

blogsRouter.delete('/:id', async (req, res, next) => {
  try {
    const decodedToken = jwt.verify(req.token, process.env.SECRET)

    if (!req.token || !decodedToken.id) {
      return res.status(401).json({ error: 'token missing or invalid' })
    }

    const user = await User.findById(decodedToken.id)
    const blog = await Blog.findById(req.params.id)

    if (user && blog) {
      if ( blog.user._id.toString() === user._id.toString() ) {
        await Blog.findByIdAndRemove(req.params.id)
        return res.status(204).end()
      } else {
        return res.status(401).json({ error: 'only the creator of the blog may delete it' })
      }
    } else {
      return res.status(400).end()
    }
  } catch (exception) {
    next(exception)
  }
})

blogsRouter.put('/:id', async (req, res, next) => {
  const body = req.body

  const blog = {
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes
  }

  const updatedBlog = await Blog.findByIdAndUpdate(req.params.id, blog, { new: true }).populate('user', { username: 1, name: 1 })
  try {
    res.json(updatedBlog.toJSON())
  } catch (exception) {
    next(exception)
  }
})

blogsRouter.get('/:id/comments', async (req, res) => {
  const comments = await Comment.find({ blog: req.params.id })
  res.json(comments)
})

blogsRouter.post('/:id/comments', async (req, res, next) => {
  const body = req.body

  try {
    const comment = new Comment ({
      content: body.content,
      blog: req.params.id
    })

    const savedComment = await comment.save()

    res.json(savedComment.toJSON())
  } catch (exception) {
    next(exception)
  }
})

module.exports = blogsRouter