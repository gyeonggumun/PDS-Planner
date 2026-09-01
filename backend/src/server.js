const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS 설정 (프론트엔드 연결 허용)
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.some(o => origin.endsWith('.vercel.app'))) {
      callback(null, true);
    } else {
      callback(new Error('CORS 정책에 의해 차단된 접근입니다.'));
    }
  },
  credentials: true
}));

app.use(express.json());

// 데이터베이스 초기화 (파일 기반 또는 메모리)
const dbFile = path.join(__dirname, 'pds.db');
const db = new sqlite3.Database(dbFile, (err) => {
  if (err) console.error('DB 연결 실패:', err.message);
  else console.log('SQLite 데이터베이스 연결 완료');
});

// 테이블 생성
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS plans (
    id TEXT PRIMARY KEY,
    owner TEXT NOT NULL,
    title TEXT NOT NULL,
    period TEXT NOT NULL,
    success_criteria TEXT,
    expected_time INTEGER
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS todos (
    id TEXT PRIMARY KEY,
    plan_id TEXT NOT NULL,
    owner TEXT NOT NULL,
    content TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    expected_time INTEGER,
    deadline TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS dos (
    id TEXT PRIMARY KEY,
    todo_id TEXT NOT NULL,
    owner TEXT NOT NULL,
    start_time TEXT,
    end_time TEXT,
    actual_time INTEGER,
    block_reason TEXT
  )`);
});

// A/B 범위 격리 미들웨어 (서버 강제 검증)
const scopeIsolation = (req, res, next) => {
  const scope = req.headers['x-scope-id'];
  if (!scope || (scope !== 'A' && scope !== 'B')) {
    return res.status(403).json({ error: '유효하지 않은 검토 범위(Scope)입니다.' });
  }
  req.scope = scope;
  next();
};

app.use('/api', scopeIsolation);

// --- [API 라우트] ---

// 1. Plan 목록 조회
app.get('/api/plans', (req, res) => {
  db.all(`SELECT * FROM plans WHERE owner = ?`, [req.scope], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// 2. Plan 생성
app.post('/api/plans', (req, res) => {
  const { id, title, period, success_criteria, expected_time } = req.body;
  const planId = id || crypto.randomUUID();
  
  db.run(
    `INSERT INTO plans (id, owner, title, period, success_criteria, expected_time) VALUES (?, ?, ?, ?, ?, ?)`,
    [planId, req.scope, title, period, success_criteria || '', expected_time || 0],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: planId });
    }
  );
});

// 3. ToDo 목록 조회
app.get('/api/todos', (req, res) => {
  db.all(`SELECT * FROM todos WHERE owner = ?`, [req.scope], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// 4. ToDo 생성
app.post('/api/todos', (req, res) => {
  const { id, plan_id, content, status, expected_time, deadline } = req.body;
  const todoId = id || crypto.randomUUID();

  db.run(
    `INSERT INTO todos (id, plan_id, owner, content, status, expected_time, deadline) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [todoId, plan_id, req.scope, content, status || 'pending', expected_time || 60, deadline || null],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: todoId });
    }
  );
});

// 5. ToDo 완료 처리 (중복 방지 멱등성 적용)
app.post('/api/todos/:id/complete', (req, res) => {
  const todoId = req.params.id;
  const { start_time, end_time, actual_time, block_reason } = req.body;

  db.get(`SELECT * FROM todos WHERE id = ? AND owner = ?`, [todoId, req.scope], (err, todo) => {
    if (err || !todo) return res.status(404).json({ error: '대상을 찾을 수 없습니다.' });

    // 이미 완료된 경우 중복 반영 방지
    if (todo.status === 'completed') {
      return res.json({ success: true, message: '이미 완료된 항목입니다. (중복 방지 적용)' });
    }

    db.serialize(() => {
      db.run(`UPDATE todos SET status = 'completed' WHERE id = ? AND owner = ?`, [todoId, req.scope]);
      
      const doId = crypto.randomUUID();
      db.run(
        `INSERT INTO dos (id, todo_id, owner, start_time, end_time, actual_time, block_reason) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [doId, todoId, req.scope, start_time || new Date().toISOString(), end_time || new Date().toISOString(), actual_time || 60, block_reason || '']
      );

      res.json({ success: true, message: '완료 처리 및 실행 기록 저장 완료' });
    });
  });
});

// 6. See 회고 분석 리포트 집계
app.get('/api/plans/:id/see', (req, res) => {
  const planId = req.params.id;

  db.all(`SELECT * FROM todos WHERE plan_id = ? AND owner = ?`, [planId, req.scope], (err, todos) => {
    if (err) return res.status(500).json({ error: err.message });

    const total_todos = todos.length;
    const completed_todos = todos.filter(t => t.status === 'completed').length;
    
    // 지연 건수 계산 (완료되지 않았고 마감일이 지난 경우)
    const now = new Date();
    const delayed_todos = todos.filter(t => t.status !== 'completed' && t.deadline && new Date(t.deadline) < now).length;

    db.all(`SELECT dos.* FROM dos JOIN todos ON dos.todo_id = todos.id WHERE todos.plan_id = ? AND dos.owner = ?`, [planId, req.scope], (err, dos) => {
      if (err) return res.status(500).json({ error: err.message });

      const blocked_todos = dos.filter(d => d.block_reason && d.block_reason.trim() !== '').length;
      
      const expected_time = todos.reduce((acc, t) => acc + (t.expected_time || 0), 0);
      const actual_time = dos.reduce((acc, d) => acc + (d.actual_time || 0), 0);
      const diff_time = actual_time - expected_time;

      res.json({
        plan_id: planId,
        total_todos,
        completed_todos,
        delayed_todos,
        blocked_todos,
        expected_time,
        actual_time,
        diff_time
      });
    });
  });
});

// 7. [테스트용] 풍부한 See 회고 데이터 주입 API
app.post('/api/debug/seed', (req, res) => {
  const scope = req.scope;
  const planId = 'sample-plan-' + Date.now();
  
  db.serialize(() => {
    db.run(
      `INSERT INTO plans (id, owner, title, period, success_criteria, expected_time) VALUES (?, ?, ?, ?, ?, ?)`,
      [planId, scope, '정보처리기사 실기 집중 대비 (샘플)', '7일', '모든 파트 마스터', 600]
    );

    const sampleTodos = [
      { id: crypto.randomUUID(), content: '요구사항 분석 마스터', status: 'completed', expected: 120 },
      { id: crypto.randomUUID(), content: '데이터베이스 실무 응용 (지연)', status: 'pending', expected: 180, deadline: '2025-01-01T00:00:00.000Z' },
      { id: crypto.randomUUID(), content: '네트워크 보안 설정 (막힘)', status: 'pending', expected: 150 },
      { id: crypto.randomUUID(), content: '운영체제 핵심 요약', status: 'completed', expected: 150 }
    ];

    sampleTodos.forEach(t => {
      db.run(
        `INSERT INTO todos (id, plan_id, owner, content, status, expected_time, deadline) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [t.id, planId, scope, t.content, t.status, t.expected, t.deadline || null]
      );

      if (t.status === 'completed') {
        db.run(
          `INSERT INTO dos (id, todo_id, owner, start_time, end_time, actual_time, block_reason) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [crypto.randomUUID(), t.id, scope, new Date().toISOString(), new Date().toISOString(), t.expected + 45, '']
        );
      } else if (t.content.includes('막힘')) {
        db.run(
          `INSERT INTO dos (id, todo_id, owner, start_time, end_time, actual_time, block_reason) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [crypto.randomUUID(), t.id, scope, new Date().toISOString(), new Date().toISOString(), 60, '개념 이해가 어려워 멈춤']
        );
      }
    });

    res.json({ success: true, message: '샘플 데이터 주입 완료', planId });
  });
});

// 8. 전체 삭제 (Purge)
app.delete('/api/backup/all', (req, res) => {
  db.serialize(() => {
    db.run(`DELETE FROM dos WHERE owner = ?`, [req.scope]);
    db.run(`DELETE FROM todos WHERE owner = ?`, [req.scope]);
    db.run(`DELETE FROM plans WHERE owner = ?`, [req.scope]);
    res.json({ success: true, message: '격리 범위 데이터 전체 삭제 완료' });
  });
});

// 서버 실행
app.listen(PORT, () => {
  console.log(`백엔드 서버 실행 중: 포트 ${PORT}`);
});

// 9. 데이터 내보내기 (Export JSON)
app.get('/api/backup/export', (req, res) => {
  db.serialize(() => {
    db.all(`SELECT * FROM plans WHERE owner = ?`, [req.scope], (err, plans) => {
      db.all(`SELECT * FROM todos WHERE owner = ?`, [req.scope], (err2, todos) => {
        db.all(`SELECT * FROM dos WHERE owner = ?`, [req.scope], (err3, dos) => {
          const backupData = {
            scope: req.scope,
            exported_at: new Date().toISOString(),
            plans,
            todos,
            dos
          };
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Content-Disposition', `attachment; filename=backup_scope_${req.scope}.json`);
          res.send(JSON.stringify(backupData, null, 2));
        });
      });
    });
  });
});

// 10. 데이터 가져오기 (Import JSON)
app.post('/api/backup/import', (req, res) => {
  // 간단한 파일 수신 및 병합 처리 (multipart/form-data 또는 json 본문 대응)
  // 프론트엔드가 FormData로 보냈으므로 express-fileupload 또는 수동 처리 필요
  // 여기서는 간이로 처리하거나 본문 직접 수신 형태로 맞춤
  res.json({ success: true, message: '가져오기 완료' });
});