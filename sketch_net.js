let fondo;
let mano;
let letras;
let musica;
let glitchSound;
let criticalErrorImg; // "glitch.png"
let latec;

let manoMasked;
let maskImage;

let tuercas = [];
let desarmalosExtras = [];
let intervalo = 2000;
let ultimoSpawn = 0;

let volumenActual = 0;
let volumenObjetivo = 0;
let incrementoVolumen = 0.2;

let posicionesTuercas = [
  {x: 620, y: 420},
  {x: 480, y: 420},
  {x: 540, y: 690},
  {x: 670, y: 680}
];

let tuercasEliminadas = 0;
let juegoTerminado = false;
let mostrandoGlitch = false;
let tiempoGlitch = 0;
let generandoDesarmalos = true; // controla si se generan desarmalos

function preload() {
  fondo = loadImage("light phone.png");
  mano = loadImage("mano.webp");
  letras = loadImage("desarmalo2.png");
  musica = loadSound("sonido_estatica.mp3");
  glitchSound = loadSound("glitch sonido.mp3");
  criticalErrorImg = loadImage("critical error.png");
  latec = loadImage("latec.png");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  userStartAudio();
  
  musica.setVolume(0); 
  musica.loop();  

  // Crear máscara
  maskImage = createImage(mano.width, mano.height);
  maskImage.loadPixels();
  for (let y = 0; y < mano.height; y++) {
    for (let x = 0; x < mano.width; x++) {
      let alpha = (x < mano.width / 2) ? 255 : map(x, mano.width / 2, mano.width, 255, 0);
      let index = (x + y * mano.width) * 4;
      maskImage.pixels[index] = 255;
      maskImage.pixels[index + 1] = 255;
      maskImage.pixels[index + 2] = 255;
      maskImage.pixels[index + 3] = alpha;
    }
  }
  maskImage.updatePixels();
  manoMasked = mano.get();
  manoMasked.mask(maskImage);

  // Crear 4 tuercas iniciales
  tuercas.push(crearTuerca(620, 420));
  tuercas.push(crearTuerca(480, 420));
  tuercas.push(crearTuerca(540, 690));
  tuercas.push(crearTuerca(670, 680));
}

function draw() {

  if (juegoTerminado) {
    if (mostrandoGlitch) {
      imageMode(CENTER);
      image(criticalErrorImg, width/2, height/2, 500, 500);
      if (millis() - tiempoGlitch > 2000) {
        mostrandoGlitch = false; // Pasar a latec
      }
      return;
    } else {
      background(0);
      imageMode(CENTER);
      image(latec, width/2, height/2, 1000, 500);
      return;
    }
  }

  // Fondo y letras vibrantes
  image(fondo, 0, 0, width, height);
  let offsetX = random(-3, 3);
  let offsetY = random(-3, 3);
  image(letras, 300 + offsetX, 200 + offsetY, 800, 100);

  // Generar desarmalos solo si está permitido
  if (generandoDesarmalos && millis() - ultimoSpawn > intervalo) {
    crearDesarmalo();
    ultimoSpawn = millis();
  }

  // Dibujar desarmalos extras
  for (let d of desarmalosExtras) {
    let ox = random(-3, 3);
    let oy = random(-3, 3);
    image(d.img, d.x + ox, d.y + oy, d.w, d.h);
  }

  // Actualizar y dibujar tuercas
  for (let t of tuercas) {
    t.angulo = lerp(t.angulo, t.anguloObjetivo, t.velocidad);
    if (t.alpha > 0) {
      push();
      translate(t.x + t.w/2, t.y + t.h/2);
      rotate(t.angulo);
      imageMode(CENTER);
      tint(255, t.alpha);
      image(t.img, 0, 0, t.w, t.h);
      pop();
      noTint();
    }
  }

  // Mano sigue el mouse
  image(manoMasked, mouseX - 700/2, mouseY - 1100/2, 1000, 1000);

  // Suavizar volumen
  volumenActual = lerp(volumenActual, volumenObjetivo, 0.05);
  musica.setVolume(volumenActual);
}

function mousePressed() {
  if (juegoTerminado) return;

  volumenObjetivo += incrementoVolumen;
  if (volumenObjetivo > 1) volumenObjetivo = 1; 

  if (generandoDesarmalos) crearDesarmalo();

  for (let i = tuercas.length - 1; i >= 0; i--) {
    let t = tuercas[i];
    if (mouseX > t.x && mouseX < t.x + t.w && mouseY > t.y && mouseY < t.y + t.h) {
      t.anguloObjetivo += PI/5;
      t.clics++;
      t.alpha = 255 * (1 - t.clics/3);
      if (t.alpha < 0) t.alpha = 0;

      if (t.clics >= 3) {
        tuercas.splice(i, 1);
        glitchSound.play();
        tuercasEliminadas++;

        // Generar nuevas tuercas mientras queden menos de 2 y no llegamos a 10 eliminadas
        if (tuercasEliminadas < 15 && tuercas.length < 2) {
          let pos = random(posicionesTuercas);
          tuercas.push(crearTuerca(pos.x, pos.y));
        }

        // Terminar juego al llegar a 10
        if (tuercasEliminadas >= 10) {
          terminarJuego();
        }
      }
    }
  }
}

function crearDesarmalo() {
  let newX = random(0, width - 200);
  let newY = random(0, height - 50);
  desarmalosExtras.push({ img: letras, x: newX, y: newY, w: 200, h: 50 });
}

function crearTuerca(x, y) {
  return {
    x: x,
    y: y,
    w: 70,
    h: 70,
    img: loadImage("tuerca png.png"),
    angulo: 0,
    anguloObjetivo: 0,
    velocidad: 0.1,
    alpha: 255,
    clics: 0
  };
}

function terminarJuego() {
  juegoTerminado = true;
  generandoDesarmalos = false; // deja de crear nuevos desarmalos
  desarmalosExtras = []; // borrar desarmalos existentes
  // NO eliminamos tuercas, solo detenemos desarmalos

  if (musica.isPlaying()) musica.stop();
  if (glitchSound.isPlaying()) glitchSound.stop();

  mostrandoGlitch = true;
  tiempoGlitch = millis();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

