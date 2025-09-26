class Enemies {
  constructor(name ,w, h, sprites, hp) {
    this.name = name[Math.floor(Math.random() * name.length - 1) + 1];
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
    
    // nama musuh
    ctx.font = "16px Arial";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.fillText(this.name, (this.pos.x + this.w / 2) - camera.x, this.pos.y - camera.y - 20);

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