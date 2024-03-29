const {
  from
} = require('feedparser')
const Router = require('koa-router')
const moment = require('moment')
const {
  HttpException
} = require('../../../core/http-exception')
const {
  howLongAgo
} = require('../../../core/util')
const {
  Article
} = require('../../models/article')
const {
  Comment
} = require('../../models/comment')
const {
  User
} = require('../../models/user')


const router = new Router({
  prefix: '/api/v2/comment'
})

router.get('/:arId', async (ctx) => {
  const data = []
  const comments = await Comment.findAll({
    where: {
      arId: ctx.params.arId
    }
  })
  for (let comment of comments) {
    comment = comment.toJSON()
    const createdAt = moment(comment.createdAt)
    formatDate = createdAt.format('YYYY-MM-DD HH:mm:ss')
    comment.howLongAgo = howLongAgo(formatDate)
    try {
      const from_user = await User.findOne({
        where: {
          id: comment.from_uid
        }
      })
      comment.from_avatar = from_user.avatar
      comment.from_nickname = from_user.nickname
      data.push(comment)
    } catch (error) {
      throw new HttpException(error)
    }
  }
  ctx.body = {
    code: 200,
    data
  }
})

router.post('/new', async (ctx) => {
  const data = ctx.request.body
  const {
    from_uid,
    to_nickname,
    content,
    arId
  } = data
  let condition = {}
  if (to_nickname) {
    condition.nickname = to_nickname
  }
  try {
    const to_user = await User.findOne({
      where: {
        ...condition
      }
    })
    const from_user = await User.findOne({
      where: {
        id: from_uid
      }
    })

    data.from_avatar = from_user.toJSON().avatar
    data.from_nickname = from_user.toJSON().nickname
  } catch (error) {
    throw new HttpException('找不到指定用户')
  }
  try {
    const comment = await Comment.create({
      ...data
    })
    Article.update({}, {
      where: {
        id: 1
      }
    })
  } catch (error) {
    ctx.body = {
      code: 400,
      msg: `${error}`
    }
  }

  ctx.body = {
    code: 200,
    msg: 'success'
  }
})

module.exports = router