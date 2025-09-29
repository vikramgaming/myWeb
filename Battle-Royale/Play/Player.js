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
  constructor(name ,maxX, maxY, w, h, sprites, hp) {
    this.name = name;
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
          bullets.push(new Bullets(this.pos.x + this.w / 2, this.pos.y + this.h / 2, shootDir, this));
          try { fire.play(); } catch (e) {}
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
      // nama player
      ctx.font = "16px Arial";
      ctx.fillStyle = "white";
      ctx.textAlign = "center";
      ctx.fillText(this.name, (this.pos.x + this.w / 2 ) - camera.x, this.pos.y - camera.y - 20);
      
      // bar HP player
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
  constructor(x, y, dir, shooter) {
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