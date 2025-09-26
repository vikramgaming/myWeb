class Vector2 {
  constructor(x, y) {
    this.x = x; // posisi X
    this.y = y; // posisi Y
  }
  add(v) {
    return new Vector2(this.x + v.x, this.y + v.y); // penjumlahan vector
  }
  sub(v) {
    return new Vector2(this.x - v.x, this.y - v.y); // pengurangan vector
  }
  mul(n) {
    return new Vector2(this.x * n, this.y * n); // perkalian dengan skalar
  }
  div(n) {
    return new Vector2(this.x / n, this.y / n); // pembagian dengan skalar
  }
  mag() {
    return Math.sqrt(this.x ** 2 + this.y ** 2); // panjang vector
  }
  norm() {
    return this.mag() === 0 ? new Vector2(0, 0) : this.div(this.mag()); // normalisasi (arah)
  }
}

function circle(pos, radius, color, border_color, border_width) {
  ctx.beginPath(); // mulai gambar lingkaran
  ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2); // lingkaran isi
  ctx.fillStyle = color;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, radius + border_width / 2, 0, Math.PI * 2); // lingkaran border
  ctx.lineWidth = border_width;
  ctx.strokeStyle = border_color;
  ctx.stroke();
}

class Joystick {
  constructor(x, y, radius, handleRadius) {
    this.pos = new Vector2(x, y); // posisi handle
    this.origin = new Vector2(x, y); // posisi pusat joystick
    this.radius = radius; // radius area joystick
    this.handleRadius = handleRadius; // ukuran tombol joystick
    this.handleFriction = 0.25; // gesekan agar kembali ke tengah
    this.touchId = null; // id sentuhan
    this.ondrag = false; // apakah sedang digerakkan
    this.touchPos = new Vector2(0, 0); // posisi sentuhan
    this.listener(); // aktifkan event listener
  }
  listener() {
    addEventListener('touchstart', e => { // ketika disentuh
      for (let touch of e.changedTouches) {
        let pos = new Vector2(touch.pageX, touch.pageY);
          if (pos.sub(this.origin).mag() <= this.radius && this.touchId === null) {
            this.touchId = touch.identifier; // simpan id sentuhan
            this.touchPos = pos; // posisi sentuh
            this.ondrag = true; // joystick aktif
          }
        }
    });
    addEventListener('touchend', e => { // ketika lepas
      for (let touch of e.changedTouches) {
        if (touch.identifier === this.touchId) {
          this.touchId = null;
          this.ondrag = false; // joystick mati
        }
      }
    });
    addEventListener('touchmove', e => { // ketika digeser
      for (let touch of e.changedTouches) {
        if (touch.identifier === this.touchId) {
          this.touchPos = new Vector2(touch.pageX, touch.pageY); // update posisi sentuh
        }
      }
    });
  }
  reposition() {
    if (!this.ondrag) {
      // kembali ke pusat dengan gesekan
      this.pos = this.pos.add(this.origin.sub(this.pos).mul(this.handleFriction));
    }
    else {
      const diff = this.touchPos.sub(this.origin); // jarak dari pusat
      const maxDist = Math.min(diff.mag(), this.radius); // batas radius
      this.pos = this.origin.add(diff.norm().mul(maxDist)); // posisi handle
    }
  }
  draw() {
    circle(this.origin, this.radius, '#707070', "black", 0.5); // lingkaran dasar
    circle(this.pos, this.handleRadius, '#3d3d3d', "black", 0.5); // lingkaran handle
  }
  update() {
    this.reposition(); // update posisi joystick
    this.draw(); // gambar joystick
  }
}

function img(...sources) {
  return sources.map(src => {
    let img = new Image(); // buat gambar baru
    img.src = src; // set sumber gambar
    return img;
  });
}

class Player {
  constructor(maxX, maxY, w, h, sprites, hp) {
    this.pos = new Vector2(
      Math.floor(Math.random() * (maxX - 70)),
      Math.floor(Math.random() * (maxY - 70)));// posisi random player
    this.w = w; // lebar player
    this.h = h; // tinggi player
    this.hp = hp; // darah
    this.maxHP = hp; // maks darah
    this.sprites = sprites; // animasi player
    this.frameIndex = sprites.length - 1; // index frame animasi
    this.frameTick = 0; // counter frame
    this.frameSpeed = 18; // kecepatan animasi
    this.speed = 1.5; // kecepatan gerak
    this.facingLeft = false; // arah hadap player
    this.shootCooldown = 0; // delay tembak

  }
  update(joystick, fireJoystick) {
    if (this.hp > 0) {
      this.draw(); // gambar player
      const dir = joystick.pos.sub(joystick.origin); // arah gerakan joystick
      this.camera(); // atur kamera layar ke player
      if (dir.mag() > 5) {
        const moveVec = dir.norm().mul(this.speed); // vektor gerakan
  
        // gerakan X
        let newPosX = new Vector2(this.pos.x + moveVec.x, this.pos.y);
        let playerBoxX = { x: newPosX.x, y: newPosX.y, w: this.w, h: this.h };
        let collideX = obstacles.some(obs => isColliding(playerBoxX, obs));
        if (!collideX) this.pos.x = newPosX.x;
  
        // gerakan Y
        let newPosY = new Vector2(this.pos.x, this.pos.y + moveVec.y);
        let playerBoxY = { x: newPosY.x, y: newPosY.y, w: this.w, h: this.h };
        let collideY = obstacles.some(obs => isColliding(playerBoxY, obs));
        if (!collideY) this.pos.y = newPosY.y;
  
        // update arah hadap
        if (moveVec.x < 0) this.facingLeft = true;
        else if (moveVec.x > 0) this.facingLeft = false;
  
        // update animasi
        this.frameTick++;
        if (this.frameTick > this.frameSpeed) {
          this.frameIndex = (this.frameIndex + 1) % this.sprites.length;
          this.frameTick = 0;
        }
      }
      else {
        this.frameIndex = this.sprites.length - 1; // idle
      }
      // tembak jika joystick kanan aktif
      const shootDir = fireJoystick.pos.sub(fireJoystick.origin);
      if (fireJoystick.ondrag && shootDir.mag() > 5) {
        if (!this.shootCooldown) {
          bullets.push(new Bullets(this.pos.x + this.w / 2, this.pos.y + this.h / 2, shootDir));
          try { fire.play(); } catch (e) {};
          this.shootCooldown = 30; // cooldown
        }
      }
      if (this.shootCooldown) this.shootCooldown--;
    }
  }
  
  camera() {
    camera.x = this.pos.x + this.w / 2 - canvas.width / 2; // kamera ke player
    camera.y = this.pos.y + this.h / 2 - canvas.height / 2;
    camera.x = Math.max(0, Math.min(camera.x, worldW - canvas.width)); // batas kamera
    camera.y = Math.max(0, Math.min(camera.y, worldH - canvas.height));
  }
  
  draw() {
    if (this.sprites[this.frameIndex]) {
      if (this.facingLeft) {
        // gambar player terbalik (mirror)
        ctx.save();
        ctx.translate(this.pos.x - camera.x + this.w, this.pos.y - camera.y);
        ctx.scale(-1, 1);
        ctx.drawImage(this.sprites[this.frameIndex], 0, 0, this.w, this.h);
        ctx.restore();
      }
      else {
        ctx.drawImage(this.sprites[this.frameIndex], this.pos.x - camera.x, this.pos.y - camera.y, this.w, this.h);
      }
      // bar HP musuh
      ctx.fillStyle = "black";
      ctx.fillRect(this.pos.x - camera.x, this.pos.y - camera.y - 10, this.w, 5);
      ctx.fillStyle = "lime";
      ctx.fillRect(this.pos.x - camera.x, this.pos.y - camera.y - 10, (this.hp / this.maxHP) * this.w, 5);
    }
    if (devmode) {
      // debug hitbox player
      ctx.beginPath();
      ctx.rect(this.pos.x - camera.x, this.pos.y - camera.y, this.w, this.h);
      ctx.strokeStyle = "white";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
}

class Bullets {
  constructor(x, y, dir, shooter=null) {
    this.pos = new Vector2(x, y); // posisi awal peluru
    this.dir = dir.norm(); // arah tembakan (normalisasi biar konsisten)
    this.speed = 3; // kecepatan peluru
    this.size = 5; // ukuran peluru
    this.duration = 0; // durasi peluru
    this.shooter = shooter; // siapa yang menembak
  }
  update() {
    this.pos = this.pos.add(this.dir.mul(this.speed)); // gerakan peluru
    this.duration++;
    this.draw(); // gambar peluru
  }
  draw() {
    ctx.fillStyle = "yellow"; // warna peluru
    ctx.fillRect(this.pos.x - camera.x, this.pos.y - camera.y, this.size, this.size);
    if (devmode) {
      // debug hitbox peluru
      ctx.beginPath();
      ctx.rect(this.pos.x - camera.x, this.pos.y - camera.y, this.size, this.size);
      ctx.strokeStyle = "red";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
}

class Enemies {
  constructor(w, h, sprites, hp) {
    this.w = w; // lebar musuh
    this.h = h; // tinggi musuh
    this.hp = hp; // darah musuh
    this.maxHP = hp; // maks darah musuh
    this.sprites = sprites; // animasi musuh
    this.frameIndex = sprites.length - 1; // frame animasi awal
    this.frameTick = 0; // counter frame
    this.frameSpeed = 18; // kecepatan animasi
    this.speed = 1; // kecepatan gerak musuh
    this.facingLeft = false; // arah hadap musuh
    this.shootCooldown = 0; // cooldown tembak

    const minDist = 150; // jarak minimal dari player & obstacle
    let valid = false;

    // tentukan posisi awal musuh
    while (!valid) {
      this.pos = new Vector2(
        Math.round(Math.random() * (worldW - this.w)),
        Math.round(Math.random() * (worldH - this.h))
      );

      const distToPlayer = this.pos.sub(player.pos).mag(); // jarak ke player

      let distToObs = Infinity; // jarak ke obstacle terdekat
      for (let obs of obstacles) {
        const dx = this.pos.x - obs.pos.x;
        const dy = this.pos.y - obs.pos.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < distToObs) distToObs = d;
      }

      if (distToPlayer > minDist && distToObs > minDist) {
        valid = true; // posisi valid
      }
    }

    this.delay = 0; // delay untuk ganti tujuan jalan
    this.destination = new Vector2(
      Math.random() * (worldW - this.w),
      Math.random() * (worldH - this.h)
    ); // tujuan musuh
  }

  update() {
    if (this.hp > 0) {
      this.draw(); // gambar musuh kalau masih hidup
      this.delay++;
      if (this.delay >= 240) { // ganti tujuan setiap 240 tick
        this.delay = 0;
        this.destination = new Vector2(
          Math.random() * (width - this.w),
          Math.random() * (height - this.h)
        );
      }
  
      const dir = this.destination.sub(this.pos); // arah ke tujuan
      if (dir.mag() > 2) { // kalau belum sampai
        const moveVec = dir.norm().mul(this.speed); // vektor gerakan
  
        // gerakan X
        let newPosX = new Vector2(this.pos.x + moveVec.x, this.pos.y);
        let enemiesBoxX = { x: newPosX.x, y: newPosX.y, w: this.w, h: this.h };
        let collideX = obstacles.some(obs => isColliding(enemiesBoxX, obs));
        if (!collideX) this.pos.x = newPosX.x;
  
        // gerakan Y
        let newPosY = new Vector2(this.pos.x, this.pos.y + moveVec.y);
        let enemiesBoxY = { x: newPosY.x, y: newPosY.y, w: this.w, h: this.h };
        let collideY = obstacles.some(obs => isColliding(enemiesBoxY, obs));
        if (!collideY) this.pos.y = newPosY.y;
  
        // update arah hadap musuh
        if (moveVec.x < 0) this.facingLeft = true;
        else if (moveVec.x > 0) this.facingLeft = false;
  
        // update animasi musuh
        this.frameTick++;
        if (this.frameTick > this.frameSpeed) {
          this.frameIndex = (this.frameIndex + 1) % this.sprites.length;
          this.frameTick = 0;
        }
      }
      else {
        this.frameIndex = this.sprites.length - 1; // idle
      }
      // --- AI TEMBAK ---
      if (this.hp > 0) {
        // cari target terdekat (player atau musuh lain)
        let target;
        if (player.hp >= 0) target = player;
        let nearestDist = this.pos.sub(player.pos).mag();
  
        for (let e of enemies) {
          if (e !== this && e.hp > 0) {
            let dist = this.pos.sub(e.pos).mag();
            if (dist < nearestDist) {
              nearestDist = dist;
              target = e;
            }
          }
        }
  
        // arah ke target
        let distToPlayer = this.pos.sub(player.pos).mag(); // jarak ke player
        if (target && nearestDist < 300) {
          let dir = target.pos.sub(this.pos);
          if (!this.shootCooldown && dir.mag() > 30) { // jangan tembak kalau terlalu dekat
            enemyBullets.push(new Bullets(
              this.pos.x + this.w / 2,
              this.pos.y + this.h / 2,
              dir,
              this // musuh sebagai shooter
            ));
            this.shootCooldown = 90; // cooldown musuh
            if (distToPlayer < 500) {
              try { enemyFire.play(); } catch (e) {};
            }
          }
        }
  
        if (this.shootCooldown > 0) this.shootCooldown--;
      }
    }
  }

  draw() {
    if (this.sprites[this.frameIndex]) {
      if (this.facingLeft) {
        // gambar musuh terbalik
        ctx.save();
        ctx.translate(this.pos.x - camera.x+ this.w, this.pos.y - camera.y);
        ctx.scale(-1, 1);
        ctx.drawImage(this.sprites[this.frameIndex], 0, 0, this.w, this.h);
        ctx.restore();
      }
      else {
        ctx.drawImage(this.sprites[this.frameIndex], this.pos.x - camera.x, this.pos.y - camera.y, this.w, this.h);
      }
    }

    // bar HP musuh
    ctx.fillStyle = "black";
    ctx.fillRect(this.pos.x - camera.x, this.pos.y - camera.y - 10, this.w, 5);
    ctx.fillStyle = "red";
    ctx.fillRect(this.pos.x - camera.x, this.pos.y - camera.y - 10, (this.hp / this.maxHP) * this.w, 5);

    if (devmode) {
      // debug hitbox musuh
      ctx.beginPath();
      ctx.rect(this.pos.x - camera.x, this.pos.y - camera.y, this.w, this.h);
      ctx.strokeStyle = "white";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
}

function isColliding(a, b) {
  // cek tabrakan kotak (AABB collision)
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

class Obs {
  constructor(x, y, size, img) {
    this.limit = new Vector2(x, y); // batas canvas
    this.size = size; // ukuran obstacle
    this.img = img; // gambar obstacle

    const minDist = 150; // jarak minimal dari player
    const minObsDist = size + 50; // jarak minimal antar obstacle (bisa disesuaikan)
    let valid = false;

    //mencari posisi obstacles
    while (!valid) {
      this.randomPos = new Vector2(
        Math.floor(Math.random() * (this.limit.x - size)),
        Math.floor(Math.random() * (this.limit.y - size))
      );

      const distToPlayer = this.randomPos.sub(player.pos).mag();

      // cek jarak dengan obstacle lain
      let tooClose = false;
      for (let obs of obstacles) {
        const dx = this.randomPos.x - obs.pos.x;
        const dy = this.randomPos.y - obs.pos.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < minObsDist) { 
          tooClose = true; 
          break;
        }
      }

      if (distToPlayer > minDist && !tooClose) {
        valid = true; // posisi valid
      }
    }

    this.pos = new Vector2(this.randomPos.x, this.randomPos.y);
    this.x = this.pos.x;
    this.y = this.pos.y;
    this.w = size;
    this.h = size;
  }

  draw() {
    ctx.drawImage(this.img, this.pos.x - camera.x, this.pos.y - camera.y, this.size, this.size);
    if (devmode) {
      // debug hitbox obstacle
      ctx.beginPath();
      ctx.rect(this.pos.x - camera.x, this.pos.y - camera.y, this.size, this.size);
      ctx.strokeStyle = "blue";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
}

function killNotif(kill, killed) {
  if (activeNotif.length >= 3) {
    const active = activeNotif.shift();
    active.style.left = "-100%";
  }
  if (activeNotif.length > 0) {
    const active = activeNotif;
    active.forEach(bg => {bg.style.transform += "translateY(-20px)"});
  }
  
  const container = document.getElementById("container");
  const newNotif = document.createElement("div");
  newNotif.classList.add("killBG");
  newNotif.innerHTML = `<p id='kill'>${kill}</p><p id='killed'>${killed}</p>`;
  
  container.appendChild(newNotif);
  setTimeout(() => {
    newNotif.style.left = "0%";
    setTimeout(() => {
      newNotif.style.left = "-100%";
      setTimeout(() => {newNotif.remove();}, 350);
      activeNotif = activeNotif.filter(box => box !== newNotif);
    }, 2500);
  }, 50);
  
  activeNotif.push(newNotif);
}

const canvas = document.getElementById("GameCanvas");
const ctx = canvas.getContext("2d");
const count = document.getElementById("entities"); //menghitung musuh

const fire = new Audio("Play/audio/fire.ogg");
const enemyFire = new Audio("Play/audio/fire.ogg");
const vol = document.getElementById("volume");
const output = document.getElementById("output");

const dev = document.getElementById("dev");

let char1 = img(
  "Play/character/walk1.png",
  "Play/character/walk2.png",
  "Play/character/walk3.png",
  "Play/character/idle.png"
);

let obsImgs = img(
  "Play/box.png"
)

const width = canvas.width = window.innerWidth;
const height = canvas.height = window.innerHeight;
const worldW = width*3;
const worldH = height*3;
let camera = {
      x: 0,
      y: 0,
      w: canvas.width,
      h: canvas.height
}
const FPS = 120;
console.log(width, height)

let loop, player, gameover;
let entities = 0;

let joysticks = [
  new Joystick(80, height - 120, 50, 25),
  new Joystick(width - 80, height - 120, 50, 25)
];

let bullets = [];       // peluru player
let enemyBullets = [];  // peluru musuh
let obstacles = [];
let enemies = [];
let activeNotif = [];

//Settings
vol.addEventListener("input", () => {
  output.textContent = vol.value / 100;
  fire.volume = vol.value / 100;
  enemyFire.volume = (vol.value / 100) / 2;
});

let devmode = false;
dev.addEventListener("change", () => {
  dev.checked ? devmode = true : devmode = false;
});

function settings() {
  document.querySelector(".Mainmenu").classList.add("hidden");
  document.querySelector(".settings").classList.remove("hidden");
}

function exit() {
  document.querySelector(".Mainmenu").classList.remove("hidden");
  document.querySelector(".settings").classList.add("hidden");
}

// -----------------
// LOOP GAME
// -----------------
function start() {
  document.querySelector(".Mainmenu").classList.add("hidden");
  document.querySelector(".Maingame").classList.remove("hidden");

  // spawn player
  player = new Player(worldW, worldH, 65, 65, char1, 10);
  entities++;

  // spawn obstacles
  for (let o = 0; o < 20; o++) {
    let img = obsImgs[Math.floor(Math.random() * obsImgs.length)];
    obstacles.push(new Obs(worldW, worldH, 60, img));
  }

  // spawn musuh
  for (let e = 0; e < 20; e++) {
    enemies.push(new Enemies(65, 65, char1, 5));
    entities++;
  }

  // loop utama
  if (!loop) {
    loop = setInterval(() => {
      ctx.clearRect(0, 0, width, height); // clear canvas
      player.update(joysticks[0], joysticks[1]); // gerakkan dan tembakan player

      // update musuh
      for (let e = enemies.length - 1; e >= 0; e--) {
        enemies[e].update();

        // cek peluru kena musuh
        for (let i = bullets.length - 1; i >= 0; i--) {
          let bulletBox = {
            x: bullets[i].pos.x,
            y: bullets[i].pos.y,
            w: bullets[i].size,
            h: bullets[i].size
          };

          let enemiesBox = {
            x: enemies[e].pos.x,
            y: enemies[e].pos.y,
            w: enemies[e].w,
            h: enemies[e].h
          };

          if (isColliding(bulletBox, enemiesBox)) {
            bullets.splice(i, 1); // peluru hilang
            enemies[e].hp--; // HP musuh berkurang
            if (enemies[e].hp <= 0) {
              enemies.splice(e, 1); // musuh mati
              killNotif("player", e);
              entities--;
            }
            break;
          }
        }
      }
      
      // update peluru musuh
      for (let i = enemyBullets.length - 1; i >= 0; i--) {
        enemyBullets[i].update();
      
        let bulletBox = {
          x: enemyBullets[i].pos.x,
          y: enemyBullets[i].pos.y,
          w: enemyBullets[i].size,
          h: enemyBullets[i].size
        };
      
        // hapus peluru setelah 2 detik
        if (enemyBullets[i].duration > 240) {
          enemyBullets.splice(i, 1);
          continue;
        }
      
        // cek kena player
        if (player.hp >= 0) {
          let playerBox = {
            x: player.pos.x,
            y: player.pos.y,
            w: player.w,
            h: player.h
          };
          
          if (isColliding(bulletBox, playerBox)) {
            enemyBullets.splice(i, 1);
            player.hp--;
            if (player.hp <= 0) {
              entities--;
              if (!gameover)
              document.getElementById("GameOver").textContent = "Game Over";
              document.getElementById("GameOver").style.display = "block";
              gameover = true;
            }
            continue;
          }
        }
      
        // cek kena musuh lain
        for (let e = enemies.length - 1; e >= 0; e--) {
          if (enemyBullets[i].shooter === enemies[e]) continue; // skip penembak sendiri
          
          let enemiesBox = {
            x: enemies[e].pos.x,
            y: enemies[e].pos.y,
            w: enemies[e].w,
            h: enemies[e].h
          };
        
          if (isColliding(bulletBox, enemiesBox)) {
            enemyBullets.splice(i, 1);
            enemies[e].hp--;
            if (enemies[e].hp <= 0) {
              enemies.splice(e, 1);
              killNotif("player", e)
              entities--;
            }
            break;
          }
        }
      
        // cek tabrak obstacle
        for (let obs of obstacles) {
          if (isColliding(bulletBox, obs)) {
            enemyBullets.splice(i, 1);
            break;
          }
        }
      }

      // update peluru
      for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].update();

        let bulletBox = {
          x: bullets[i].pos.x,
          y: bullets[i].pos.y,
          w: bullets[i].size,
          h: bullets[i].size
        };

        // hapus peluru setelah 2 detik
        if (bullets[i].duration > 240) {
          bullets.splice(i, 1);
          continue;
        }

        // cek peluru tabrak obstacle
        for (let obs of obstacles) {
          if (isColliding(bulletBox, obs)) {
            bullets.splice(i, 1);
            break;
          }
        }
      }
      
      // gambar obstacle
      for (let obs of obstacles) {
        obs.draw();
      }
 
      // update joystick
      for (let j of joysticks) {
        j.update();
      }
      
      count.textContent = entities + " players left";
      if (entities === 1 && player.hp > 0) {
        if(!gameover) {
          document.getElementById("GameOver").textContent = "You Win";
          document.getElementById("GameOver").style.display = "block";
          gameover = true;
        }
      }
    }, 1000 / FPS); // jalankan sesuai FPS
  }
}

function stop() {
  document.querySelector(".Maingame").classList.add("hidden");
  document.querySelector(".Mainmenu").classList.remove("hidden");
  document.getElementById("GameOver").style.display = "none";
  gameover = false;
  obstacles = [];
  enemies = [];
  entities = 0;
  ctx.clearRect(0, 0, width, height);
  clearInterval(loop);
  player = null;
  loop = null;
} 