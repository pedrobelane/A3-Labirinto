const canvas = document.getElementById('maze');
const ctx = canvas.getContext('2d');
const statusDiv = document.getElementById('status');
let N = 51, DELAY = 25, cellSize = 25;

function criarGradeInicial(n) {
  return Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) =>
      i % 2 === 1 && j % 2 === 1 ? 0 : 1
    )
  );
}

function embaralhar(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function gerarLabirintoComSolucao(n) {
  const labirinto = criarGradeInicial(n);
  const visitado = Array.from({ length: Math.floor(n / 2) }, () =>
    Array(Math.floor(n / 2)).fill(false)
  );
  function cavar(cx, cy) {
    visitado[cx][cy] = true;
    const direcoes = embaralhar([
      [0, 1], [1, 0], [0, -1], [-1, 0]
    ]);
    for (const [dx, dy] of direcoes) {
      const nx = cx + dx, ny = cy + dy;
      if (
        nx >= 0 && ny >= 0 &&
        nx < visitado.length &&
        ny < visitado[0].length &&
        !visitado[nx][ny]
      ) {
        const x1 = 2 * cx + 1, y1 = 2 * cy + 1;
        const x2 = 2 * nx + 1, y2 = 2 * ny + 1;
        labirinto[(x1 + x2) / 2][(y1 + y2) / 2] = 0;
        cavar(nx, ny);
      }
    }
  }
  cavar(0, 0);
  return labirinto;
}

function escolherEntradaSaida(maze) {
  const n = maze.length;
  const lados = [
    Array.from({ length: n }, (_, i) => [0, i]).filter(([x, y]) => y !== 0 && y !== n - 1),
    Array.from({ length: n }, (_, i) => [n - 1, i]).filter(([x, y]) => y !== 0 && y !== n - 1),
    Array.from({ length: n }, (_, i) => [i, 0]).filter(([x, y]) => x !== 0 && x !== n - 1),
    Array.from({ length: n }, (_, i) => [i, n - 1]).filter(([x, y]) => x !== 0 && x !== n - 1),
  ];
  let ladoEntrada, ladoSaida;
  do {
    ladoEntrada = Math.floor(Math.random() * 4);
    ladoSaida = (ladoEntrada + 2) % 4;
  } while (lados[ladoEntrada].length === 0 || lados[ladoSaida].length === 0);
  const entrada = lados[ladoEntrada][Math.floor(Math.random() * lados[ladoEntrada].length)];
  let maxDist = -1, saida = lados[ladoSaida][0];
  for (const pos of lados[ladoSaida]) {
    const dist = Math.abs(pos[0] - entrada[0]) + Math.abs(pos[1] - entrada[1]);
    if (dist > maxDist) { maxDist = dist; saida = pos; }
  }
  maze[entrada[0]][entrada[1]] = 0;
  maze[saida[0]][saida[1]] = 0;
  return { entrada, saida };
}

function desenharLabirinto(maze, visitado, caminho, entrada, saida) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < maze.length; i++) {
    for (let j = 0; j < maze[i].length; j++) {
      let color = "#222";
      if (maze[i][j] === 1) color = "#888";
      if (visitado && visitado[i][j]) color = "#c44";
      if (caminho && caminho.some(([x, y]) => x === i && y === j)) color = "#0f0";
      if (entrada && i === entrada[0] && j === entrada[1]) color = "#39f";
      if (saida && i === saida[0] && j === saida[1]) color = "#f0f";
      ctx.fillStyle = color;
      ctx.fillRect(j * cellSize, i * cellSize, cellSize, cellSize);
    }
  }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function resolverLabirintoIterativo(maze, entrada, saida, visitado, caminho, DELAY) {
  const stack = [[entrada[0], entrada[1], []]];
  while (stack.length > 0) {
    const [x, y, caminhoAtual] = stack.pop();
    if (x === saida[0] && y === saida[1]) {
      caminho.push(...caminhoAtual, [x, y]);
      desenharLabirinto(maze, visitado, caminho, entrada, saida);
      return true;
    }
    if (
      x < 0 || y < 0 ||
      x >= maze.length || y >= maze[0].length ||
      maze[x][y] !== 0 ||
      visitado[x][y]
    ) continue;
    visitado[x][y] = true;
    const novoCaminho = [...caminhoAtual, [x, y]];
    desenharLabirinto(maze, visitado, novoCaminho, entrada, saida);
    await sleep(DELAY);
    for (const [dx, dy] of [[0,1],[1,0],[0,-1],[-1,0]]) {
      stack.push([x + dx, y + dy, novoCaminho]);
    }
  }
  return false;
}

async function gerarEResolver() {
  N = parseInt(document.getElementById('size').value);
  DELAY = parseInt(document.getElementById('delay').value);
  cellSize = Math.floor(525 / N);
  canvas.width = canvas.height = cellSize * N;
  statusDiv.textContent = "Gerando labirinto...";
  const labirinto = gerarLabirintoComSolucao(N);
  const { entrada, saida } = escolherEntradaSaida(labirinto);
  const visitado = Array.from({ length: N }, () => Array(N).fill(false));
  const caminho = [];
  desenharLabirinto(labirinto, null, null, entrada, saida);
  statusDiv.textContent = "Resolvendo...";
  const sucesso = await resolverLabirintoIterativo(
    labirinto, entrada, saida, visitado, caminho, DELAY
  );
  if (sucesso) {
    statusDiv.textContent = "Labirinto resolvido com sucesso!";
  } else {
    statusDiv.textContent = "Não foi possível resolver o labirinto.";
  }
}

document.getElementById('gerar').onclick = gerarEResolver;
window.onload = gerarEResolver;