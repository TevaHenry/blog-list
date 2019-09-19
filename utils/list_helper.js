const dummy = (blogs) => {
  return 1
}

const totalLikes = (blogs) => blogs.reduce((acc, blog) => acc + blog.likes, 0)

const favoriteBlog = (blogs) => {
  if (!blogs.length) return 'No blogs yet'
  const favorite = blogs.sort((a, b) => b.likes - a.likes)
  const result =  { 
    title: favorite[0].title, 
    author: favorite[0].author, 
    likes: favorite[0].likes }
  return result
}

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog
}