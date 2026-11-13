const userList = document.querySelector("#userList");
const adminMessage = document.querySelector("#adminMessage");
const logoutButton = document.querySelector("#logoutButton");


async function loadUserList(){
  try {
    const response = await fetch("/api/admin/users");
    const result = await response.json();

    if(!response.ok) {
      adminMessage.textContent = result.message;

      return;
    }

    userList.innerHTML = "";

    for (const user of result.users) {
      const row = document.createElement("tr");

const idCell = document.createElement("td");
const nameCell = document.createElement("td");
const emailCell = document.createElement("td");

idCell.textContent = user.id;
nameCell.textContent = user.username || "--";
emailCell.textContent = user.email;

row.appendChild(idCell);
row.appendChild(nameCell);
row.appendChild(emailCell);

userList.appendChild(row)      
    }

  }catch (error) {
    console.error(error);

    adminMessage.textContent = "ユーザー一覧を取得できませんでした";
  }
}

row.addEventListener("click", () => loadUserAttendances(user));

async function loadUserAttendances(user) {
  const res = await fetch(`/api/admin/users/${user.id}/attendances`);
  const result = await res.json();
  if (!res.ok) { adminMessage.textContent = result.message; return; }
  detailTitle.textContent = `${user.username || user.email}さんの勤怠`;
  attendanceList.innerHTML = "";
  for (const a of result.attendances) {
    const tr = document.createElement("tr");
    for (const v of [formatDate(a.clock_in), formatTime(a.clock_in), formatTime(a.clock_out), formatTime(a.break_start), formatTime(a.break_end)]) {
      const td = document.createElement("td");
      td.textContent = v;
      tr.appendChild(td);
    }
    attendanceList.appendChild(tr);
  }
}

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

loadUserList();