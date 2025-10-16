const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');

let score = 0;

// プレイヤー（シーサー）
const player = {
    x: canvas.width / 2 - 25,
    y: canvas.height - 60,
    width: 50,
    height: 50,
    speed: 5,
    dx: 0, // 移動量
    // シーサーの描画（簡易的な形状）
    draw: function() {
        ctx.fillStyle = '#d35400'; // 赤茶色
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = '#f1c40f'; // 黄色
        ctx.fillRect(this.x + 10, this.y + 10, 10, 10); // 左目
        ctx.fillRect(this.x + 30, this.y + 10, 10, 10); // 右目
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(this.x + 10, this.y + 35, 30, 5); // 口
    }
};

// 弾
const bullets = [];

// 敵
const enemies = [];
const enemyRowCount = 5;
const enemyColumnCount = 10;
const enemyWidth = 50;
const enemyHeight = 20;
const enemyPadding = 10;
const enemyOffsetTop = 30;
const enemyOffsetLeft = 30;

const enemyBullets = [];
const enemyShootInterval = 1000; // 1秒ごとに敵が弾を撃つチャンス
let lastEnemyShot = 0;

let gameOver = false;
let animationId;

let enemyDx = 2;
let enemyDy = 20;

// 敵の作成
function createEnemies() {
    for (let c = 0; c < enemyColumnCount; c++) {
        for (let r = 0; r < enemyRowCount; r++) {
            enemies.push({
                x: c * (enemyWidth + enemyPadding) + enemyOffsetLeft,
                y: r * (enemyHeight + enemyPadding) + enemyOffsetTop,
                width: enemyWidth,
                height: enemyHeight,
                draw: function() {
                    ctx.fillStyle = '#27ae60'; // 緑色
                    ctx.fillRect(this.x, this.y, this.width, this.height);
                    // ゴーヤーのぶつぶつを表現
                    ctx.fillStyle = '#2ecc71';
                    ctx.fillRect(this.x + 5, this.y + 5, 5, 5);
                    ctx.fillRect(this.x + 15, this.y + 10, 5, 5);
                    ctx.fillRect(this.x + 25, this.y + 5, 5, 5);
                    ctx.fillRect(this.x + 35, this.y + 10, 5, 5);
                    ctx.fillRect(this.x + 45, this.y + 5, 5, 5);
                }
            });
        }
    }
}

createEnemies();

// --- 描画関連 --- //
function clear() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function drawPlayer() {
    player.draw();
}

function drawEnemies() {
    enemies.forEach(enemy => {
        enemy.draw();
    });
}

// --- 更新関連 --- //
function movePlayer() {
    player.x += player.dx;

    // 壁の検出
    if (player.x < 0) {
        player.x = 0;
    }

    if (player.x + player.width > canvas.width) {
        player.x = canvas.width - player.width;
    }
}

function drawPlayerBullets() {
    bullets.forEach(bullet => {
        ctx.fillStyle = '#f1c40f';
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });
}

function movePlayerBullets() {
    bullets.forEach((bullet, index) => {
        bullet.y -= bullet.speed;
        // 画面外に出た弾を削除
        if (bullet.y + bullet.height < 0) {
            bullets.splice(index, 1);
        }
    });
}

function drawEnemyBullets() {
    enemyBullets.forEach(bullet => {
        ctx.fillStyle = '#e74c3c'; // 敵の弾は赤色
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });
}

function moveEnemyBullets() {
    enemyBullets.forEach((bullet, index) => {
        bullet.y += bullet.speed;
        // 画面外に出た弾を削除
        if (bullet.y > canvas.height) {
            enemyBullets.splice(index, 1);
        }
    });
}

function enemyShoot(currentTime) {
    if (currentTime - lastEnemyShot > enemyShootInterval && enemies.length > 0) {
        lastEnemyShot = currentTime;
        const randomEnemy = enemies[Math.floor(Math.random() * enemies.length)];
        const bullet = {
            x: randomEnemy.x + randomEnemy.width / 2 - 2.5,
            y: randomEnemy.y + randomEnemy.height,
            width: 5,
            height: 10,
            speed: 4
        };
        enemyBullets.push(bullet);
    }
}

function moveEnemies() {
    let wallHit = false;
    enemies.forEach(enemy => {
        enemy.x += enemyDx;
        if (enemy.x + enemy.width > canvas.width || enemy.x < 0) {
            wallHit = true;
        }
        // 敵がプレイヤーの位置まで到達したらゲームオーバー
        if (enemy.y + enemy.height > player.y) {
            endGame(false);
        }
    });

    if (wallHit) {
        enemyDx *= -1;
        enemies.forEach(enemy => {
            enemy.y += enemyDy;
        });
    }
}

function detectCollision() {
    // プレイヤーの弾と敵の当たり判定
    bullets.forEach((bullet, bulletIndex) => {
        enemies.forEach((enemy, enemyIndex) => {
            if (
                bullet.x < enemy.x + enemy.width &&
                bullet.x + bullet.width > enemy.x &&
                bullet.y < enemy.y + enemy.height &&
                bullet.y + bullet.height > enemy.y
            ) {
                // 当たったら弾と敵を消す
                setTimeout(() => { // ちらつき防止
                    enemies.splice(enemyIndex, 1);
                    score += 10;
                    scoreEl.innerText = score;
                }, 0);
            }
        });
    });

    // 敵の弾とプレイヤーの当たり判定
    enemyBullets.forEach((bullet, bulletIndex) => {
        if (
            bullet.x < player.x + player.width &&
            bullet.x + bullet.width > player.x &&
            bullet.y < player.y + player.height &&
            bullet.y + bullet.height > player.y
        ) {
            enemyBullets.splice(bulletIndex, 1);
            endGame(false); // 負け
        }
    });
}

function checkWin() {
    if (enemies.length === 0) {
        endGame(true); // 勝ち
    }
}

function endGame(isWin) {
    gameOver = true;
    cancelAnimationFrame(animationId);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.font = '50px Arial';
    ctx.textAlign = 'center';
    if (isWin) {
        ctx.fillText('ゲームクリア！', canvas.width / 2, canvas.height / 2);
    } else {
        ctx.fillText('ゲームオーバー', canvas.width / 2, canvas.height / 2);
    }
    ctx.font = '20px Arial';
    ctx.fillText('ページを更新してリトライ', canvas.width / 2, canvas.height / 2 + 50);
}

// --- 更新関連 --- //
function update(currentTime) {
    if (gameOver) return;

    animationId = requestAnimationFrame(update);

    clear();

    drawPlayer();
    movePlayer();

    drawEnemies();
    moveEnemies();

    drawPlayerBullets();
    movePlayerBullets();

    drawEnemyBullets();
    moveEnemyBullets();
    enemyShoot(currentTime);

    detectCollision();
    checkWin();
}

update();

// --- キーボード操作 --- //
function keyDown(e) {
    if (gameOver) return;
    if (e.key === 'ArrowRight' || e.key === 'Right') {
        player.dx = player.speed;
    } else if (e.key === 'ArrowLeft' || e.key === 'Left') {
        player.dx = -player.speed;
    } else if (e.key === ' ' || e.key === 'Spacebar') {
        shoot();
    }
}

function keyUp(e) {
    if (
        e.key === 'ArrowRight' ||
        e.key === 'Right' ||
        e.key === 'ArrowLeft' ||
        e.key === 'Left'
    ) {
        player.dx = 0;
    }
}

function shoot() {
    // 画面上の弾の数を制限
    if (bullets.length < 5) {
        const bullet = {
            x: player.x + player.width / 2 - 2.5,
            y: player.y,
            width: 5,
            height: 10,
            speed: 7
        };
        bullets.push(bullet);
    }
}

document.addEventListener('keydown', keyDown);
document.addEventListener('keyup', keyUp);
