const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('./db'); // 이전에 만든 db.js 연동

const router = express.Router();

// ToDo 완료 처리 및 Do 기록 생성 API
router.post('/todos/:id/complete', (req, res) => {
  const todoId = req.params.id;
  const owner = req.userScope; // 미들웨어에서 강제 주입된 A/B 범위
  const { idempotency_key, start_time, end_time, actual_time, block_reason } = req.body;

  if (!idempotency_key) {
    return res.status(400).json({ error: "중복 방지를 위한 idempotency_key가 필요합니다." });
  }

  // 1. 소유권 확인: A 범위에서 B 자료를 조작하려는지 검사하여 격리 (T06-C50, C55)
  db.get(`SELECT id FROM todos WHERE id = ? AND owner = ?`, [todoId, owner], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    
    // 존재하지 않거나 타인의 데이터인 경우 존재를 숨기는 404 반환
    if (!row) {
      return res.status(404).json({ error: "존재하지 않거나 권한이 없는 할 일입니다." });
    }

    // 2. Do 실행 기록 생성 (T06-C23 ~ C26 충족)
    const doId = uuidv4();
    const insertDoQuery = `
      INSERT INTO do_records (id, todo_id, owner, start_time, end_time, actual_time, block_reason, idempotency_key)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(insertDoQuery, [doId, todoId, owner, start_time, end_time, actual_time, block_reason, idempotency_key], function (insertErr) {
      if (insertErr) {
        // UNIQUE 제약 조건 위반 에러 발생 시 (같은 완료 요청 두 번 보냄)
        if (insertErr.message.includes('UNIQUE constraint failed')) {
          // 서버 에러를 내지 않고 이미 성공한 것처럼 200 OK 반환 (T06-C21, C22 충족)
          return res.status(200).json({ 
            message: "이미 처리된 완료 요청입니다. 완료 기록은 1건만 유지됩니다." 
          });
        }
        return res.status(500).json({ error: insertErr.message });
      }

      // 3. 실행 기록이 정상 삽입되면 ToDo 상태를 '완료(completed)'로 변경 (T06-C11)
      db.run(`UPDATE todos SET status = 'completed' WHERE id = ?`, [todoId], function (updateErr) {
        if (updateErr) return res.status(500).json({ error: updateErr.message });

        res.status(200).json({ message: "성공적으로 완료 처리되었습니다." });
      });
    });
  });
});

module.exports = router;