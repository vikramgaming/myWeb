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