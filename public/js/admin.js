const userList = document.querySelector("#userList");
const adminMessage = document.querySelector("#adminMessage");


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

loadUserList();