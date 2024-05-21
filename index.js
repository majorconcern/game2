/*--------------------
Utils
--------------------*/
const mapRange = (a, b, c, d, e) => {
  return (a - b) * (e - d) / (c - b) + d
}
const lerp = (v0, v1, t) => {
  return v0 * (1 - t) + v1 * t
}
const random = (min, max) => min + Math.random() * (max - min)


/*--------------------
Raf
--------------------*/
class Raf {
  constructor() {
    this.raf()
  }

  raf() {
    window.requestAnimationFrame(() => {
      const o = {}
      o.time = window.performance.now() / 1000
      this.raf()
      if (this.onRaf) this.onRaf(o)
    })
  }
}


/*--------------------
Canvas
--------------------*/
class Canvas extends Raf {
  constructor(obj) {
    super()
    this.canvas = document.getElementById(obj.id)
    this.ctx = this.canvas.getContext('2d')
    this.resize()
    this.events()
  }

  resize() {
    this.dpr = window.devicePixelRatio
    this.canvas.style.width = `${window.innerWidth}px`
    this.canvas.style.height = `${window.innerHeight}px`
    this.canvas.width = window.innerWidth * this.dpr
    this.canvas.height = window.innerHeight * this.dpr
  }

  events() {
    window.addEventListener('resize', this.resize)
  }

  getCtx() {
    return this.ctx
  }

  clear() {
    this.ctx.clearRect(0, 0, window.innerWidth * this.dpr, window.innerHeight * this.dpr)
  }

  onRaf() {
    this.clear()
  }
}


/*--------------------
Trail
--------------------*/
class Trail extends Raf {
  constructor(obj) {
    super()
    Object.assign(this, obj)

    this.x = 0
    this.y = 0
    this.Trail = []

    this.binds()
    this.events()
  }

  binds() {
    ['handleMouse', 'events', 'tail'].forEach(e => this[e] = this[e].bind(this))
  }

  handleMouse(e) {
    this.x = this.dpr * (e.clientX || e.touches[0].clientX)
    this.y = this.dpr * (e.clientY || e.touches[0].clientY)
  }

  events() {
    ['mousemove', 'touchstart', 'touchmove']
      .forEach(e => {
        window.addEventListener(e, this.handleMouse)
      })
  }

  tail() {
    this.Trail.unshift({x: this.x, y: this.y})
    if (this.Trail.length > this.length) {
      this.Trail.pop()
    }
  }

  draw() {
    this.ctx.strokeStyle = this.color
    this.ctx.lineCap = this.lineCap
    this.ctx.beginPath()

    this.Trail.forEach((el, i) => {
      this.ctx.lineWidth = this.dpr * mapRange(i, 0, this.length, this.strokeMax, this.strokeMin)
      const type = i === 0 ? 'moveTo' : 'lineTo'
      this.ctx.stroke()
      this.ctx[type](el.x, el.y)
    })

    if (this.fill) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0)'
      this.ctx.fill()
    }
  }

  detect() {
    this.balls.forEach(ball => {
      const half = ball.size / 2
      const bound = {
        left: ball.x - half,
        top: ball.y - half,
        right: ball.x + half,
        bottom: ball.y + half
      }

      this.Trail.forEach(e => {
        const {x, y} = e
        if (x > bound.left && x < bound.right && y > bound.top && y < bound.bottom) {
          ball.explode()
        }
      })
    })
  }

  onRaf() {
    this.tail()
    this.detect()
    this.draw()
  }
}

/*--------------------
Ball
--------------------*/
class Ball extends Raf {
  constructor(obj) {
    super()
    Object.assign(this, obj)
    this.regenerate()
    this.draw()
  }

  regenerate() {
    this.bomb = random(0, 10) > 8.5

    this.exploded = false
    this.color = this.bomb ? 'black' : `hsl(${random(0, 360)}, 80%, 60%)`
    this.size = random(this.sizeMin, this.sizeMax) * this.dpr
    this.x = random(this.size, (window.innerWidth * this.dpr) - this.size)
    this.y = -this.size
    this.acc = 0
    this.speed = 0
    this.ready = false

    setTimeout(() => {
      this.ready = true
    }, random(0, 2000))
  }

  draw() {
    this.ctx.fillStyle = this.color
    this.ctx.beginPath()
    this.ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
    this.ctx.fill()
    this.ctx.closePath()
  }

  explode() {
    if (this.exploded) return
    this.exploded = true
    this.game.catch()
    this.speed = -5
    this.size /= 10
    if (this.bomb) {
      this.game.over()
    }
  }

  onRaf() {
    if (!this.ready || this.game.gameOver) return
    this.acc += this.vel
    this.speed += this.acc
    this.y += this.speed

    if (this.y > (window.innerHeight * this.dpr) + this.size) {
      if (!this.exploded && !this.bomb) {
        this.game.loose()
      }
      if (this.game.gameOver) return
      this.regenerate()
    }
    this.draw()
  }
}


/*--------------------
Game
--------------------*/
class Game {
  constructor(obj) {
    Object.assign(this, obj)
    this.gameOver = false
  }

  loose() {
    this.lost += 1
    document.querySelector('#lost span').innerHTML = this.lost
  }

  catch() {
    this.catched += 1
    document.querySelector('#catched span').innerHTML = this.catched
  }


  over() {
    document.querySelector('.header').classList.add('game-over')
    this.gameOver = true
  }
}


/*--------------------
Init
--------------------*/
const canvas = new Canvas({
  id: 'canvas'
})

const game = new Game({
  catched: 0,
  lost: 0,
})

const Balls = []
for (let i = 0; i < 3; i++) {
  Balls.push(
    new Ball({
      ctx: canvas.ctx,
      dpr: canvas.dpr,
      color: '#ff0000',
      sizeMin: 35,
      sizeMax: 70,
      vel: 0.01,
      game: game
    })
  )
}

const trail = new Trail({
  ctx: canvas.ctx,
  dpr: canvas.dpr,
  length: 10,
  strokeMax: 15,
  strokeMin: 1,
  lineCap: 'round',
  fill: true,
  color: '#ffff00',
  balls: Balls
})
