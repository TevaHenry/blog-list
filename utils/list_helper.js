const _ = require('lodash')

const dummy = (blogs) => 1

const totalLikes = (blogs) => blogs.reduce((acc, cur) => acc + cur.likes, 0)

const favoriteBlog = (blogs) => {
  if (!blogs.length) {
    return 'the list of blogs is empty'
  }

  const mostLikedBlog = blogs.reduce((acc, cur) => cur.likes > acc.likes ? cur : acc)

  return {
    title: mostLikedBlog.title,
    author: mostLikedBlog.author,
    likes: mostLikedBlog.likes
  }
}

const mostBlogs = (blogs) => {
  if (!blogs.length) {
    return 'the list of blogs is empty'
  }

  const sortedBlogs = _.countBy(blogs, 'author')
  const mostPublishedAuthor = Object.entries(sortedBlogs).reduce((acc, cur) => cur[1] > acc[1] ? cur : acc)
  return {
    author: mostPublishedAuthor[0],
    blogs: mostPublishedAuthor[1]
  }
}

const mostLikes = (blogs) => {
  if (!blogs.length) {
    return 'the list of blogs is empty'
  } else if (blogs.length === 1) {
    return {
      author: blogs[0].author,
      likes: blogs[0].likes
    }
  } else {
    const sortedBlogs = _.groupBy(blogs, 'author')
    const mostLikedAuthor = Object.entries(sortedBlogs).reduce((acc, cur) => cur.reduce((blogs, blog) => blog.likes + blogs.likes, 0) > acc.reduce((blogs, blog) => blog.likes + blogs.likes, 0) ? cur : acc)

    return {
      author: mostLikedAuthor[0],
      likes: mostLikedAuthor[1].reduce((acc, cur) => acc.likes + cur.likes)
    }
  }
}

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBlogs,
  mostLikes
}