const logoutButton = document.querySelector("#logoutButton");
const clockInButton = document.querySelector("#clockInButton");
const clockOutButton =document.querySelector("#clockOutButton");
const attendanceMessage = document.querySelector("#attendanceMessage");
const attendanceStatus = document.querySelector("#attendanceStatus");
const clockInTime = document.querySelector("#clockInTime");
const clockOutTime = document.querySelector("#clockOutTime");
const attendanceHistory = document.querySelector("#attendanceHistory");
const breakStartButton = document.querySelector("#breakStartButton");
const breakEndButton = document.querySelector("#breakEndButton");
const breakStartTime = document.querySelector("#breakStartTime");
const breakEndTime = document.querySelector("#breakEndTime");

async function checkLogin() {
  try{
    const response = await fetch("/api/me");
    const result = await response.json();

    if(!response.ok) {
        window.location.href = "/login.html";
        return;
    }

    console.log("ログイン中のユーザー");
    console.log(result.user);
    }catch(error){
        console.error(error);
        window.location.href = "/login.html";
    }
}

async function loadUser(){
  try{
    const response = await fetch("/api/me");
    const data = await response.json();

    if(!response.ok){
      console.error(data.message);
      return;
    }

    const welcomeMessage =
      document.getElementById("welcomeMessage");

    welcomeMessage.textContent = 
    `お疲れ様です、${data.user.username || data.user.email}さん`;

  }catch(error){
    console.error(error);
  }
}

loadUser();

clockInButton.addEventListener("click", async () => {
  try {
    const response = await fetch("/api/attendance/clock-in", {
      method: "POST"
    });

    const result = await response.json();

    if (!response.ok) {
      attendanceMessage.textContent =
        result.message;

      return;
    }

    attendanceMessage.textContent =result.message;
    await loadAttendanceStatus();
    await loadAttendanceHistory();

  } catch (error) {
    console.error(error);

    attendanceMessage.textContent =
      "出勤処理に失敗しました";
  }
});

breakStartButton.addEventListener(
  "click",
  async () => {
    try {
      const response =
        await fetch(
          "/api/attendance/break-start",
          {
            method: "POST"
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        attendanceMessage.textContent =
          result.message;

        return;
      }

      attendanceMessage.textContent =
        result.message;

      await loadAttendanceStatus();
      await loadAttendanceHistory();

    } catch (error) {
      console.error(error);

      attendanceMessage.textContent =
        "休憩開始処理に失敗しました";
    }
  }
);

breakEndButton.addEventListener(
  "click",
  async () => {
    try {
      const response =
        await fetch(
          "/api/attendance/break-end",
          {
            method: "POST"
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        attendanceMessage.textContent =
          result.message;

        return;
      }

      attendanceMessage.textContent = result.message;

      await loadAttendanceStatus();
      await loadAttendanceHistory();

    } catch (error) {
      console.error(error);

      attendanceMessage.textContent =
        "休憩終了処理に失敗しました";
    }
  }
);

clockOutButton.addEventListener("click", async () => {
  try {
    const response =
      await fetch("/api/attendance/clock-out", {
        method: "POST"
      });

    const result =
      await response.json();

    if (!response.ok) {
      attendanceMessage.textContent =
        result.message;

      return;
    }

    attendanceMessage.textContent = result.message;
    await loadAttendanceStatus();
    await loadAttendanceHistory();

  } catch (error) {
    console.error(error);

    attendanceMessage.textContent =
      "退勤処理に失敗しました";
  }
});

logoutButton.addEventListener("click", async () => {
    try {
      const response = await fetch("/api/logout", {
        method: "POST"
      });

      const result = await response.json();

      if (!response.ok) {
        console.error(result.message);
        return;
      }

      window.location.href = "/login.html";
    } catch (error) {
        console.error("ログアウト通信に失敗しました", error);
    }   
});

async function loadAttendanceStatus() {
  try {
    const response = await fetch("/api/attendance/status");
    const result = await response.json();

    attendanceStatus.textContent = result.message;

    if (!response.ok) {
      return;
    }

    const attendance = result.attendance;

    // 時刻表示（状態に関係なく共通）
    clockInTime.textContent = formatTime(attendance?.clock_in);
    clockOutTime.textContent = formatTime(attendance?.clock_out);
    breakStartTime.textContent = formatTime(attendance?.break_start);
    breakEndTime.textContent = formatTime(attendance?.break_end);

    // 最初に全部無効にしてから、押せるものだけ有効にする
    clockInButton.disabled = true;
    breakStartButton.disabled = true;
    breakEndButton.disabled = true;
    clockOutButton.disabled = true;

    if (result.status === "not_clocked_in") {
      clockInButton.disabled = false;
      return;
    }

    if (result.status === "working") {
      clockOutButton.disabled = false;

      // 休憩は1日1回までなので、まだ休憩してない時だけ押せる
      if (attendance.break_start === null) {
        breakStartButton.disabled = false;
      }
      return;
    }

    if (result.status === "on_break") {
      breakEndButton.disabled = false;
      return;
    }

    // finished は全部無効のまま
  } catch (error) {
    console.error(error);

    attendanceStatus.textContent =
      "勤怠状態を確認できませんでした";
  }
}

function calculateWorkMinutes(clockIn, clockOut) {
  if (!clockIn || !clockOut) {
    return 0;
  }

  const startDate = new Date(clockIn);
  const endDate = new Date(clockOut);

  const diff = endDate - startDate;

  return Math.floor(diff / 1000 / 60);
}



function calculateBreakMinutes(start, end) {
  if (!start || !end) {
    return 0;
  }

  const startDate = new Date(start);
  const endDate = new Date(end);

  const diff = endDate - startDate;

  return Math.floor (diff / 1000 / 60);
}



async function loadAttendanceHistory(){
  try {
    const response = await fetch("/api/attendance/history");
    const result = await response.json();

    if(!response.ok) {
      attendanceMessage.textContent = result.message;

      return;
    }

    attendanceHistory.innerHTML = "";

    for (const attendance of result.attendances) {
      const row = document.createElement("tr")

      const dateCell = document.createElement("td");
      const clockInCell = document.createElement("td");
      const clockOutCell = document.createElement("td");
      
      const breakMinutesCell = document.createElement("td");
      const workMinutesCell = document.createElement("td");
      const actualWorkCell = document.createElement("td");
      
      
      const workMinutes = calculateWorkMinutes(
        attendance.clock_in,
        attendance.clock_out
      );

      const breakMinutes = calculateBreakMinutes(
        attendance.break_start,
        attendance.break_end
      );

      const actualWorkMinutes = attendance.clock_out
        ? workMinutes - breakMinutes : null;


      dateCell.textContent = formatDate(attendance.clock_in);
      clockInCell.textContent = formatTime(attendance.clock_in);
      clockOutCell.textContent = formatTime(attendance.clock_out);
      
      breakMinutesCell.textContent = formatMinutes(breakMinutes);
      workMinutesCell.textContent = formatMinutes(workMinutes);
      actualWorkCell.textContent =
      actualWorkMinutes === null ? "--" : formatMinutes(actualWorkMinutes);
      
      row.appendChild(dateCell);
      row.appendChild(clockInCell);
      row.appendChild(clockOutCell);
      row.appendChild(breakMinutesCell);
      row.appendChild(workMinutesCell);
      row.appendChild(actualWorkCell);

      attendanceHistory.appendChild(row);
    }

  }catch (error) {
    console.error(error);

    attendanceMessage.textContent = "勤怠履歴を取得できませんでした";
  }
}

function formatMinutes(minutes) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes}分`;
  }

  return `${hours}時間${remainingMinutes}分`;
}

function formatTime(dateString) {
  if(!dateString) {
    return "--";
  }

  const date = new Date(dateString);

  return date.toLocaleTimeString(
    "ja-JP",
    {
      hour: "2-digit",
      minute: "2-digit"
    }
  );
}

function formatDate(dateString){
  const date = new Date(dateString);

  return date.toLocaleDateString(
    "ja-JP",
    {
      month: "2-digit",
      day: "2-digit"
    }
  );
}

checkLogin();
loadAttendanceStatus();
loadAttendanceHistory();
