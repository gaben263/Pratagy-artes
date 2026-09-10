// Confete comemorativo ao concluir uma exportação.
//
// Feito à mão em Canvas, sem biblioteca: o projeto não tem bundler e depender de
// mais um CDN só para isso aumentaria a chance de quebrar numa rede corporativa
// que bloqueie domínios externos — o mesmo motivo que já levou os ícones a terem
// fallback inline.
//
// São dois canhões nos cantos inferiores, disparando para dentro da tela. O
// canvas é criado sob demanda e removido quando a última partícula some, então
// não fica nada rodando nem ocupando memória fora do momento da comemoração.

// Só cores oficiais da marca — o confete não é lugar para inventar paleta.
const CORES = [
  '#004F9F',
  '#008BCE',
  '#4CC2F1',
  '#C0E5FB',
  '#E95029',
  '#F7A600',
  '#FDD945',
  '#B3CA63',
  '#8FB82A',
  '#FDD491',
];

const DURACAO_MS = 2600;
const GRAVIDADE = 0.3;
const ARRASTO = 0.991;
const POR_CANHAO = 70;

let canvas = null;
let ctx = null;
let particulas = [];
let rafId = null;
let inicio = 0;

function ajustarTamanho() {
  if (!canvas) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function criarCanvas() {
  canvas = document.createElement('canvas');
  // z acima do modal (z-50) e do toast (z-60); pointer-events desligado para o
  // confete nunca interceptar um clique do usuário.
  canvas.className = 'pointer-events-none fixed inset-0 z-[70]';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);
  ctx = canvas.getContext('2d');
  ajustarTamanho();
  window.addEventListener('resize', ajustarTamanho);
}

function destruirCanvas() {
  window.removeEventListener('resize', ajustarTamanho);
  canvas?.remove();
  canvas = null;
  ctx = null;
  particulas = [];
  rafId = null;
}

function canhao(origemX, origemY, anguloBase, escala) {
  for (let i = 0; i < POR_CANHAO; i++) {
    const angulo = anguloBase + (Math.random() - 0.5) * 0.95;
    const forca = (13 + Math.random() * 13) * escala;
    particulas.push({
      x: origemX,
      y: origemY,
      vx: Math.cos(angulo) * forca,
      vy: Math.sin(angulo) * forca,
      largura: (6 + Math.random() * 6) * escala,
      altura: (9 + Math.random() * 7) * escala,
      cor: CORES[Math.floor(Math.random() * CORES.length)],
      rotacao: Math.random() * Math.PI * 2,
      vRotacao: (Math.random() - 0.5) * 0.28,
      // `giro` simula o papel virando de frente para o verso: o eixo Y é
      // achatado por cos(giro), o que dá o brilho de folha girando no ar.
      giro: Math.random() * Math.PI * 2,
      vGiro: 0.08 + Math.random() * 0.12,
      redondo: Math.random() < 0.25,
    });
  }
}

function desenhar(agora) {
  const decorrido = agora - inicio;
  const largura = window.innerWidth;
  const altura = window.innerHeight;

  ctx.clearRect(0, 0, largura, altura);

  // Últimos 30% do tempo são de desvanecimento, para o confete não sumir de uma vez.
  const progresso = decorrido / DURACAO_MS;
  const alpha = progresso < 0.7 ? 1 : Math.max(0, 1 - (progresso - 0.7) / 0.3);

  for (const p of particulas) {
    p.vy += GRAVIDADE;
    p.vx *= ARRASTO;
    p.vy *= ARRASTO;
    p.x += p.vx;
    p.y += p.vy;
    p.rotacao += p.vRotacao;
    p.giro += p.vGiro;

    if (p.y - p.altura > altura) continue; // já saiu por baixo

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotacao);
    ctx.scale(1, Math.cos(p.giro));
    ctx.fillStyle = p.cor;
    if (p.redondo) {
      ctx.beginPath();
      ctx.ellipse(0, 0, p.largura / 2, p.altura / 2, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillRect(-p.largura / 2, -p.altura / 2, p.largura, p.altura);
    }
    ctx.restore();
  }

  const acabou = decorrido >= DURACAO_MS || particulas.every((p) => p.y - p.altura > altura);
  if (acabou) {
    destruirCanvas();
    return;
  }
  rafId = requestAnimationFrame(desenhar);
}

/**
 * Dispara a comemoração. Chamado quando uma exportação termina com sucesso.
 *
 * Respeita `prefers-reduced-motion`: quem pediu menos animação no sistema não
 * recebe nada, e o feedback de sucesso continua sendo o toast.
 */
export function comemorar() {
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

  const largura = window.innerWidth;
  const altura = window.innerHeight;
  // A força acompanha o tamanho da janela, senão o confete mal sobe no desktop
  // e atravessa a tela inteira no celular.
  const escala = Math.min(1.35, Math.max(0.7, altura / 820));

  if (!canvas) criarCanvas();

  // Chamadas seguidas reaproveitam o canvas e reiniciam o relógio, em vez de
  // empilhar dois loops de animação concorrentes. As partículas que já caíram
  // saem da lista para o array não crescer a cada exportação seguida.
  particulas = particulas.filter((p) => p.y - p.altura <= altura);
  inicio = performance.now();
  canhao(0, altura, -Math.PI / 3, escala); // canto inferior esquerdo, sobe para a direita
  canhao(largura, altura, (-2 * Math.PI) / 3, escala); // inferior direito, sobe para a esquerda

  if (rafId === null) rafId = requestAnimationFrame(desenhar);
}
