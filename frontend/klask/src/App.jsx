import { useEffect } from 'react';

const legacyMarkup = `
<div id="loadingScreen" class="loading-screen">
    <div class="klask-board">
        <div class="goal-hole goal-left"></div>
        <div class="goal-hole goal-right"></div>
        <div class="piece piece-1"></div>
        <div class="piece piece-2"></div>
        <div class="ball"></div>
    </div>
    <div class="loading-text">Loading...</div>
</div>

<div id="loginScreen" class="login-screen" style="display: none;">
    <a class="switch-to-klask4-btn switch-app-btn switch-app-btn-top-left" href="/klask-4">Klask-4</a>
    <div class="login-box">
        <h1>🎮 Klask</h1>
        <form id="loginForm" onsubmit="handleLogin(event)">
            <input type="text" id="loginUsername" placeholder="Username" required autocomplete="username" />
            <input type="password" id="loginPassword" placeholder="Password" required autocomplete="current-password" />
            <button type="submit">Login</button>
            <div id="loginError" class="login-error"></div>
        </form>
    </div>
</div>

<div id="mainApp" style="display: none;">
<a class="switch-to-klask4-btn switch-app-btn switch-app-btn-top-left" href="/klask-4">Klask-4</a>

<div id="notification" class="notification"></div>

<div id="h2hModal" class="h2h-modal" onclick="closeHeadToHeadPopup(event)">
    <div class="h2h-modal-content" onclick="event.stopPropagation()">
        <div class="h2h-modal-header">
            <h2 id="h2hModalTitle">Head to Head</h2>
            <button class="h2h-close-btn circular-btn circular-btn-md hover-scale-rotate" onclick="closeHeadToHeadPopup()">×</button>
        </div>
        <div id="h2hModalBody"></div>
    </div>
</div>

<button id="addPlayerBtn" class="icon-btn add-player-btn circular-btn" onclick="toggleAddPlayer()">+</button>
<button id="logoutBtn" class="icon-btn logout-btn circular-btn" onclick="handleLogout()">⎋</button>

<div id="addPlayerForm" class="add-player-form" style="display: none;">
    <input id="playerName" placeholder="Player name">
    <button onclick="addPlayer()">Add</button>
</div>

<hr>

<h2>🎮 New game</h2>

<select id="p1" onchange="handlePlayerSelect(1)"></select>

<div>
    <div>Score player 1</div>
    <div class="score-row" id="score1"></div>
</div>

<select id="p2" onchange="handlePlayerSelect(2)"></select>

<div>
    <div>Score player 2</div>
    <div class="score-row" id="score2"></div>
</div>

<button onclick="addMatch()">Save game</button>

<hr>

<h2>👑 Champion</h2>
<div class="champion-section">
    <div id="champion">—</div>
    <button class="change-champion-btn circular-btn circular-btn-md hover-scale" onclick="toggleChangeChampion()">✎</button>
</div>

<div id="changeChampionForm" class="add-player-form" style="display: none;">
    <select id="newChampion"></select>
    <button onclick="changeChampion()">Set</button>
</div>

<hr>

<h2>📊 Stats</h2>
<div id="stats"></div>

<hr>

<h2>📜 Game History</h2>
<div id="gameHistory"></div>

</div>
`;

function resolveKlask4Href(pathname) {
  if (pathname.includes('/frontend/klask/dist/')) {
    return './klask-4.html';
  }
  if (pathname.includes('/frontend/klask/')) {
    return './klask-4.html';
  }
  return '/klask-4';
}

export default function App() {
  useEffect(() => {
    const base = import.meta.env.BASE_URL || '/';

    if (!document.getElementById('klask-legacy-css')) {
      const link = document.createElement('link');
      link.id = 'klask-legacy-css';
      link.rel = 'stylesheet';
      link.href = `${base}legacy/css/styles.css`;
      document.head.appendChild(link);
    }

    document.querySelectorAll('.switch-to-klask4-btn')
      .forEach((btn) => btn.setAttribute('href', resolveKlask4Href(window.location.pathname)));

    const scriptPaths = ['legacy/js/game-logic.js', 'legacy/js/app.js'];
    const loadedScripts = [];

    const loadSequentially = (index) => {
      if (index >= scriptPaths.length) return;
      const script = document.createElement('script');
      script.src = `${base}${scriptPaths[index]}`;
      script.async = false;
      script.onload = () => loadSequentially(index + 1);
      document.body.appendChild(script);
      loadedScripts.push(script);
    };

    loadSequentially(0);

    return () => {
      loadedScripts.forEach((script) => script.remove());
    };
  }, []);

  return <div dangerouslySetInnerHTML={{ __html: legacyMarkup }} />;
}
