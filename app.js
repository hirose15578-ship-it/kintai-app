require("dotenv").config();

const path = require("path");
const session = require("express-session");
const bcrypt = require("bcrypt");
const pool = require("./db");
const app = express();
const PORT = 3000;

// JSON形式で送られたデータを読み取れるようにする
app.use(express.json());

//セッションの設定
app.use(
 session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,

  cookie: {
    httpOnly: true,
    maxAge: 1000 * 60 * 30
  }
 }) 
);

// publicフォルダ内のHTML・CSS・JavaScriptを公開する
app.use(express.static(path.join(__dirname, "public")));



// ログイン情報を受け取るAPI
app.post("/api/login", async (request, response) => {
  const email = request.body.email;
  const password = request.body.password;

  console.log("ログインリクエストを受信しました");

  if (!email || !password) {
    return response.status(400).json({
      success: false,
      message: "メールアドレスとパスワードを入力してください"
    });
  }

  try {
    const [rows] = await pool.execute(
      "SELECT id, username, email, password_hash, is_admin FROM users WHERE email = ?", [email]
    );
  
    console.log("入力されたemail:", email);

    if (rows.length === 0) {
      return response.status(401).json({
        success: false,
        message: "メールアドレスまたはパスワードが正しくありません"
      });
    }

    const user = rows[0];

    const isPasswordCorrect = 
      await bcrypt.compare(password, user.password_hash);

    if (!isPasswordCorrect) {
      return response.status(401).json({
        success: false,
        message: "メールアドレスまたはパスワードが正しくありません"
      });
    }

    request.session.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      is_admin: user.is_admin
    };

    console.log("ログイン成功");

    return response.status(200).json({
      success: true,
      message: "ログインに成功しました"
    });

  } catch (error) {
    console.error("ログイン処理エラー:", error);

    return response.status(500).json({
      success: false,
      message: "サーバー内部でエラーが発生しました"
    });
  }
});

app.get("/api/me", (request, response) => {
  if(!request.session.user){
    return response.status(401).json({
      success: false,
      message: "ログインしていません"
    });
  }


  return response.status(200).json({
    success: true,
    user: request.session.user
  });

});

//ログアウト
app.post("/api/logout", (request, response) =>{
  request.session.destroy((error) => {
    if (error) {
      console.error("ログアウト処理に失敗しました", error);

      return response.status(500).json({
        success: false,
        message:"ログアウトに失敗しました"
      });
    }

    response.clearCookie("connect.sid");

    console.log("ログアウト成功");

    return response.status(200).json({
      success: true,
      message: "ログアウトしました"
    });
  });
});

//会員登録
app.post(
  "/api/register",
  async (request, response) => {
    
    const username = request.body.username;
    const email = request.body.email;
    const password = request.body.password;

    if(!username || !email || !password) {
      return response.status(400).json({
        success: false,
        message: "ユーザー名、メールアドレス、パスワードを入力してください"
      });
    }

    if (password.length < 8) {
      return response.status(400).json({
        success: false,
        message:
          "パスワードは8文字以上で入力してください"
      });
    }

    try {
      const [rows] =
        await pool.execute(
          "SELECT id FROM users WHERE email = ?",
          [email]
        );

      if (rows.length > 0) {
        return response.status(409).json({
          success: false,
          message:
            "このメールアドレスはすでに登録されています"
        });
      }

      const passwordHash =
        await bcrypt.hash(
          password,
          10
        );

      await pool.execute(
        `
        INSERT INTO users
          (username, email, password_hash)
        VALUES
          (?, ?, ?)
        `,
        [username, email, passwordHash]
      );

      console.log(
        "会員登録成功:",
        email
      );

      return response.status(201).json({
        success: true,
        message:
          "会員登録が完了しました"
      });

    } catch (error) {
      console.error(
        "会員登録エラー:",
        error
      );

      return response.status(500).json({
        success: false,
        message:
          "サーバー内部でエラーが発生しました"
      });
    }
  }
);

//出勤打刻
app.post(
  "/api/attendance/clock-in",
  async (request, response) => {

    if (!request.session.user) {
      return response.status(401).json({
        success: false,
        message: "ログインしてください"
      });
    }

    const userId =
      request.session.user.id;

    try {
      const [rows] = await pool.execute(
        `
        SELECT id, clock_in
        FROM attendances
        WHERE user_id = ?
          AND DATE(clock_in) = CURDATE()
        `,
        [userId]
      );

      if (rows.length > 0) {
        return response.status(409).json({
          success: false,
          message: "本日はすでに出勤済みです"
        });
      }

      await pool.execute(
        `
        INSERT INTO attendances
          (user_id, clock_in)
        VALUES
          (?, NOW())
        `,
        [userId]
      );

      console.log("出勤:", userId);

      return response.status(201).json({
        success: true,
        message: "出勤しました"
      });

    } catch (error) {
      console.error(
        "出勤処理エラー:",
        error
      );

      return response.status(500).json({
        success: false,
        message:
          "出勤処理に失敗しました"
      });
    }
  }
);

//退勤打刻
app.post(
  "/api/attendance/clock-out",
  async (request, response) => {

    if (!request.session.user) {
      return response.status(401).json({
        success: false,
        message: "ログインしてください"
      });
    }

    const userId =
      request.session.user.id;

    try {
      const [rows] = await pool.execute(
        `
        SELECT id, clock_in, clock_out,break_start, break_end
        FROM attendances
        WHERE user_id = ?
          AND DATE(clock_in) = CURDATE()
        `,
        [userId]
      );

      if (rows.length === 0) {
        return response.status(409).json({
          success: false,
          message: "本日の出勤記録がありません"
        });
      }

      const attendance = rows[0];

      if (attendance.clock_out !== null) {
        return response.status(409).json({
          success: false,
          message: "本日はすでに退勤済みです"
        });
      }

      if (
        attendance.break_start !== null &&
        attendance.break_end === null
      ) {
        return response.status(409).json({
          success: false,
          message: "休憩を終了してから退勤してください"
        });
      }

      await pool.execute(
        `
        UPDATE attendances
        SET clock_out = NOW()
        WHERE id = ?
        `,
        [attendance.id]
      );

      console.log("退勤:", userId);

      return response.status(200).json({
        success: true,
        message: "退勤しました"
      });

    } catch (error) {
      console.error(
        "退勤処理エラー:",
        error
      );

      return response.status(500).json({
        success: false,
        message: "退勤処理に失敗しました"
      });
    }
  }
);

//休憩開始
app.post(
  "/api/attendance/break-start",
  async (request, response) => {

    if (!request.session.user) {
      return response.status(401).json({
        success: false,
        message: "ログインしてください"
      });
    }

    const userId = request.session.user.id;

    try {
      const [rows] = await pool.execute(
        `
        SELECT
          id,
          clock_in,
          clock_out,
          break_start,
          break_end
        FROM attendances
        WHERE user_id = ?
          AND DATE(clock_in) = CURDATE()
        `,
        [userId]
      );

      if (rows.length === 0) {
        return response.status(409).json({
          success: false,
          message: "本日の出勤記録がありません"
        });
      }

      const attendance = rows[0];

      if (attendance.clock_out !== null) {
        return response.status(409).json({
          success: false,
          message: "すでに退勤済みです"
        });
      }

      if (attendance.break_start !== null) {
        return response.status(409).json({
          success: false,
          message: "すでに休憩を開始しています"
        });
      }

      await pool.execute(
        `
        UPDATE attendances
        SET break_start = NOW()
        WHERE id = ?
        `,
        [attendance.id]
      );

      console.log("休憩開始:", userId);

      return response.status(200).json({
        success: true,
        message: "休憩を開始しました"
      });

    } catch (error) {
      console.error(
        "休憩開始処理エラー:",
        error
      );

      return response.status(500).json({
        success: false,
        message: "休憩開始処理に失敗しました"
      });
    }
  }
);

//休憩終了
app.post(
  "/api/attendance/break-end",
  async (request, response) => {

    if (!request.session.user) {
      return response.status(401).json({
        success: false,
        message: "ログインしてください"
      });
    }

    const userId = request.session.user.id;

    try {
      const [rows] = await pool.execute(
        `
        SELECT
          id,
          clock_in,
          clock_out,
          break_start,
          break_end
        FROM attendances
        WHERE user_id = ?
          AND DATE(clock_in) = CURDATE()
        `,
        [userId]
      );

      if (rows.length === 0) {
        return response.status(409).json({
          success: false,
          message: "本日の出勤記録がありません"
        });
      }

      const attendance = rows[0];

      if (attendance.clock_out !== null) {
        return response.status(409).json({
          success: false,
          message: "すでに退勤済みです"
        });
      }

      if (attendance.break_start === null) {
        return response.status(409).json({
          success: false,
          message: "休憩を開始していません"
        });
      }

      if (attendance.break_end !== null) {
        return response.status(409).json({
          success: false,
          message: "すでに休憩を終了しています"
        });
      }

      await pool.execute(
        `
        UPDATE attendances
        SET break_end = NOW()
        WHERE id = ?
        `,
        [attendance.id]
      );

      console.log("休憩終了:", userId);

      return response.status(200).json({
        success: true,
        message: "休憩を終了しました"
      });

    } catch (error) {
      console.error(
        "休憩終了処理エラー:",
        error
      );

      return response.status(500).json({
        success: false,
        message: "休憩終了処理に失敗しました"
      });
    }
  }
);
    
app.get(
  "/api/attendance/status",
  async (request, response) => {
    if (!request.session.user) {
      return response.status(401).json({
        success: false,
        message: "ログインしてください"
      });
    }

    const userId = request.session.user.id;

    try {
      const [rows] = await pool.execute(
        `
        SELECT 
          id, clock_in, clock_out,
          break_start, break_end
          FROM attendances
          WHERE user_id = ?
          AND DATE(clock_in) = CURDATE()
        `,
        [userId]
      );

      if (rows.length === 0) {
        return response.status(200).json({
          success: true,
          status: "not_clocked_in",
          message: "未出勤です"
        });
      }

      const attendance = rows[0];

      if (attendance.break_start !== null &&
          attendance.break_end === null){
        return response.status(200).json({
          success:true,
          status:"on_break",
          message: "休憩中です",
          attendance: attendance
        });
      }

      if (attendance.clock_out === null){
        return response.status(200).json({
          success:true,
          status:"working",
          message: "出勤中です",
          attendance: attendance
        });
      }

      return response.status(200).json({
        success: true,
        status: "finished",
        message: "退勤済みです",
        attendance: attendance
      });
    } catch (error) {
      console.error(
        "勤怠状態取得エラー",
        error
      );

      return response.status(500).json({
        success: false,
        message: "勤怠状態を取得できませんでした"
      });
    }
  }
);

app.get(
  "/api/attendance/history",
  async (request, response) => {

    if (!request.session.user) {
      return response.status(401).json({
        success: false,
        message: "ログインしてください"
      });
    }

    const userId = request.session.user.id;

    try {
      const [rows] = await pool.execute(
        `
        SELECT
          id,
          clock_in,
          clock_out,
          break_start,
          break_end
        FROM attendances
        WHERE user_id = ?
        ORDER BY clock_in DESC
        `,
        [userId]
      );

      return response.status(200).json({
        success: true,
        attendances: rows
      });

    }catch (error) {
      console.error("勤怠履歴取得エラー：", error);

      return response.status(500).json({
        success: false,
        message: "勤怠履歴を取得できませんでした"
      });
    }
  }
);


// 3000番ポートでサーバーを起動する
app.listen(PORT, () => {
  console.log(`サーバーを起動しました`);
  console.log(`http://localhost:${PORT}/login.html`);
});