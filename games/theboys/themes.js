const ThemeTypes = {
  HELL: 0,
  HEAVEN: 1,
  MESOPOTAMIA: 2,
  WOODS: 3,
  UNIVERSAL: 4,
  SERVER: 5,
  SUSFEED_HQ: 6
}

function initPlatformTheme(p, theme, special) {
  p.theme = theme
  p.special = special
  p.active = true
  p.timer = 0
  p.baseY = p.y
  p.bouncePower = 0
  p.rotY = 0

  if (!special) return

  if (theme === ThemeTypes.HELL) {
    p.collapseDelay = 20
    p.triggered = false
    p.color = "#ff3300"
  }

  if (theme === ThemeTypes.HEAVEN) {
    p.liftHeight = 90
    p.liftSpeed = 5
    p.lifting = false
    p.color = "#31009b"
  }

  if (theme === ThemeTypes.MESOPOTAMIA) {
    p.liftHeight = 70
    p.liftSpeed = 0.03
    p.color = "#9c8a5a"
  }

  if (theme === ThemeTypes.WOODS) {
    p.bouncePower = 18
    p.color = "#2cff6a"
  }

  if (theme === ThemeTypes.UNIVERSAL) {
    p.rotSpeed = Math.PI / 80
    p.rotDir = 1
    p.color = "#ffffff"
  }
  if (theme === ThemeTypes.SERVER) {
    p.fpError = true
    p.launchPower = 16 + Math.random()
    p.cooldown = 0
    p.color = "#00ff88"
  }
  if (theme === ThemeTypes.SUSFEED_HQ) {
  p.collapseDelay = 30
  p.triggered = false

  p.liftHeight = 60
  p.liftSpeed = 2
  p.lifting = false

  p.waveTimer = 0
  p.waveSpeed = 0.04

  p.bouncePower = 22

  p.rotSpeed = Math.PI / 90
  p.rotDir = 1
  p.rotY = 0

  p.fpError = true
  p.launchPower = 18 + Math.random() * 2
  p.cooldown = 0

  p.color = "#ff0000"
}
}

function updatePlatformTheme(p) {
  if (!p.special) return

  if (p.theme === ThemeTypes.HELL && p.triggered) {
    p.timer++
    p.color = "#550000"
    if (p.timer > p.collapseDelay) p.active = false
  }

  if (p.theme === ThemeTypes.HEAVEN && p.lifting) {
    const targetY = p.baseY - p.liftHeight
    p.y -= p.liftSpeed

    if (p.y <= targetY) {
      p.y = targetY
      p.lifting = false
    }
  }

  if (p.theme === ThemeTypes.MESOPOTAMIA) {
    p.timer += p.liftSpeed
    p.y = p.baseY + Math.sin(p.timer) * p.liftHeight
  }

  if (p.theme === ThemeTypes.UNIVERSAL) {
    p.rotY += p.rotSpeed * p.rotDir

    if (p.rotY > Math.PI / 2) {
      p.rotY = Math.PI / 2
      p.rotDir = -1
    }

    if (p.rotY < -Math.PI / 2) {
      p.rotY = -Math.PI / 2
      p.rotDir = 1
    }
  }

  if (p.theme === ThemeTypes.SERVER) {
    if (p.cooldown > 0) p.cooldown--
    p.y = p.baseY + Math.sin((performance.now() + p.x * 13) * 0.004) * 2
  }

  if (p.theme === ThemeTypes.SUSFEED_HQ) {
  if (p.triggered) {
    p.timer++
    p.color = "#440022"
    if (p.timer > p.collapseDelay) p.active = false
  }

  if (p.lifting) {
    const targetY = p.baseY - p.liftHeight
    p.y -= p.liftSpeed
    if (p.y <= targetY) {
      p.y = targetY
      p.lifting = false
    }
  }

  p.waveTimer += p.waveSpeed
  p.y += Math.sin(p.waveTimer) * 1.5

  p.rotY += p.rotSpeed * p.rotDir
  if (p.rotY > Math.PI / 2 || p.rotY < -Math.PI / 2) {
    p.rotDir *= -1
  }

  if (p.cooldown > 0) p.cooldown--
}
}

function onPlatformLand(p, player) {
  if (!p.special) return

  if (p.theme === ThemeTypes.HELL) {
    p.triggered = true
  }

  if (p.theme === ThemeTypes.HEAVEN) {
    p.lifting = true
  }

  if (p.theme === ThemeTypes.WOODS) {
    player.vy = -p.bouncePower
  }

  if (p.theme === ThemeTypes.SERVER && p.cooldown === 0) {
    player.y -= 420
    player.vy = -p.launchPower
    player.jumps = 0
    p.cooldown = 60
  }

  if (p.theme === ThemeTypes.SUSFEED_HQ) {
  p.triggered = true
  p.lifting = true

  player.vy = -p.bouncePower

  if (p.cooldown === 0) {
    player.vy = -p.launchPower
    player.y = Math.min(player.y, p.y)
    player.jumps = 0
    p.cooldown = 80
  }
}
}
