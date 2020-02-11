const mongoose = require('mongoose')
const supertest = require('supertest')
const helper = require('./test_helper')
const app = require('../app')
const api = supertest(app)

const Blog = require('../models/blog')
const User = require('../models/user')


describe('blog-list api tests', () => {
  let token

  beforeAll(async () => {
    await User.deleteMany({})

    await api
      .post('/api/users')
      .send({
        username: 'Tester',
        name: 'Tester',
        password: 'iamheretotest'
      })

    const loginResponse = await api
      .post('/api/login')
      .send({
        username: 'Tester',
        password: 'iamheretotest',
      })

    token = loginResponse.body.token
  })

  describe('fetching', () => {
    beforeEach(async () => {
      await Blog.deleteMany({})
      const blogObjects = helper.initialBlogs.map(blog => new Blog(blog))
      const promiseArray = blogObjects.map(blog => blog.save())
      await Promise.all(promiseArray)
    })
    test('blogs are returned as json', async () => {
      await api
        .get('/api/blogs')
        .expect(200)
        .expect('Content-Type', /application\/json/)
    })

    test('all blogs are returned', async () => {
      const res = await api.get('/api/blogs')

      expect(res.body.length).toBe(helper.initialBlogs.length)
    })

    test('that the unique identifier is named id', async () => {
      const blogs = await helper.blogsInDb()
      const specificBlog = blogs[0]

      expect(specificBlog.id).toBeDefined()
    })
  })

  describe('posting a blog', () => {
    beforeEach(async () => {
      await Blog.deleteMany({})
      const blogObjects = helper.initialBlogs.map(blog => new Blog(blog))
      const promiseArray = blogObjects.map(blog => blog.save())
      await Promise.all(promiseArray)
    })
    test('gets succesfully created', async () => {
      const newBlog = {
        title: 'How to test the backend?',
        author: 'Teva Henry',
        url: 'https://www.thisisjustatest.com/blogs/1',
        likes: 13
      }

      await api
        .post('/api/blogs')
        .send(newBlog)
        .set('Authorization', `Bearer ${token}`)
        .expect(201)
        .expect('Content-Type', /application\/json/)

      const blogsAtEnd = await helper.blogsInDb()
      expect(blogsAtEnd.length).toBe(helper.initialBlogs.length + 1)

      const titles = blogsAtEnd.map(b => b.title)
      expect(titles).toContainEqual('How to test the backend?')
    })

    test('without a like property defaults to 0 likes', async () => {
      const newBlog = {
        title: 'How to test the backend?',
        author: 'Teva Henry',
        url: 'https://www.thisisjustatest.com/blogs/1'
      }

      await api
        .post('/api/blogs')
        .send(newBlog)
        .set('Authorization', `Bearer ${token}`)
        .expect(201)
        .expect('Content-Type', /application\/json/)

      const blogsAtEnd = await helper.blogsInDb()
      expect(blogsAtEnd.length).toBe(helper.initialBlogs.length + 1)

      const likes = blogsAtEnd.map(b => b.likes)
      expect(likes).not.toContain(undefined)
    })

    test('without title and url responds with a bad request', async () => {
      const newBlog = {
        author: 'Teva Henry',
        likes: 2
      }

      await api
        .post('/api/blogs')
        .send(newBlog)
        .set('Authorization', `Bearer ${token}`)
        .expect(400)
    })
  })

  describe('deletion of a blog', () => {
    beforeEach(async () => {
      await Blog.deleteMany({})
      const blogObjects = helper.initialBlogs.map(blog => new Blog(blog))
      const promiseArray = blogObjects.map(blog => blog.save())
      await Promise.all(promiseArray)
    })
    test('succeeds with status code 204 if id is valid and user is creator', async () => {
      const blogsAtStart = await helper.blogsInDb()
      const blogToDelete = blogsAtStart[0]

      await api
        .delete(`/api/blogs/${blogToDelete.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(204)

      const blogsAtEnd = await helper.blogsInDb()

      expect(blogsAtEnd.length).toBe(
        helper.initialBlogs.length - 1
      )

      const titles = blogsAtEnd.map(b => b.title)

      expect(titles).not.toContain(blogToDelete.title)
    })
    test('fails with 401 if id is valid but user isn\'t creator', async () => {
      const blogsAtStart = await helper.blogsInDb()
      const blogToDelete = blogsAtStart[0]

      await api
        .delete(`/api/blogs/${blogToDelete.id}`)
        .set('Authorization', `Bearer ${token.split('').reverse().join('')}`)
        .expect(401)

      const blogsAtEnd = await helper.blogsInDb()

      expect(blogsAtEnd.length).toBe(
        helper.initialBlogs.length - 1
      )

      const titles = blogsAtEnd.map(b => b.title)

      expect(titles).not.toContain(blogToDelete.title)
    })
  })

  describe('updating a blog', () => {
    test('succeeds with valid data', async () => {
      const newBlog = {
        title: 'How to test',
        author: 'String',
        url: 'String',
        likes: 10,
      }

      await api
        .post('/api/blogs')
        .send(newBlog)
        .expect(201)
        .expect('Content-Type', /application\/json/)


      const blogsAtEnd = await helper.blogsInDb()
      expect(blogsAtEnd.length).toBe(helper.initialBlogs.length + 1)

      const titles = blogsAtEnd.map(b => b.title)
      expect(titles).toContain(
        'How to test'
      )
    })

    test('fails with status code 400 if data invaild', async () => {
      const newBlog = {
        important: true
      }

      await api
        .post('/api/blogs')
        .send(newBlog)
        .expect(400)

      const blogsAtEnd = await helper.blogsInDb()

      expect(blogsAtEnd.length).toBe(helper.initialBlogs.length)
    })
  })

  describe('when there is initially one user at db', () => {
    beforeEach(async () => {
      await User.deleteMany({})
      const user = new User({ username: 'root', password: 'sekret' })
      await user.save()
    })

    test('creation succeeds with a fresh username', async () => {
      const usersAtStart = await helper.usersInDb()

      const newUser = {
        username: 'mluukkai',
        name: 'Matti Luukkainen',
        password: 'salainen',
      }

      await api
        .post('/api/users')
        .send(newUser)
        .expect(201)
        .expect('Content-Type', /application\/json/)

      const usersAtEnd = await helper.usersInDb()
      expect(usersAtEnd.length).toBe(usersAtStart.length + 1)

      const usernames = usersAtEnd.map(u => u.username)
      expect(usernames).toContain(newUser.username)
    })

    test('creation fails with proper statuscode and message if username already taken', async () => {
      const usersAtStart = await helper.usersInDb()

      const newUser = {
        username: 'root',
        name: 'Superuser',
        password: 'salainen',
      }

      const result = await api
        .post('/api/users')
        .send(newUser)
        .expect(400)
        .expect('Content-Type', /application\/json/)

      expect(result.body.error).toContain('`username` to be unique')

      const usersAtEnd = await helper.usersInDb()
      expect(usersAtEnd.length).toBe(usersAtStart.length)
    })

    test('creation fails with short password', async () => {
      const usersAtStart = await helper.usersInDb()

      const newUser = {
        username: 'root',
        name: 'Superuser',
        password: '12',
      }

      const result = await api
        .post('/api/users')
        .send(newUser)
        .expect(400)
        .expect('Content-Type', /application\/json/)

      expect(result.body.error).toContain('password must be at least 3 characters long')

      const usersAtEnd = await helper.usersInDb()
      expect(usersAtEnd.length).toBe(usersAtStart.length)
    })

    test('creation fails with no password', async () => {
      const usersAtStart = await helper.usersInDb()

      const newUser = {
        username: 'root',
        name: 'Superuser',
      }

      const result = await api
        .post('/api/users')
        .send(newUser)
        .expect(400)
        .expect('Content-Type', /application\/json/)

      expect(result.body.error).toContain('password missing')

      const usersAtEnd = await helper.usersInDb()
      expect(usersAtEnd.length).toBe(usersAtStart.length)
    })
  })
})



afterAll(() => {
  mongoose.connection.close()
})