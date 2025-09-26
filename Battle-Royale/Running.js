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

const enemyNames = [
  "Varkon",
  "Xythera",
  "Morgath",
  "Zarnok",
  "Thalgris",
  "Orekh",
  "Drelthor",
  "Kryvon",
  "Zephrak",
  "Baltrax",
  "Nokrus",
  "Velmor",
  "Azrik",
  "Torvash",
  "Ghulmor",
  "Zarkesh",
  "Pyrron",
  "Skareth",
  "Dravenox",
  "Ulthor",
  "Malgrith",
  "Vezrak",
  "Korthul",
  "Zygonar",
  "Obryss",
  "Darketh",
  "Vorathis",
  "Nyrgon",
  "Kravenor",
  "Throzak"
];

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
  output.textContent = String(vol.value / 100);
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
  player = new Player("Player" ,worldW, worldH, 65, 65, char1, 10);
  entities++;

  // spawn obstacles
  for (let o = 0; o < 20; o++) {
    let img = obsImgs[Math.floor(Math.random() * obsImgs.length)];
    obstacles.push(new Obs(worldW, worldH, 60, img));
  }

  // spawn musuh
  for (let e = 0; e < 20; e++) {
    enemies.push(new Enemies(enemyNames ,65, 65, char1, 5));
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
              killNotif(player.name, enemies[e].name)
              enemies.splice(e, 1); // musuh mati
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
          let playerBox = { x: player.pos.x, y: player.pos.y, w: player.w, h: player.h };
          if (isColliding(bulletBox, playerBox)) {
            enemyBullets.splice(i, 1);
            player.hp--;
            if (player.hp <= 0) {
              entities--;
              if (!gameover)
              killNotif(enemyBullets[i].shooter.name, player.name);
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
              killNotif(enemyBullets[i].shooter.name, enemies[e].name);
              enemies.splice(e, 1);
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
  const active = activeNotif;
  active.forEach(bg => bg.style.left = "-100%")
}